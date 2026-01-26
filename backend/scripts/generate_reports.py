import pandas as pd
import random
from fpdf import FPDF
import os
import datetime

# Setup Directories
DATA_DIR = "backend/Models/Clinical_note/synthetic-medical-dataset"
OUTPUT_DIR = "test_data_reports"
os.makedirs(OUTPUT_DIR, exist_ok=True)

class PDF(FPDF):
    def header(self):
        self.set_font('Arial', 'B', 15)
        self.cell(0, 10, 'VitalScanAI - Comprehensive Patient Report', 0, 1, 'C')
        self.ln(5)

    def footer(self):
        self.set_y(-15)
        self.set_font('Arial', 'I', 8)
        self.cell(0, 10, 'Page ' + str(self.page_no()) + ' | STRICTLY CONFIDENTIAL - SYNTHETIC DATA FOR TESTING ONLY', 0, 0, 'C')

def generate_reports(num_reports=5):
    # Load Data
    print("Loading datasets...")
    try:
        patients = pd.read_csv(os.path.join(DATA_DIR, "patients.csv"))
        conditions = pd.read_csv(os.path.join(DATA_DIR, "conditions.csv"))
        medications = pd.read_csv(os.path.join(DATA_DIR, "medications.csv"))
    except Exception as e:
        print(f"Error loading data: {e}. Please ensure dataset path is correct.")
        return

    # Select Random Patients
    sample_patients = patients.sample(num_reports)

    for _, patient in sample_patients.iterrows():
        pat_id = patient['patient']  # Adjusted column name based on previous exploration
        pat_name = f"{patient['first']} {patient['last']}"
        gender = patient['gender']
        dob = patient['birthdate']
        
        # Determine Age
        birth_year = int(dob.split('-')[0])
        current_year = datetime.datetime.now().year
        age = current_year - birth_year

        # Get Clinical History
        pat_conditions = conditions[conditions['PATIENT'] == pat_id]['DESCRIPTION'].unique()
        pat_meds = medications[medications['PATIENT'] == pat_id]['DESCRIPTION'].unique()

        # Generate PDF
        pdf = PDF()
        pdf.add_page()
        
        # 1. Header Info
        pdf.set_font("Arial", size=12)
        pdf.cell(0, 10, f"Patient info: {pat_name} (ID: {pat_id[:8]}...)", ln=True)
        pdf.cell(0, 10, f"DOB: {dob} (Age: {age}) | Sex: {gender}", ln=True)
        pdf.line(10, 45, 200, 45)
        pdf.ln(10)

        # 2. Clinical History
        pdf.set_font("Arial", 'B', 12)
        pdf.cell(0, 10, "Clinical History (Conditions)", ln=True)
        pdf.set_font("Arial", size=10)
        if len(pat_conditions) > 0:
            for cond in pat_conditions[:10]: # Limit to 10
                pdf.cell(0, 7, f"- {cond}", ln=True)
        else:
            pdf.cell(0, 7, "- No recorded chronic conditions", ln=True)
        pdf.ln(5)

        # 3. Medications
        pdf.set_font("Arial", 'B', 12)
        pdf.cell(0, 10, "Active Medications", ln=True)
        pdf.set_font("Arial", size=10)
        if len(pat_meds) > 0:
            for med in pat_meds[:10]:
                pdf.cell(0, 7, f"- {med}", ln=True)
        else:
            pdf.cell(0, 7, "- No active medications", ln=True)
        pdf.ln(5)

        # 4. Synthesized Test Data (For Model Verification)
        pdf.set_font("Arial", 'B', 12)
        pdf.cell(0, 10, "Targeted API Test Data", ln=True)
        pdf.set_font("Arial", size=10)
        
        # Diabetes Data Synthesis based on conditions
        has_diabetes = any('diabetes' in str(c).lower() for c in pat_conditions)
        glucose = random.randint(140, 250) if has_diabetes else random.randint(70, 110)
        bmi = random.uniform(28.0, 35.0) if has_diabetes else random.uniform(20.0, 25.0)
        
        diabetes_json = f"""
        {{
            "Pregnancies": {random.randint(0,4) if gender=='F' else 0},
            "Glucose": {glucose},
            "BloodPressure": {random.randint(70, 140)},
            "SkinThickness": 20,
            "Insulin": {random.randint(0, 200)},
            "BMI": {bmi:.1f},
            "DiabetesPedigreeFunction": 0.5,
            "Age": {age}
        }}
        """
        
        pdf.set_font("Courier", size=11)
        pdf.multi_cell(0, 5, f"Diabetes Risk Input (JSON):\n{diabetes_json}")
        pdf.ln(5)

        # Cancer Risk Features
        cancer_features = {
            "radius_mean": random.uniform(10, 20),
            "texture_mean": random.uniform(10, 25),
            "perimeter_mean": random.uniform(60, 130),
            "area_mean": random.uniform(300, 1200)
        }
        
        pdf.multi_cell(0, 5, f"Cancer Risk Input (Top Features):\n{str(cancer_features)}")
        pdf.ln(5)
        
        # X-ray Placeholder
        pdf.set_font("Arial", 'B', 12)
        pdf.cell(0, 10, "Imaging Reference", ln=True)
        pdf.set_font("Arial", size=10)
        pdf.cell(0, 10, "Recommended Test Image: backend/data/dataset/images_001/00000013_005.png (Sample)", ln=True)

        # Save
        filename = f"{OUTPUT_DIR}/Patient_Report_{pat_id}.pdf"
        pdf.output(filename)
        print(f"Generated: {filename}")

if __name__ == "__main__":
    generate_reports()
