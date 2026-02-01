try:
    import tf_keras
    print("tf_keras is installed.")
except ImportError:
    print("tf_keras is NOT installed.")

try:
    import keras
    print(f"keras version: {keras.__version__}")
except ImportError:
    print("keras is NOT installed.")

try:
    import tensorflow as tf
    print(f"tensorflow version: {tf.__version__}")
except ImportError:
    print("tensorflow is NOT installed.")
