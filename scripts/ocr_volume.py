import easyocr
import fitz  # PyMuPDF
from pathlib import Path
import sys

# ====== CONFIG ======
PDF_PATH = Path("data/writings/raw_pdfs/Volume1-Ambedkar writings and speeches.pdf")
OUTPUT_DIR = Path("data/writings/ocr_raw/vol1")
DPI = 300          # higher = better quality but slower
START_PAGE = 6     # 0-based. Change if you want to resume
END_PAGE = 40   # None = all pages. Or set e.g. 50 to do first 50 only
# ====================

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

print("Loading EasyOCR model (first time takes a while)...")
reader = easyocr.Reader(['en'], gpu=False)  # set gpu=True if you have NVIDIA GPU

doc = fitz.open(PDF_PATH)
total_pages = len(doc)
end = END_PAGE if END_PAGE is not None else total_pages

print(f"Total pages in PDF: {total_pages}")
print(f"Processing pages {START_PAGE+1} to {end}")

for page_num in range(START_PAGE, end):
    page = doc[page_num]
    
    # Render page to high-quality image
    pix = page.get_pixmap(dpi=DPI)
    img_path = OUTPUT_DIR / f"page_{page_num+1:04d}.png"
    pix.save(img_path)
    
    # Run OCR
    result = reader.readtext(str(img_path), detail=0, paragraph=True)
    text = "\n".join(result)
    
    # Save text
    txt_path = OUTPUT_DIR / f"page_{page_num+1:04d}.txt"
    with open(txt_path, "w", encoding="utf-8") as f:
        f.write(text)
    
    print(f"✓ Page {page_num+1}/{total_pages} done")

print("\nOCR complete!")
print(f"Raw text files are in: {OUTPUT_DIR}")