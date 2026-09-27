"""
Retrieval + generation for the Ask Ambedkar / Debates Explorer RAG pipeline.

query -> retrieve top-k chunks from ChromaDB -> LLM (Grok, via OpenAI-
compatible API) with a strict citation-enforcing system prompt -> cited
answer, or an explicit "not in the archive" fallback.

Requires: GROQ_API_KEY environment variable (get one free at
https://console.groq.com/keys — note this is Groq, the fast-inference
company, NOT Grok/xAI; Groq keys start with "gsk_"). Put it in a .env
file in the project root:
    GROQ_API_KEY=gsk_xxxxxxxxxxxx
"""
import os
import sys
from openai import OpenAI
from dotenv import load_dotenv

sys.path.insert(0, os.path.dirname(__file__))
from ingest import debates_collection, writings_collection

load_dotenv()

GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise RuntimeError(
        "GROQ_API_KEY not set. Create a .env file in the project root with:\n"
        "GROQ_API_KEY=gsk_xxxxxxxxxxxx\n"
        "(get a free key at https://console.groq.com/keys)"
    )

client = OpenAI(api_key=GROQ_API_KEY, base_url="https://api.groq.com/openai/v1")
GROQ_MODEL = "openai/gpt-oss-20b"  # Groq's current free-tier catalog (llama-3.3 was deprecated); use openai/gpt-oss-120b for higher quality

MODE_PROMPTS = {
    "student": (
        "Answer in simple, accessible language suitable for a school student. "
        "Avoid jargon; explain any constitutional or legal terms you use."
    ),
    "scholar": (
        "Answer with academic precision, using correct constitutional and "
        "historical terminology. Assume the reader has background knowledge."
    ),
    "constitutional": (
        "Answer with a focus on constitutional interpretation and legal "
        "reasoning — cite the relevant article/provision framing where the "
        "retrieved content supports it."
    ),
}

SYSTEM_PROMPT_TEMPLATE = """You are "Ask Ambedkar", part of a Digital Heritage Archive for Dr. B.R. Ambedkar, built for the Ministry of Social Justice & Empowerment.

STRICT RULES — follow all of them:
1. Answer ONLY using the retrieved context chunks provided below. Never use outside knowledge about Ambedkar, the Constitution, or Indian history, even if you know it.
2. If the retrieved chunks do not contain information relevant to the question, respond exactly: "This isn't in the archive yet." Do not guess, infer, or fill gaps.
3. Every claim must be followed by a citation in the format (CAD Vol. <volume>, <date>) or (Writings, Vol. <volume>, p. <page>), matching the metadata of the chunk it came from. Use the exact citation string given for each chunk — do not construct your own.
4. Some retrieved chunks are marked as SUMMARIES, not verbatim speech text. When you draw on a summary chunk, phrase your answer as reporting what Ambedkar addressed/argued/explained — never as a direct quotation, and never put words in quotation marks that aren't an exact quote from the source.
5. Never fabricate a citation. If you're unsure which chunk supports a claim, don't make the claim.

{mode_instruction}

--- RETRIEVED CONTEXT ---
{context}
--- END CONTEXT ---
"""


def retrieve(query: str, n_results: int = 5, corpus: str = "both") -> list[dict]:
    """
    Query the debates and/or writings collections, return chunks with metadata.
    corpus: "debates", "writings", or "both"
    """
    results = []
    collections = []
    if corpus in ("debates", "both"):
        collections.append(debates_collection)
    if corpus in ("writings", "both"):
        collections.append(writings_collection)

    for coll in collections:
        if coll.count() == 0:
            continue
        res = coll.query(query_texts=[query], n_results=min(n_results, coll.count()))
        for doc, meta, dist in zip(
            res["documents"][0], res["metadatas"][0], res["distances"][0]
        ):
            results.append({"text": doc, "metadata": meta, "distance": dist})

    # sort by relevance (lower distance = closer) across both collections combined
    results.sort(key=lambda r: r["distance"])
    return results[:n_results]


def format_context(chunks: list[dict]) -> str:
    if not chunks:
        return "(no relevant chunks retrieved)"
    lines = []
    for i, c in enumerate(chunks):
        m = c["metadata"]
        tag = "[SUMMARY]" if m.get("record_type") == "summary" else "[SOURCE TEXT]"
        if m.get("source") == "debates":
            citation = f"(CAD Vol. {m.get('volume', '?')}, {m.get('date', '?')})"
        else:
            page = m.get("page_or_session") or "n/a"
            citation = f"(Writings, Vol. {m.get('volume', '?')}, p. {page})"
        lines.append(
            f"{tag} Chunk {i+1} — USE EXACTLY THIS CITATION: {citation}\n{c['text']}"
        )
    return "\n\n".join(lines)


def ask(question: str, mode: str = "student", n_results: int = 5, corpus: str = "both") -> dict:
    """
    Full RAG call: retrieve -> build prompt -> generate -> return answer + sources.
    """
    mode = mode.lower()
    if mode not in MODE_PROMPTS:
        mode = "student"

    chunks = retrieve(question, n_results=n_results, corpus=corpus)
    context = format_context(chunks)
    system_prompt = SYSTEM_PROMPT_TEMPLATE.format(
        mode_instruction=MODE_PROMPTS[mode], context=context
    )

    response = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": question},
        ],
        temperature=0.2,  # low temperature — this is a citation-grounded task, not creative writing
    )

    answer = response.choices[0].message.content

    return {
        "answer": answer,
        "mode": mode,
        "sources": [
            {
                "date": c["metadata"].get("date"),
                "volume": c["metadata"].get("volume"),
                "title": c["metadata"].get("title"),
                "type": c["metadata"].get("record_type", "source_text"),
            }
            for c in chunks
        ],
    }


if __name__ == "__main__":
    # Quick interactive test loop
    print("Ask Ambedkar — test console (Ctrl+C to quit)")
    print("Modes: student / scholar / constitutional\n")
    while True:
        try:
            q = input("\nQuestion: ").strip()
            if not q:
                continue
            mode = input("Mode [student]: ").strip() or "student"
            result = ask(q, mode=mode)
            print(f"\n--- Answer ({result['mode']}) ---")
            print(result["answer"])
            print("\n--- Sources retrieved ---")
            for s in result["sources"]:
                print(f"  - {s['title']} | Vol. {s['volume']}, {s['date']} | {s['type']}")
        except KeyboardInterrupt:
            print("\nBye.")
            break
        except Exception as e:
            print(f"Error: {e}")