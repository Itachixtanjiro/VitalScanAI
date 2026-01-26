import h5py
import json
import os

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# Target the H5 file (more reliable to patch than .keras zip)
MODEL_PATH = os.path.abspath(os.path.join(BASE_DIR, "../Models/Chest_xray/models_export/xray/best_hybrid_model.h5"))
PATCHED_PATH = os.path.abspath(os.path.join(BASE_DIR, "../Models/Chest_xray/models_export/xray/patched_model.h5"))

print(f"Original Model: {MODEL_PATH}")
print(f"Target Patched Model: {PATCHED_PATH}")

if not os.path.exists(MODEL_PATH):
    print("Error: Original .h5 model file not found!")
    exit(1)

def clean_config(config):
    """Recursively remove Keras 3 specific keys from config dict."""
    if isinstance(config, dict):
        # Keys to remove
        for key in ['batch_shape', 'dtype', 'dtype_policy', 'optional', 'ragged']:
            if key in config:
                print(f"  Removing incompatible key: {key}")
                del config[key]
        
        # Rename 'batch_input_shape' if needed or ensure it exists? 
        # Actually Keras 2 needs 'batch_input_shape'. Keras 3 often puts 'batch_shape' in 'layers[0]'.
        # If we deleted 'batch_shape', we might need to verify 'batch_input_shape' exists for InputLayer.
        if config.get('class_name') == 'InputLayer':
             if 'batch_shape' in config.get('config', {}):
                  bs = config['config']['batch_shape']
                  del config['config']['batch_shape']
                  config['config']['batch_input_shape'] = bs
                  print("  Converted batch_shape -> batch_input_shape for InputLayer")

        # Recursively clean values
        for k, v in config.items():
            clean_config(v)
            
        # Specific Layer Fixes
        if config.get('class_name') == 'Functional':
             # Functional models in Keras 3 might store input info differently
             pass
             
    elif isinstance(config, list):
        for item in config:
            clean_config(item)

try:
    # Open original file in read mode
    with h5py.File(MODEL_PATH, 'r') as f_src:
        # Copy to new file
        print("Copying model to patch file...")
        with h5py.File(PATCHED_PATH, 'w') as f_dst:
            for key in f_src.keys():
                f_src.copy(key, f_dst)
            
            # Read Model Config
            if 'model_config' not in f_dst.attrs:
                print("Error: No model_config found in H5 file.")
                exit(1)
                
            json_str = f_dst.attrs['model_config'].decode('utf-8')
            model_config = json.loads(json_str)
            
            print("Cleaning Model Config...")
            clean_config(model_config)
            
            # Write back
            new_json_str = json.dumps(model_config)
            f_dst.attrs['model_config'] = new_json_str.encode('utf-8')
            
            print("SUCCESS: Model patched and saved.")
        
except Exception as e:
    print(f"FAILED to patch model: {e}")
    import traceback
    traceback.print_exc()
