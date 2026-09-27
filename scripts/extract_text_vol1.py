import pymupdf
from pathlib import Path

PDF_PATH = Path(r"data/writings/raw_pdfs/Volume1-Ambedkar writings and speeches.pdf")
OUTPUT_DIR = Path("data/writings/cleaned/vol1")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

doc = pymupdf.open(PDF_PATH)
total_pages = len(doc)
print(f"Total pages: {total_pages}")

# Extract all pages into individual text files (fast)
for page_num in range(total_pages):
    text = doc[page_num].get_text()
    out_file = OUTPUT_DIR / f"page_{page_num+1:04d}.txt"
    with open(out_file, "w", encoding="utf-8") as f:
        f.write(text)
    
    if (page_num + 1) % 50 == 0:
        print(f"Extracted {page_num+1}/{total_pages} pages")

print("Done! All pages extracted to data/writings/cleaned/vol1/")