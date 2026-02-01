import json
import os
import sys

print("Starting batch size patch...", flush=True)

nb_path = r"d:/VitalScanAI/backend/Models/Chest_xray/Model.ipynb"

if not os.path.exists(nb_path):
    print(f"Error: {nb_path} does not exist.", flush=True)
    sys.exit(1)

try:
    with open(nb_path, 'r', encoding='utf-8') as f:
        nb = json.load(f)
    print("Notebook loaded.", flush=True)
except Exception as e:
    print(f"Error reading notebook: {e}", flush=True)
    sys.exit(1)

# Find the configuration cell
updated = False
for cell in nb['cells']:
    if cell['cell_type'] == 'code':
        source = "".join(cell['source'])
        if "BATCH_SIZE = 32" in source:
            print("Found BATCH_SIZE config.", flush=True)
            new_source = source.replace("BATCH_SIZE = 32", "BATCH_SIZE = 8")
            # Also add a comment explaining why
            new_source = new_source.replace("BATCH_SIZE = 8", "BATCH_SIZE = 8 # Reduced from 32 for RTX 3050 Compatibility")
            
            cell['source'] = new_source.splitlines(True)
            updated = True
            break

if updated:
    try:
        with open(nb_path, 'w', encoding='utf-8') as f:
            json.dump(nb, f, indent=1)
        print("Notebook updated successfully with reduced batch size.", flush=True)
    except Exception as e:
        print(f"Error writing notebook: {e}", flush=True)
else:
    print("Warning: Could not find 'BATCH_SIZE = 32' to update.", flush=True)
