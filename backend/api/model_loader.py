import os
import zipfile
import joblib
import pickle
import tensorflow as tf
import keras
import tf_keras
import numpy as np
import random
from config import settings
from loguru import logger

# Suppress TensorFlow oneDNN messages to reduce console noise
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"  # Suppress INFO and WARNING logs


def _load_keras_model(filepath, compile=False):
    """Load a Keras model, auto-detecting Keras 3 zip vs Keras 2 HDF5 format.

    - Keras 3 .keras files (zip archives) -> keras.models.load_model()
    - Keras 2 HDF5 files (.h5 or misnamed .keras) -> tf_keras.models.load_model()

    Forward slashes are used for Keras 3 compatibility on Windows.
    """
    # Normalize to forward slashes (Keras 3 requires this on Windows)
    filepath_fwd = filepath.replace("\\", "/")

    if zipfile.is_zipfile(filepath):
        logger.debug(f"Detected Keras 3 zip format: {filepath}")
        return keras.models.load_model(filepath_fwd, compile=compile)
    else:
        logger.debug(f"Detected HDF5/legacy format: {filepath}")
        return tf_keras.models.load_model(filepath, compile=compile)

# --- Custom Exception ---
class ModelLoadError(Exception):
    """Raised when a model fails to load and no fallback is available."""
    pass

# --- Mock Model for Fallback/Demo Mode ---
class MockModel:
    def __init__(self, model_type="xray"):
        self.model_type = model_type
        self.name = f"MockModel_{model_type}"
        self.layers = []

    def predict(self, data):
        if self.model_type == "xray":
            probs = np.random.dirichlet(np.ones(15), size=1)
            return probs
        elif self.model_type == "cancer":
            return np.array([random.randint(0, 1)])
        elif self.model_type == "diabetes":
            return np.array([random.randint(0, 1)])
        return np.array([0])

    def predict_proba(self, data):
        p1 = random.uniform(0.1, 0.9)
        return np.array([[1-p1, p1]])

