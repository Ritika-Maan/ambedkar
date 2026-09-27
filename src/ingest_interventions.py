"""
Ingests the structured intervention index (data/debates/interventions.py)
into the 'debates' ChromaDB collection.

Each row -> one chunk, phrased explicitly as a SUMMARY so the generation
step never dresses it up as a direct quote. Metadata carries date, volume,
theme and who's mentioned, so retrieval can filter/cite precisely and the
same records can be handed to Shreya for the knowledge graph.
"""
import sys
sys.path.insert(0, "data/debates")
from ingest import debates_collection
from interventions import INTERVENTIONS


def build_chunk_text(row: dict) -> str:
    return (
        f"[Summary of Ambedkar's intervention, Constituent Assembly Debates, "
        f"Vol. {row['volume']}, {row['date']}] Topic: {row['title']}. "
        f"{row['summary']} (Mentioned: {row['mentioned']}; Theme: {row['theme']})"
    )


def ingest_all():
    ids, docs, metas = [], [], []
    for i, row in enumerate(INTERVENTIONS):
        ids.append(f"debates_{row['date']}_{i}")
        docs.append(build_chunk_text(row))
        metas.append({
            "source": "debates",
            "record_type": "summary",  # NOT verbatim — enforced at generation time too
            "date": row["date"],
            "volume": row["volume"],
            "title": row["title"],
            "mentioned": row["mentioned"],
            "theme": row["theme"],
            "speaker_or_author": "Dr. B.R. Ambedkar",
        })

    debates_collection.upsert(ids=ids, documents=docs, metadatas=metas)
    print(f"Ingested {len(ids)} intervention summaries into 'debates' collection.")
    print(f"Dates covered: {sorted(set(r['date'] for r in INTERVENTIONS))}")
    print(f"Themes covered: {sorted(set(r['theme'] for r in INTERVENTIONS))}")


if __name__ == "__main__":
    ingest_all()