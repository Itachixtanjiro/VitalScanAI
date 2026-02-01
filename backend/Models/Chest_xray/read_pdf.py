import sys
import subprocess
import importlib.util

def install(package):
    subprocess.check_call([sys.executable, "-m", "pip", "install", package])

# Check for pypdf
if importlib.util.find_spec("pypdf") is None:
    print("Installing pypdf...", flush=True)
    install("pypdf")

from pypdf import PdfReader

pdf_path = r"D:/VitalScanAI/backend/Models/Chest_xray/README_CHESTXRAY.pdf"

try:
    reader = PdfReader(pdf_path)
    print(f"--- Reading {pdf_path} ---")
    print(f"Number of pages: {len(reader.pages)}\n")
    
    full_text = []
    for i, page in enumerate(reader.pages):
        text = page.extract_text()
        print(f"--- Page {i+1} ---")
        print(text)
        full_text.append(text)
        
except Exception as e:
    print(f"Error reading PDF: {e}")
