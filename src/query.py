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

LANG_PROMPTS = {
    "en": "Respond in English.",
    "hi": "Respond entirely in Hindi (Devanagari script). Keep citations like (CAD Vol. X, date) exactly as given, in their original Roman form — never translate citation text. Always render 'Ambedkar' as 'आंबेडकर' or 'अम्बेडकर' consistently, never any other name. Do not use quotation marks around any word or phrase — nothing in this archive is a verified verbatim quote.",
    "mr": "Respond entirely in Marathi (Devanagari script). Keep citations like (CAD Vol. X, date) exactly as given, in their original Roman form — never translate citation text. Always render 'Ambedkar' as 'आंबेडकर', never any other name — double-check this before finalizing your answer. Do not use quotation marks around any word or phrase — nothing in this archive is a verified verbatim quote.",
    "ta": "Respond entirely in Tamil script, using the standard constitutional-Tamil term அடிப்படை உரிமைகள் for 'fundamental rights' (not மூல உரிமைகள்). Keep citations like (CAD Vol. X, date) exactly as given, in their original Roman form — never translate citation text. Always render 'Ambedkar' as 'அம்பேத்கர்'. Do not use quotation marks around any word or phrase — nothing in this archive is a verified verbatim quote.Do not use quotation marks around translated or paraphrased terms.Do not repeat the same phrase or clause twice in one answer — if you notice yourself repeating, rephrase once and stop.",
}

NOT_IN_ARCHIVE = {
    "en": "This isn't in the archive yet.",
    "hi": "यह अभी संग्रह में उपलब्ध नहीं है।",
    "mr": "हे अद्याप संग्रहात उपलब्ध नाही.",
    "ta": "இது இன்னும் காப்பகத்தில் இல்லை.",
}

GEN_UNAVAILABLE = {
    "en": "Answer generation is temporarily unavailable, but here's what the archive found relevant to your question — see sources below.",
    "hi": "उत्तर तैयार करना अस्थायी रूप से उपलब्ध नहीं है, लेकिन संग्रह में आपके प्रश्न से संबंधित यह सामग्री मिली — नीचे स्रोत देखें।",
    "mr": "उत्तर तयार करणे तात्पुरते उपलब्ध नाही, पण संग्रहात तुमच्या प्रश्नाशी संबंधित खालील माहिती सापडली — खालील स्रोत पहा.",
    "ta": "பதில் உருவாக்கம் தற்காலிகமாகக் கிடைக்கவில்லை, ஆனால் காப்பகத்தில் உங்கள் கேள்விக்குத் தொடர்புடையவை கிடைத்தன — கீழே மூலங்களைப் பார்க்கவும்.",
}

NOT_IN_ARCHIVE_AND_UNAVAILABLE = {
    "en": "This isn't in the archive yet, and generation is temporarily unavailable.",
    "hi": "यह अभी संग्रह में नहीं है, और उत्तर तैयार करना भी अस्थायी रूप से उपलब्ध नहीं है।",
    "mr": "हे अद्याप संग्रहात नाही, आणि उत्तर तयार करणे तात्पुरते उपलब्ध नाही.",
    "ta": "இது இன்னும் காப்பகத்தில் இல்லை, மேலும் பதில் உருவாக்கமும் தற்காலிகமாகக் கிடைக்கவில்லை.",
}

SYSTEM_PROMPT_TEMPLATE = """You are "Ask Ambedkar", part of a Digital Heritage Archive for Dr. B.R. Ambedkar, built for the Ministry of Social Justice & Empowerment.

STRICT RULES — follow all of them:
1. Answer ONLY using the retrieved context chunks provided below. Never use outside knowledge about Ambedkar, the Constitution, or Indian history, even if you know it.
2. If the retrieved chunks do not contain information relevant to the question, respond exactly: "{not_in_archive}". Do not guess, infer, or fill gaps.
3. Every claim must be followed by a citation in the format (CAD Vol. <volume>, <date>) or (Writings, Vol. <volume>, p. <page>), matching the metadata of the chunk it came from. Use the exact citation string given for each chunk — do not construct your own. Citations stay in their original Roman form regardless of response language.
4. Some retrieved chunks are marked as SUMMARIES, not verbatim speech text. When you draw on a summary chunk, phrase your answer as reporting what Ambedkar addressed/argued/explained — never as a direct quotation, and never put words in quotation marks that aren't an exact quote from the source.
5. Never fabricate a citation. If you're unsure which chunk supports a claim, don't make the claim.

{mode_instruction}
{lang_instruction}

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
            title = m.get("title") or "Untitled"
            chunk_idx = m.get("chunk_index")
            if chunk_idx is not None:
                citation = f"(Writings, \"{title}\", Vol. {m.get('volume', '?')}, section {chunk_idx + 1})"
            else:
                citation = f"(Writings, \"{title}\", Vol. {m.get('volume', '?')})"
        lines.append(
            f"{tag} Source #{i+1} — USE EXACTLY THIS CITATION: {citation}\n{c['text']}"
        )
    return "\n\n".join(lines)


def ask(question: str, mode: str = "student", n_results: int = 5, corpus: str = "both",
         history: list[dict] | None = None, lang: str = "en") -> dict:
    mode = mode.lower()
    if mode not in MODE_PROMPTS:
        mode = "student"
    lang = lang.lower()
    if lang not in LANG_PROMPTS:
        lang = "en"

    # drop malformed history entries (missing role/content) so they can't break the LLM call
    history = [
        h for h in (history or [])
        if h.get("role") in ("user", "assistant") and isinstance(h.get("content"), str)
    ]

    retrieval_query = question
    if history:
        last_user_msgs = [h["content"] for h in history if h.get("role") == "user"]
        if last_user_msgs:
            retrieval_query = f"{last_user_msgs[-1]} {question}"
    chunks = retrieve(retrieval_query, n_results=n_results, corpus=corpus)
    context = format_context(chunks)
    system_prompt = SYSTEM_PROMPT_TEMPLATE.format(
        mode_instruction=MODE_PROMPTS[mode],
        lang_instruction=LANG_PROMPTS[lang],
        not_in_archive=NOT_IN_ARCHIVE[lang],
        context=context,
    )

    messages = [{"role": "system", "content": system_prompt}]
    messages.extend(history)
    messages.append({"role": "user", "content": question})

    failed = False
    try:
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=messages,
            temperature=0.2,
        )
        answer = response.choices[0].message.content
    except Exception as e:
        print(f"[ask] Groq call failed: {e}")
        failed = True
        answer = GEN_UNAVAILABLE[lang] if chunks else NOT_IN_ARCHIVE_AND_UNAVAILABLE[lang]

    return {
        "answer": answer,
        "mode": mode,
        "lang": lang,
        "degraded": failed,
        "sources": [
            {
                "date": c["metadata"].get("date"),
                "volume": c["metadata"].get("volume"),
                "title": c["metadata"].get("title"),
                "type": c["metadata"].get("record_type", "source_text"),
                "relevance": "high" if c["distance"] < 0.8 else "medium" if c["distance"] < 1.2 else "low",
                "section": c["metadata"].get("chunk_index"),
                # Real retrieved chunk text, truncated the same way
                # /debates-search already truncates its snippets.
                "snippet": (c["text"][:300] + "...") if len(c["text"]) > 300 else c["text"],
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
                print(f"  - {s['title']} | Vol. {s['volume']}, {s['date']} | {s['type']} | section {s.get('section')}")
        except KeyboardInterrupt:
            print("\nBye.")
            break
        except Exception as e:
            print(f"Error: {e}")