# --- Main Loader ---
class ModelLoader:
    _instances = {}

    @staticmethod
    def _get_abs_path(relative_path):
        base_dir = os.path.dirname(os.path.abspath(__file__))
        return os.path.abspath(os.path.join(base_dir, "../Models", relative_path))

    # ============================================================
    # X-RAY FUSION MODEL (Prediction)
    # ============================================================
    @staticmethod
    def get_xray_model():
        if 'xray' not in ModelLoader._instances:
            if settings.MOCK_ML_PIPELINE:
                logger.warning("Using MOCK X-Ray Model (Configured via MOCK_ML_PIPELINE)")
                ModelLoader._instances['xray'] = MockModel("xray")
                return ModelLoader._instances['xray']

            original_keras = ModelLoader._get_abs_path("Chest_xray/models_export/xray/hybrid_chest_xray_model.keras")
            fallback_h5 = ModelLoader._get_abs_path("Chest_xray/models_export/xray/best_hybrid_model.h5")

            try:
                if os.path.exists(original_keras):
                    logger.info(f"Loading X-Ray fusion model: {original_keras}")
                    ModelLoader._instances['xray'] = _load_keras_model(original_keras)
                    logger.success("X-Ray fusion model loaded successfully")

                elif os.path.exists(fallback_h5):
                    logger.info(f"Loading Fallback X-Ray model: {fallback_h5}")
                    ModelLoader._instances['xray'] = _load_keras_model(fallback_h5)
                    logger.success("X-Ray fusion model loaded successfully")
                else:
                    error_msg = f"No X-Ray model files found. Searched: {original_keras}, {fallback_h5}"
                    logger.error(error_msg)
                    raise ModelLoadError(error_msg)

            except ModelLoadError:
                raise
            except Exception as e:
                error_msg = f"Failed to load X-Ray model: {e}"
                logger.exception(f"CRITICAL: {error_msg}")
                raise ModelLoadError(error_msg)

        return ModelLoader._instances['xray']

    # ============================================================
    # X-RAY DENSENET MODEL (Grad-CAM)
    # ============================================================
    @staticmethod
    def get_xray_gradcam_model():
        """Load standalone DenseNet Phase 1 model for Grad-CAM computation.

        This is separate from the fusion model because Grad-CAM requires
        direct access to conv5_block16_concat as a top-level layer,
        which is nested inside the fusion model's sub-model architecture.
        """
        if 'xray_gradcam' not in ModelLoader._instances:
            if settings.MOCK_ML_PIPELINE:
                logger.warning("MOCK mode - Grad-CAM model not available")
                ModelLoader._instances['xray_gradcam'] = None
                return None

            densenet_path = ModelLoader._get_abs_path("Chest_xray/models_export/xray/densenet_phase1_best.keras")

            try:
                if os.path.exists(densenet_path):
                    logger.info(f"Loading DenseNet Grad-CAM model: {densenet_path}")
                    ModelLoader._instances['xray_gradcam'] = _load_keras_model(densenet_path)
                    logger.success("DenseNet Grad-CAM model loaded successfully")
                else:
                    logger.warning(f"DenseNet Grad-CAM model not found at {densenet_path}")
                    ModelLoader._instances['xray_gradcam'] = None
            except Exception as e:
                logger.error(f"Failed to load DenseNet Grad-CAM model: {e}")
                ModelLoader._instances['xray_gradcam'] = None

        return ModelLoader._instances.get('xray_gradcam')

    # ============================================================
    # CANCER MODEL (Cervical Cancer - Logistic Regression)
    # ============================================================
    @staticmethod
    def get_cancer_model():
        if 'cancer' not in ModelLoader._instances:
            if settings.MOCK_ML_PIPELINE:
                logger.warning("Using MOCK Cancer Model (Configured via MOCK_ML_PIPELINE)")
                ModelLoader._instances['cancer'] = MockModel("cancer")
                return ModelLoader._instances['cancer']

            path = ModelLoader._get_abs_path("Cancer_risk/cervical_cancer_model.pkl")
            try:
                if os.path.exists(path):
                    logger.info(f"Loading Cancer model: {path}")
                    ModelLoader._instances['cancer'] = joblib.load(path)
                    logger.success("Cancer model loaded successfully")
                else:
                    error_msg = f"Cancer model not found at {path}"
                    logger.error(error_msg)
                    raise ModelLoadError(error_msg)
            except ModelLoadError:
                raise
            except Exception as e:
                error_msg = f"Failed to load Cancer model: {e}"
                logger.exception(f"CRITICAL: {error_msg}")
                raise ModelLoadError(error_msg)
        return ModelLoader._instances['cancer']

    # ============================================================
    # CANCER SCALER (StandardScaler for feature normalization)
    # ============================================================
    @staticmethod
    def get_cancer_scaler():
        """Load the StandardScaler for cervical cancer model.

        Note: scaler.pkl in the Cancer_risk directory contains feature names
        (numpy array), not an actual scaler. Returns None if the file is not
        a valid scaler with a transform() method.
        """
        if 'cancer_scaler' not in ModelLoader._instances:
            path = ModelLoader._get_abs_path("Cancer_risk/scaler.pkl")
            try:
                if os.path.exists(path):
                    obj = joblib.load(path)
                    if hasattr(obj, 'transform'):
                        logger.info(f"Loaded Cancer scaler: {type(obj).__name__}")
                        ModelLoader._instances['cancer_scaler'] = obj
                    else:
                        logger.info("Cancer scaler file contains feature names, not a scaler - model uses raw features")
                        ModelLoader._instances['cancer_scaler'] = None
                else:
                    logger.info("No cancer scaler file found - model uses raw features")
                    ModelLoader._instances['cancer_scaler'] = None
            except Exception as e:
                logger.error(f"Failed to load Cancer scaler: {e}")
                ModelLoader._instances['cancer_scaler'] = None
        return ModelLoader._instances.get('cancer_scaler')

    # ============================================================
    # DIABETES MODEL (Random Forest + Scaler)
    # ============================================================
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
                    raise ModelLoadError(error_msg)
            except ModelLoadError:
                raise
            except Exception as e:
                error_msg = f"Failed to load Diabetes model: {e}"
                logger.exception(f"CRITICAL: {error_msg}")
                raise ModelLoadError(error_msg)
        return ModelLoader._instances['diabetes']
