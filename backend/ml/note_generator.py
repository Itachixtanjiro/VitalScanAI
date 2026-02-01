"""Synthetic Clinical Note Generator.

Reads SYNTHEA CSV data and generates realistic clinical note text
for testing the BioBERT + Mistral NLP pipeline.
"""
import os
import logging
import random
from typing import List, Dict, Optional
from datetime import datetime

import pandas as pd

logger = logging.getLogger(__name__)

DATASET_DIR = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "..", "Models", "Clinical_note", "synthetic-medical-dataset"
)


def _load_csv(filename: str) -> Optional[pd.DataFrame]:
    """Load a CSV from the synthetic dataset directory."""
    path = os.path.join(DATASET_DIR, filename)
    if not os.path.exists(path):
        logger.warning(f"Dataset file not found: {path}")
        return None
    try:
        return pd.read_csv(path)
    except Exception as e:
        logger.error(f"Failed to load {filename}: {e}")
        return None


def _calculate_age(birthdate_str: str, encounter_date_str: str) -> int:
    """Calculate age at time of encounter."""
    try:
        birth = datetime.strptime(birthdate_str, "%Y-%m-%d")
        encounter = datetime.strptime(encounter_date_str, "%Y-%m-%d")
        return (encounter - birth).days // 365
    except (ValueError, TypeError):
        return 0


def _format_vitals(observations: pd.DataFrame) -> str:
    """Format observation data into a vitals section."""
    vital_codes = {
        "8480-6": "Systolic BP",
        "8462-4": "Diastolic BP",
        "8302-2": "Height",
        "29463-7": "Weight",
        "39156-5": "BMI",
        "8310-5": "Body Temperature",
        "8867-4": "Heart Rate",
        "9279-1": "Respiratory Rate",
    }

    lines = []
    for _, row in observations.iterrows():
        code = str(row.get("CODE", ""))
        if code in vital_codes:
            name = vital_codes[code]
            value = row.get("VALUE", "")
            units = row.get("UNITS", "")
            lines.append(f"  - {name}: {value} {units}")

    return "\n".join(lines) if lines else "  - No vitals recorded"


def generate_note_for_encounter(
    patient_row: pd.Series,
    encounter_row: pd.Series,
    conditions: pd.DataFrame,
    medications: pd.DataFrame,
    observations: pd.DataFrame,
) -> str:
    """Generate a clinical note from a single encounter's data."""
    encounter_id = encounter_row["ID"]
    patient_id = encounter_row["PATIENT"]
    encounter_date = str(encounter_row.get("DATE", "Unknown"))

    # Patient demographics
    first = patient_row.get("first", "Unknown")
    last = patient_row.get("last", "Unknown")
    gender = patient_row.get("gender", "U")
    gender_str = "Male" if gender == "M" else "Female" if gender == "F" else "Unknown"
    birthdate = str(patient_row.get("birthdate", ""))
    age = _calculate_age(birthdate, encounter_date)

    # Encounter description
    enc_desc = encounter_row.get("DESCRIPTION", "General Encounter")
    reason_desc = encounter_row.get("REASONDESCRIPTION", "")

    # Conditions for this encounter
    enc_conditions = conditions[conditions["ENCOUNTER"] == encounter_id]
    condition_list = enc_conditions["DESCRIPTION"].tolist() if not enc_conditions.empty else []

    # Medications for this encounter
    enc_meds = medications[medications["ENCOUNTER"] == encounter_id]
    med_list = []
    for _, med in enc_meds.iterrows():
        med_name = med.get("DESCRIPTION", "Unknown medication")
        med_reason = med.get("REASONDESCRIPTION", "")
        entry = f"  - {med_name}"
        if med_reason:
            entry += f" (for {med_reason})"
        med_list.append(entry)

    # Observations (vitals)
    enc_obs = observations[observations["ENCOUNTER"] == encounter_id]
    vitals_str = _format_vitals(enc_obs)

    # Build clinical note
    note_parts = [
        f"Patient: {first} {last}, {age}yo {gender_str}",
        f"Date: {encounter_date}",
        f"Encounter Type: {enc_desc}",
    ]

    if reason_desc:
        note_parts.append(f"Chief Complaint: {reason_desc}")

    note_parts.append(f"\nVital Signs:\n{vitals_str}")

    if condition_list:
        note_parts.append("\nActive Conditions:")
        for c in condition_list:
            note_parts.append(f"  - {c}")

    if med_list:
        note_parts.append("\nMedications:")
        note_parts.extend(med_list)

    # Add a plan section based on conditions
    note_parts.append("\nAssessment & Plan:")
    if condition_list:
        note_parts.append(f"  Assessment: {', '.join(condition_list[:3])}")
        note_parts.append("  Plan: Continue current treatment. Follow up as scheduled.")
    else:
        note_parts.append("  Routine visit. No acute concerns.")
        note_parts.append("  Plan: Continue preventive care.")

    return "\n".join(note_parts)


def generate_sample_notes(count: int = 5, seed: int = 42) -> List[Dict]:
    """
    Generate sample clinical notes from the SYNTHEA dataset.

    Returns a list of dicts with 'id', 'title', 'text', and 'expected_entities'.
    """
    patients_df = _load_csv("patients.csv")
    encounters_df = _load_csv("encounters.csv")
    conditions_df = _load_csv("conditions.csv")
    medications_df = _load_csv("medications.csv")
    observations_df = _load_csv("observations.csv")

    if patients_df is None or encounters_df is None:
        logger.error("Cannot generate notes: required CSV files missing")
        return []

    if conditions_df is None:
        conditions_df = pd.DataFrame(columns=["ENCOUNTER", "DESCRIPTION"])
    if medications_df is None:
        medications_df = pd.DataFrame(columns=["ENCOUNTER", "DESCRIPTION", "REASONDESCRIPTION"])
    if observations_df is None:
        observations_df = pd.DataFrame(columns=["ENCOUNTER", "CODE", "VALUE", "UNITS"])

    # Filter encounters that have at least some conditions (more interesting notes)
    encounters_with_conditions = encounters_df[
        encounters_df["ID"].isin(conditions_df["ENCOUNTER"].unique())
    ]

    if encounters_with_conditions.empty:
        encounters_with_conditions = encounters_df

    # Sample encounters
    random.seed(seed)
    sample_size = min(count, len(encounters_with_conditions))
    sampled = encounters_with_conditions.sample(n=sample_size, random_state=seed)

    notes = []
    for idx, (_, enc_row) in enumerate(sampled.iterrows()):
        patient_id = enc_row["PATIENT"]
        patient_match = patients_df[patients_df["patient"] == patient_id]

        if patient_match.empty:
            continue

        patient_row = patient_match.iloc[0]
        note_text = generate_note_for_encounter(
            patient_row, enc_row, conditions_df, medications_df, observations_df
        )

        # Determine expected entities from conditions and medications
        enc_conditions = conditions_df[conditions_df["ENCOUNTER"] == enc_row["ID"]]
        expected = [c for c in enc_conditions["DESCRIPTION"].tolist() if isinstance(c, str)]

        enc_meds = medications_df[medications_df["ENCOUNTER"] == enc_row["ID"]]
        expected += [m for m in enc_meds["DESCRIPTION"].tolist() if isinstance(m, str)]

        notes.append({
            "id": f"synthea_note_{idx + 1:03d}",
            "title": f"Encounter: {enc_row.get('DESCRIPTION', 'Visit')}",
            "text": note_text,
            "expected_entities": expected[:10],
            "category": "clinical_notes",
        })

    return notes
