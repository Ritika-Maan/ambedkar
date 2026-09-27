"""
Shared ingestion pipeline: text -> chunk -> embed -> store with metadata.
Used for both the 'debates' and 'writings' ChromaDB collections.
"""
import re
import chromadb
from chromadb.utils import embedding_functions

# --- ChromaDB setup: two persistent local collections ---
CHROMA_PATH = "./chroma_db"
client = chromadb.PersistentClient(path=CHROMA_PATH)

# ChromaDB's built-in ONNX embedder (all-MiniLM-L6-v2 under the hood) —
# local, free, no API key, no torch dependency. Swap for a hosted
# embedding model later if retrieval quality needs it.
embed_fn = embedding_functions.DefaultEmbeddingFunction()

debates_collection = client.get_or_create_collection(
    name="debates", embedding_function=embed_fn
)
writings_collection = client.get_or_create_collection(
    name="writings", embedding_function=embed_fn
)


def chunk_text(text: str, chunk_size: int = 800, overlap: int = 150) -> list[str]:
    """
    Simple paragraph-aware chunker. Splits on double newlines first (keeps
    speech/paragraph units intact where possible), then packs into
    ~chunk_size character windows with overlap so context isn't lost at
    chunk boundaries.
    """
    paragraphs = [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]
    chunks = []
    current = ""
    for para in paragraphs:
        if len(current) + len(para) <= chunk_size:
            current = f"{current}\n\n{para}".strip()
        else:
            if current:
                chunks.append(current)
            # start new chunk, carry a bit of overlap from the tail of the last one
            tail = current[-overlap:] if current else ""
            current = f"{tail}\n\n{para}".strip()
    if current:
        chunks.append(current)
    return chunks


def ingest_document(
    text: str,
    source: str,           # "debates" or "writings"
    doc_id: str,           # unique id, e.g. "debates_1948-11-04" or "writings_vol5_p112"
    date: str = "",        # e.g. "1948-11-04" for debates
    volume: str = "",      # e.g. "Vol. 5" for writings
    speaker_or_author: str = "Dr. B.R. Ambedkar",
    page_or_session: str = "",
    title: str = "",
):
    """
    Ingest one document (a full speech, or a Writings volume excerpt) into
    the correct collection, chunked with metadata attached to every chunk
    so citations can point back to date/volume/page.
    """
    if source not in ("debates", "writings"):
        raise ValueError("source must be 'debates' or 'writings'")

    collection = debates_collection if source == "debates" else writings_collection
    chunks = chunk_text(text)

    ids = [f"{doc_id}_chunk{i}" for i in range(len(chunks))]
    metadatas = [
        {
            "source": source,
            "doc_id": doc_id,
            "date": date,
            "volume": volume,
            "speaker_or_author": speaker_or_author,
            "page_or_session": page_or_session,
            "title": title,
            "chunk_index": i,
        }
        for i in range(len(chunks))
    ]

    collection.upsert(ids=ids, documents=chunks, metadatas=metadatas)
    print(f"Ingested {len(chunks)} chunks from '{doc_id}' into '{source}' collection.")
    return len(chunks)


def ingest_debates_doc_from_file(filepath: str, date: str, title: str = ""):
    """
    Convenience wrapper matching Niyati's format: one doc per date, with
    volume number + exact date as header inside the file.
    Expects a plain .txt or pasted-from-Google-Doc text file.
    """
    with open(filepath, "r", encoding="utf-8") as f:
        text = f.read()
    doc_id = f"debates_{date}"
    return ingest_document(
        text=text,
        source="debates",
        doc_id=doc_id,
        date=date,
        speaker_or_author="Dr. B.R. Ambedkar",
        title=title or f"Constituent Assembly Debates — {date}",
    )


if __name__ == "__main__":
    # Smoke test with a tiny fake excerpt so the pipeline is verified
    # BEFORE Niyati's real file lands.
    sample_text = """Mr. President, Sir, I move that the Draft Constitution as settled by the
Drafting Committee be taken into consideration.

It is one thing to frame a Constitution, it is quite another thing to work it. The Constitution
does not provide for a dictatorship of any kind. It is not enough to provide sound
constitutional machinery; it is even more necessary that those who work it should be
imbued with the right spirit."""

    n = ingest_document(
        text=sample_text,
        source="debates",
        doc_id="debates_1948-11-04_TEST",
        date="1948-11-04",
        speaker_or_author="Dr. B.R. Ambedkar",
        page_or_session="Draft Constitution presentation",
        title="Draft Constitution presentation speech (SAMPLE for pipeline test)",
    )
    print(f"\nSmoke test done. {n} chunk(s) in debates collection.")
    print("Collections now:", client.list_collections())