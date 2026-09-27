import os
from src.ingest import ingest_document

CLEANED_DIR = "data/writings/cleaned"

for fname in os.listdir(CLEANED_DIR):
    path = os.path.join(CLEANED_DIR, fname)
    if not os.path.isfile(path) or not fname.endswith(".txt"):
        continue  # skips the vol1/ subdirectory and any non-txt files

    # "Vol1_Annihilation_of_Caste.txt" -> volume "1", title "Annihilation of Caste"
    name_part = fname.rsplit(".", 1)[0]  # strip .txt
    vol_prefix, _, title_raw = name_part.partition("_")
    volume = vol_prefix.replace("Vol", "")
    title = title_raw.replace("_", " ")

    with open(path, "r", encoding="utf-8") as f:
        text = f.read()

    doc_id = f"writings_vol{volume}_{title_raw.lower()}"
    ingest_document(
        text=text,
        source="writings",
        doc_id=doc_id,
        volume=volume,
        speaker_or_author="Dr. B.R. Ambedkar",
        title=title,
    )