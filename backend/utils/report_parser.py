from pypdf import PdfReader
import json
import re
import io

class ReportParser:
    @staticmethod
    def extract_data(pdf_bytes):
        reader = PdfReader(io.BytesIO(pdf_bytes))
        text = ""
        for page in reader.pages:
            text += page.extract_text()
            
        # Extract JSON blocks
        # Looking for "Diabetes Risk Input (JSON):"
        diabetes_data = None
        cancer_data = None
        
        # Naive extraction: Find first JSON-like block after "Diabetes Risk Input"
        if "Diabetes Risk Input (JSON):" in text:
            try:
                start = text.find("Diabetes Risk Input (JSON):") + len("Diabetes Risk Input (JSON):")
                # Attempt to find the curly braces
                json_candidate = text[start:]
                json_start = json_candidate.find('{')
                json_end = json_candidate.find('}') + 1
                diabetes_str = json_candidate[json_start:json_end]
                diabetes_data = json.loads(diabetes_str)
            except Exception as e:
                print(f"Error parsing diabetes data: {e}")

        # Extract Cancer Data
        # Looking for "Cancer Risk Input (Top Features):"
        if "Cancer Risk Input (Top Features):" in text:
             try:
                start = text.find("Cancer Risk Input (Top Features):") + len("Cancer Risk Input (Top Features):")
                # This in the PDF was printed as a python dict string (single quotes), JSON needs double quotes
                # But let's try to parse the dict structure textually or via ast.literal_eval if safe, 
                # or just regex.
                # The format is {'radius_mean': ..., ...}
                dict_candidate = text[start:].strip().split('\n')[0] 
                # Clean up potentially multi-line
                if '}' in text[start:]:
                    dict_candidate = text[start:text.find('}')+start+1]
                
                # Convert python dict string to json friendly
                dict_candidate = dict_candidate.replace("'", '"')
                cancer_data = json.loads(dict_candidate)
             except Exception as e:
                print(f"Error parsing cancer data: {e}")
                
        return {
            "text_summary": text[:500] + "...", # First 500 chars for preview
            "diabetes_data": diabetes_data,
            "cancer_data": cancer_data
        }
