from src.ingest import ingest_document

for fname, title in [
    ("data/writings/cleaned/Vol1_Annihilation_of_Caste.txt", "Annihilation of Caste"),
    ("data/writings/cleaned/Vol1_Castes_in_India.txt", "Castes in India"),
]:
    with open(fname, "r", encoding="utf-8") as f:
        text = f.read()
    ingest_document(
        text=text,
        source="writings",
        doc_id=f"writings_vol1_{title.replace(' ', '_').lower()}",
        volume="1",
        speaker_or_author="Dr. B.R. Ambedkar",
        title=title,
    )