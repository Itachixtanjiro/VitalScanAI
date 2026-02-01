import json
import os
import sys

print("Starting path config patch...", flush=True)

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
        # Look for the cell where we likely put the previous GPU check or the main imports
        if "import os" in source or "import tensorflow as tf" in source:
            target_cell = cell
            target_cell_index = idx
            break

if target_cell:
    print(f"Found imports in cell index {target_cell_index}. Injecting Path logic...", flush=True)
    
    # We want this to run BEFORE TensorFlow imports if possible, but since we are appending/prepending, 
    # let's prepend this block to the very start of the source list to ensure it runs first
    
    path_code = [
        "# --- CUDA Environment Setup ---\n",
        "import os\n",
        "import sys\n",
        "\n",
        "# Attempt to add CUDA 12.9 to PATH if available\n",
        "cuda_path = os.environ.get('CUDA_PATH_V_12_9')\n",
        "if cuda_path:\n",
        "    print(f\"Found CUDA 12.9 at: {cuda_path}\")\n",
        "    bin_path = os.path.join(cuda_path, 'bin')\n",
        "    if bin_path not in os.environ['PATH']:\n",
        "        os.environ['PATH'] = bin_path + os.pathsep + os.environ['PATH']\n",
        "        print(\"Added CUDA bin to system PATH.\")\n",
        "    \n",
        "    # Ensure CUDA_HOME is set\n",
        "    if 'CUDA_HOME' not in os.environ:\n",
        "        os.environ['CUDA_HOME'] = cuda_path\n",
        "else:\n",
        "    print(\"CUDA_PATH_V_12_9 not found in environment variables. Checking standard CUDA_PATH...\")\n",
        "    cuda_path_std = os.environ.get('CUDA_PATH')\n",
        "    if cuda_path_std:\n",
        "        print(f\"Found CUDA_PATH: {cuda_path_std}\")\n",
        "\n",
        "# --- Diagnostic: PyTorch Check (Requested) ---\n",
        "try:\n",
        "    import torch\n",
        "    print(\"PyTorch Version:\", torch.__version__)\n",
        "    device = torch.device(\"cuda\" if torch.cuda.is_available() else \"cpu\")\n",
        "    print(f\"PyTorch Device: {device}\")\n",
        "    if device.type == 'cuda':\n",
        "        print(f\"PyTorch sees GPU: {torch.cuda.get_device_name(0)}\")\n",
        "except ImportError:\n",
        "    print(\"PyTorch not installed. Skipping diagnostic.\")\n",
        "except Exception as e:\n",
        "    print(f\"PyTorch Diagnostic Error: {e}\")\n",
        "\n"
    ]
    
    # Prepend to ensuring it runs before TF load
    target_cell['source'] = path_code + target_cell['source']
    
    try:
        with open(nb_path, 'w', encoding='utf-8') as f:
            json.dump(nb, f, indent=1)
        print("Notebook updated successfully with Path config.", flush=True)
    except Exception as e:
        print(f"Error writing notebook: {e}", flush=True)

else:
    print("Error: Could not find imports cell.", flush=True)
