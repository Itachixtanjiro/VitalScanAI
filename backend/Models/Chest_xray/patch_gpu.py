import json
import os
import sys

print("Starting GPU patch...", flush=True)

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

# Finding the imports cell (Model.ipynb usually has imports in the first code cell)
target_cell = None
target_cell_index = -1

for idx, cell in enumerate(nb['cells']):
    if cell['cell_type'] == 'code':
        source = "".join(cell['source'])
        if "import tensorflow as tf" in source or "from tensorflow.keras" in source:
            target_cell = cell
            target_cell_index = idx
            break

if target_cell:
    print(f"Found imports in cell index {target_cell_index}. Injecting GPU config...", flush=True)
    
    gpu_code = [
        "\n",
        "# --- GPU Configuration ---\n",
        "print(\"TensorFlow Version:\", tf.__version__)\n",
        "gpus = tf.config.list_physical_devices('GPU')\n",
        "if gpus:\n",
        "    try:\n",
        "        # Currently, memory growth needs to be the same across GPUs\n",
        "        for gpu in gpus:\n",
        "            tf.config.experimental.set_memory_growth(gpu, True)\n",
        "        logical_gpus = tf.config.list_logical_devices('GPU')\n",
        "        print(len(gpus), \"Physical GPUs,\", len(logical_gpus), \"Logical GPUs\")\n",
        "        print(\"CUDA Activated: GPU is available.\")\n",
        "    except RuntimeError as e:\n",
        "        # Memory growth must be set before GPUs have been initialized\n",
        "        print(e)\n",
        "else:\n",
        "    print(\"WARNING: CUDA not available. Running on CPU.\")\n"
    ]
    
    # Append to the end of the imports cell
    target_cell['source'].extend(gpu_code)
    
    try:
        with open(nb_path, 'w', encoding='utf-8') as f:
            json.dump(nb, f, indent=1)
        print("Notebook updated successfully with GPU config.", flush=True)
    except Exception as e:
        print(f"Error writing notebook: {e}", flush=True)

else:
    print("Error: Could not find imports cell.", flush=True)
