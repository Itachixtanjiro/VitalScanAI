import sys
import os
import tensorflow as tf
from api.model_loader import ModelLoader

# Add backend to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

print("Python executable:", sys.executable)
print("TF Version:", tf.__version__)

try:
    print("Attempting to load X-Ray model...")
    model = ModelLoader.get_xray_model()
    print("SUCCESS: Model loaded.")
    model.summary()
except Exception as e:
    print(f"FAILURE: {e}")
    import traceback
    traceback.print_exc()
