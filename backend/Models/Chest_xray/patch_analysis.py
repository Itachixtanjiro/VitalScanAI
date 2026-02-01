import json
import os
import sys

print("Starting analysis patch...", flush=True)

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

# Finding the "train_df" creation cell or appending a new one at the end for analysis
# We will append a new cell at the end of the notebook to perform the analysis
new_cell = {
 "cell_type": "code",
 "execution_count": None,
 "metadata": {},
 "outputs": [],
 "source": [
  "# --- Analysis of Class Imbalance ---\n",
  "if 'train_df' in locals():\n",
  "    print(\"\\n--- Class Distribution in Training Set ---\")\n",
  "    # Flatten the list of labels\n",
  "    all_labels = [label for sublist in train_df['labels'] for label in sublist]\n",
  "    from collections import Counter\n",
  "    counts = Counter(all_labels)\n",
  "    import pandas as pd\n",
  "    df_counts = pd.DataFrame.from_dict(counts, orient='index', columns=['Count']).sort_values('Count', ascending=False)\n",
  "    print(df_counts)\n",
  "    print(f\"\\nTotal Training Images: {len(train_df)}\")\n",
  "    \n",
  "    # Check No Finding Ratio\n",
  "    no_finding_count = counts.get('No Finding', 0)\n",
  "    print(f\"'No Finding' ratio: {no_finding_count / len(train_df):.2%}\")\n"
 ]
}

nb['cells'].append(new_cell)

try:
    with open(nb_path, 'w', encoding='utf-8') as f:
        json.dump(nb, f, indent=1)
    print("Notebook updated successfully with analysis cell.", flush=True)
except Exception as e:
    print(f"Error writing notebook: {e}", flush=True)
