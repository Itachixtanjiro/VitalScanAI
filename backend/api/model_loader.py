import os
import joblib
import tensorflow as tf
import numpy as np
import random
from config import settings
from loguru import logger

# Suppress TensorFlow oneDNN messages to reduce console noise
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"  # Suppress INFO and WARNING logs

# --- Shim for Keras 3 compatibility ---
class SafeInputLayer(tf.keras.layers.InputLayer):
    def __init__(self, batch_shape=None, optional=None, **kwargs):
        if batch_shape is not None:
            kwargs['batch_input_shape'] = batch_shape
        super().__init__(**kwargs)
    def get_config(self):
        return super().get_config()

# --- Mock Model for Fallback/Demo Mode ---
class MockModel:
    def __init__(self, model_type="xray"):
        self.model_type = model_type
        
    def predict(self, data):
        # Return dummy data matching the shape expected by routers
        if self.model_type == "xray":
            # X-ray: 15 classes, user expects [ [probs...] ]
            # Random probabilities normalized
            probs = np.random.dirichlet(np.ones(15), size=1)
            return probs
        elif self.model_type == "cancer":
            # Cancer: Returns [class] (0 or 1)
            return np.array([random.randint(0, 1)])
        elif self.model_type == "diabetes":
            # Diabetes: Returns [class] (0 or 1)
            return np.array([random.randint(0, 1)])
        return np.array([0])

    def predict_proba(self, data):
        # Used by Cancer/Diabetes
        # Returns [ [prob_0, prob_1] ]
        p1 = random.uniform(0.1, 0.9)
        return np.array([[1-p1, p1]])

# --- Main Loader ---
class ModelLoader:
    _instances = {}

    @staticmethod
    def _get_abs_path(relative_path):
        base_dir = os.path.dirname(os.path.abspath(__file__))
        return os.path.abspath(os.path.join(base_dir, "../Models", relative_path))

    @staticmethod
    def get_xray_model():
        if 'xray' not in ModelLoader._instances:
            if settings.MOCK_ML_PIPELINE:
                logger.warning("Using MOCK X-Ray Model (Configured via MOCK_ML_PIPELINE)")
                ModelLoader._instances['xray'] = MockModel("xray")
                return ModelLoader._instances['xray']

            # PATHS
            patched_path = ModelLoader._get_abs_path("Chest_xray/models_export/xray/patched_model.h5")
            original_keras = ModelLoader._get_abs_path("Chest_xray/models_export/xray/hybrid_chest_xray_model.keras")
            fallback_h5 = ModelLoader._get_abs_path("Chest_xray/models_export/xray/best_hybrid_model.h5")

            custom_objects = {'InputLayer': SafeInputLayer}

            try:
                # 1. Try Patched Model (Best for Keras 2)
                if os.path.exists(patched_path):
                    logger.info(f"Loading PATCHED X-Ray model: {patched_path}")
                    ModelLoader._instances['xray'] = tf.keras.models.load_model(patched_path, compile=False, custom_objects=custom_objects)
                    logger.success("X-Ray model loaded successfully")

                # 2. Try Original .keras (Works if server is Keras 3)
                elif os.path.exists(original_keras):
                    logger.info(f"Loading Original X-Ray model: {original_keras}")
                    ModelLoader._instances['xray'] = tf.keras.models.load_model(original_keras, compile=False, custom_objects=custom_objects)
                    logger.success("X-Ray model loaded successfully")

                # 3. Try Fallback .h5 (Might fail if not patched)
                elif os.path.exists(fallback_h5):
                    logger.info(f"Loading Fallback X-Ray model: {fallback_h5}")
                    ModelLoader._instances['xray'] = tf.keras.models.load_model(fallback_h5, compile=False, custom_objects=custom_objects)
                    logger.success("X-Ray model loaded successfully")
                else:
                    error_msg = f"No X-Ray model files found. Searched: {patched_path}, {original_keras}, {fallback_h5}"
                    logger.error(error_msg)
                    # FAIL LOUDLY instead of silent mock fallback
                    logger.warning("Using MOCK model as fallback - results will be RANDOM and NOT MEDICAL-GRADE")
                    ModelLoader._instances['xray'] = MockModel("xray")

            except Exception as e:
                logger.exception(f"CRITICAL: Failed to load X-Ray model: {e}")
                logger.warning("Using MOCK model as fallback - results will be RANDOM and NOT MEDICAL-GRADE")
                ModelLoader._instances['xray'] = MockModel("xray")

        return ModelLoader._instances['xray']

    @staticmethod
    def get_cancer_model():
        if 'cancer' not in ModelLoader._instances:
            if settings.MOCK_ML_PIPELINE:
                logger.warning("Using MOCK Cancer Model (Configured via MOCK_ML_PIPELINE)")
                ModelLoader._instances['cancer'] = MockModel("cancer")
                return ModelLoader._instances['cancer']

            path = ModelLoader._get_abs_path("Cancer_risk/cancer_risk_model.joblib")
            try:
                if os.path.exists(path):
                    logger.info(f"Loading Cancer model: {path}")
                    ModelLoader._instances['cancer'] = joblib.load(path)
                    logger.success("Cancer model loaded successfully")
                else:
                    error_msg = f"Cancer model not found at {path}"
                    logger.error(error_msg)
                    logger.warning("Using MOCK model as fallback - results will be RANDOM and NOT MEDICAL-GRADE")
                    ModelLoader._instances['cancer'] = MockModel("cancer")
            except Exception as e:
                logger.exception(f"CRITICAL: Failed to load Cancer model: {e}")
                logger.warning("Using MOCK model as fallback - results will be RANDOM and NOT MEDICAL-GRADE")
                ModelLoader._instances['cancer'] = MockModel("cancer")
        return ModelLoader._instances['cancer']

    @staticmethod
    def get_diabetes_model():
        if 'diabetes' not in ModelLoader._instances:
            if settings.MOCK_ML_PIPELINE:
                logger.warning("Using MOCK Diabetes Model (Configured via MOCK_ML_PIPELINE)")
                class MockScaler:
                    def transform(self, data): return data
                ModelLoader._instances['diabetes'] = (MockModel("diabetes"), MockScaler())
                return ModelLoader._instances['diabetes']

            path = ModelLoader._get_abs_path("Diabetic_risk/diabetic_risk_model.joblib")
            scaler_path = ModelLoader._get_abs_path("Diabetic_risk/diabetic_risk_scaler.joblib")
            try:
                if os.path.exists(path) and os.path.exists(scaler_path):
                    logger.info(f"Loading Diabetes model: {path}")
                    model = joblib.load(path)
                    scaler = joblib.load(scaler_path)
                    ModelLoader._instances['diabetes'] = (model, scaler)
                    logger.success("Diabetes model and scaler loaded successfully")
                else:
                    error_msg = f"Diabetes model files missing at {path} or {scaler_path}"
                    logger.error(error_msg)
                    logger.warning("Using MOCK model as fallback - results will be RANDOM and NOT MEDICAL-GRADE")
                    class MockScaler:
                        def transform(self, data): return data
                    ModelLoader._instances['diabetes'] = (MockModel("diabetes"), MockScaler())
            except Exception as e:
                logger.exception(f"CRITICAL: Failed to load Diabetes model: {e}")
                logger.warning("Using MOCK model as fallback - results will be RANDOM and NOT MEDICAL-GRADE")
                class MockScaler:
                    def transform(self, data): return data
                ModelLoader._instances['diabetes'] = (MockModel("diabetes"), MockScaler())
        return ModelLoader._instances['diabetes']
