import json
import os
import sys

print("Starting class weight patch...", flush=True)

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

# 1. Inject Weight Calculation (after data split, usually Cell 2 or 3)
# We look for the cell that defines 'train_df' and 'classes'. 
# In the provided notebook, it's cell index 2 (execution_count 2) or 3.
# Strategy: Find the cell that prints "Train: ... Val: ..." and Append weight calc to it.
found_split_cell = False
for cell in nb['cells']:
    if cell['cell_type'] == 'code':
        source = "".join(cell['source'])
        if "train_test_split" in source and "mlb.classes_" in source:
            print("Found data split cell.", flush=True)
            # Append weight calculation to this cell
            weight_code = [
                "\n",
                "# --- Class Balancing ---\n",
                "from sklearn.utils import class_weight\n",
                "import numpy as np\n",
                "\n",
                "# Flatten all labels in train_df to compute weights\n",
                "flat_labels = [l for sublist in train_df['labels'] for l in sublist]\n",
                "all_classes = sorted(list(set(flat_labels)))\n",
                "\n",
                "# Map class name to index\n",
                "class_to_idx = {c: i for i, c in enumerate(classes)}\n",
                "\n",
                "# Calculate weights (manual 'balanced' approach for multi-label)\n",
                "from collections import Counter\n",
                "counts = Counter(flat_labels)\n",
                "total_samples = len(train_df)\n",
                "class_weights = {}\n",
                "\n",
                "print(\"\\nComputed Class Weights:\")\n",
                "for c in classes:\n",
                "    idx = class_to_idx[c]\n",
                "    # Heuristic: total / count. \n",
                "    # We can normalize or leave raw. Keras handles raw.\n",
                "    # 'balanced' style: total / (num_classes * count)\n",
                "    cnt = counts.get(c, 0)\n",
                "    if cnt > 0:\n",
                "        # weight = total_samples / (len(classes) * cnt)\n",
                "        # Simple inverse frequency often works best for 'No Finding' dominance\n",
                "        weight = (total_samples / cnt)\n",
                "        # Normalize so that 'No Finding' (majority) is closer to 1.0? \n",
                "        # Standard sklearn logic scales so that sum of weights * counts = total_samples\n",
                "        # Let's stick to inverse frequency but log-dampened if it's too extreme, \n",
                "        # OR just standard inverse.\n",
                "        # Given imbalance 23 vs 3700, 3700/23 = 160x weight. Use standard balanced.\n",
                "        weight = total_samples / (len(classes) * cnt)\n",
                "        class_weights[idx] = weight\n",
                "        print(f\"{c}: {weight:.4f}\")\n",
                "    else:\n",
                "        class_weights[idx] = 1.0\n"
            ]
            cell['source'].extend(weight_code)
            found_split_cell = True
            break

if not found_split_cell:
    print("Warning: Could not find data split cell. Appending to end of Cell 2?", flush=True)
    # Fallback logic could go here, but let's rely on the specific content match
    pass

# 2. Inject class_weight into model.fit calls
# Look for "densenet_model.fit" and "hybrid_model.fit"
updated_fit = 0
for cell in nb['cells']:
    if cell['cell_type'] == 'code':
        source = "".join(cell['source'])
        
        # Phase 1 Fit
        if "densenet_model.fit" in source and "class_weight" not in source:
            print("Updating Phase 1 fit...", flush=True)
            new_source = source.replace(
                "callbacks=[dense_ckpt, EarlyStopping(patience=3, restore_best_weights=True)]",
                "callbacks=[dense_ckpt, EarlyStopping(patience=3, restore_best_weights=True)],\n        class_weight=class_weights"
            )
            cell['source'] = new_source.splitlines(True) # splitlines(True) keeps newlines
            updated_fit += 1
            
        # Phase 3 Fit
        if "hybrid_model.fit" in source and "class_weight" not in source:
            print("Updating Phase 3 fit...", flush=True)
             # Note: logic relies on exact string match. The notebook uses:
             # callbacks=[fusion_ckpt, EarlyStopping(patience=3)]
            new_source = source.replace(
                "callbacks=[fusion_ckpt, EarlyStopping(patience=3)]",
                "callbacks=[fusion_ckpt, EarlyStopping(patience=3)],\n        class_weight=class_weights"
            )
            cell['source'] = new_source.splitlines(True)
            updated_fit += 1

if updated_fit > 0:
    try:
        with open(nb_path, 'w', encoding='utf-8') as f:
            json.dump(nb, f, indent=1)
        print("Notebook updated successfully with class weights.", flush=True)
    except Exception as e:
        print(f"Error writing notebook: {e}", flush=True)
else:
    print("Warning: fit calls not found or already updated.", flush=True)
