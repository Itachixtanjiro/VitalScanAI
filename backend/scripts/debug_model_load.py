import os
import tensorflow as tf
import sys

# Force absolute path setup
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# ../../.. to get to backend root from scripts? No, run from root.
# Let's just use the absolute path we believe is correct.

MODEL_PATH = r"D:\VitalScanAI\backend\Models\Chest_xray\models_export\xray\hybrid_chest_xray_model.keras"

print(f"Python Executable: {sys.executable}")
print(f"TensorFlow Version: {tf.__version__}")
print(f"Attempting to load model from: {MODEL_PATH}")

if not os.path.exists(MODEL_PATH):
    print("ERROR: File does not exist at specified path!")
    sys.exit(1)

try:
    model = tf.keras.models.load_model(MODEL_PATH)
    print("SUCCESS: Model loaded successfully.")
    model.summary()
except Exception as e:
    print(f"FAILURE: Could not load model. Error details:\n{e}")
    import traceback
    traceback.print_exc()
