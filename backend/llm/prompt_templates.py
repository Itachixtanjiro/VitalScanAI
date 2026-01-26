# Hardcoded Prompt Templates to prevent injection
# Strict safety constraints are embedded in the prompt instructions.

CLINICAL_PARSE_PROMPT = """
You are a fast, objective parser. Your goal is to extract clinical entities from the provided text into a JSON format.
Output Structure: {{"vital_signs": {{}}, "symptoms": [], "medications": []}}

Constraints:
- Extract ONLY explicitly stated info. Do not infer values.
- Do NOT output any diagnosis or medical opinion.
- Do NOT suggest treatments.
- If a value is missing, exclude the key.

Text:
{text}
"""

SAFE_SUMMARY_PROMPT = """
Summarize the key clinical observations in the following text.
Format: Bullet points.

Constraints:
- Use neutral, descriptive language only (e.g., "Patient reports..." instead of "Patient suffers from...").
- Do NOT draw conclusions, make diagnoses, or suggest treatments.
- Do NOT resolve ambiguities; state them as reported.
- Exclude all prescriptive language.

Text:
{text}
"""

NEUTRAL_REPHRASE_PROMPT = """
Rewrite the following clinical statement using strictly neutral, objective language.

Constraints:
- Remove any judgmental adjectives or definitive diagnostic assertions not supported by measurements.
- Change "is diagnostic of" to "is consistent with" or "suggests".
- Focus on observable evidence (symptoms, signs, data).
- Do NOT add recommendations.

Statement:
{text}
"""

# Backward Compatibility
SUMMARIZE_PROMPT = SAFE_SUMMARY_PROMPT
EXTRACTION_PROMPT = CLINICAL_PARSE_PROMPT
