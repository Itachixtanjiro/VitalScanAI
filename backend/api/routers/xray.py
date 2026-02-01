"""X-Ray Analysis Endpoint with Real Grad-CAM Visualization.

Architecture: DenseNet121 + VGG16 Late Fusion
- Prediction uses the full fusion model (hybrid_chest_xray_model.keras)
- Grad-CAM uses the standalone DenseNet Phase 1 model (densenet_phase1_best.keras)
  because conv5_block16_concat is a top-level layer in the DenseNet model,
  avoiding graph disconnection issues with the late fusion model's nested architecture.

Grad-CAM Layer: conv5_block16_concat (DenseNet branch)
Output: JSON with findings and base64-encoded Grad-CAM heatmap
"""
from fastapi import APIRouter, UploadFile, File, HTTPException
import numpy as np
import tensorflow as tf
import tf_keras
from tensorflow.keras.applications.densenet import preprocess_input
from PIL import Image
import io
import base64
import asyncio
import gc
import logging
from typing import Optional
from api.model_loader import ModelLoader, ModelLoadError

logger = logging.getLogger(__name__)
router = APIRouter()

# Set Matplotlib backend to 'Agg' (headless) before importing pyplot
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

# Configuration
IMG_SIZE = (224, 224)
GRADCAM_LAYER = 'conv5_block16_concat'  # DenseNet121 target layer for Grad-CAM
CLASSES = [
    'Atelectasis', 'Cardiomegaly', 'Consolidation', 'Edema', 'Effusion',
    'Emphysema', 'Fibrosis', 'Hernia', 'Infiltration', 'Mass', 'No Finding',
    'Nodule', 'Pleural_Thickening', 'Pneumonia', 'Pneumothorax'
]


# ============================================================
# IMAGE PREPROCESSING
# ============================================================
def preprocess_image(image_bytes: bytes) -> tuple:
    """
    Preprocess image for DenseNet-based model.

    Uses keras.applications.densenet.preprocess_input which scales pixels
    to [-1, 1] range (NOT /255.0 normalization).

    Returns: (preprocessed_array, original_rgb_array)
    """
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img = img.resize(IMG_SIZE)
    original_array = np.array(img)

    # Convert to array and add batch dimension
    img_array = tf.keras.preprocessing.image.img_to_array(img)
    img_array = np.expand_dims(img_array, axis=0)

    # Apply DenseNet preprocessing (scales to [-1, 1], NOT /255.0)
    img_array = preprocess_input(img_array)

    return img_array, original_array


# ============================================================
# GRAD-CAM IMPLEMENTATION
# ============================================================
def _find_target_layer(model, layer_name: str):
    """Find a layer by name, searching nested sub-models if needed."""
    try:
        return model.get_layer(layer_name)
    except ValueError:
        for layer in model.layers:
            if hasattr(layer, 'get_layer'):
                try:
                    return layer.get_layer(layer_name)
                except ValueError:
                    continue
    return None


def compute_gradcam(
    gradcam_model,
    img_array: np.ndarray,
    layer_name: str = GRADCAM_LAYER
) -> Optional[np.ndarray]:
    """
    Compute Grad-CAM heatmap using TensorFlow GradientTape.

    Uses the standalone DenseNet Phase 1 model (not the fusion model)
    to avoid graph disconnection issues. This matches the notebook's
    design where Grad-CAM is computed on the DenseNet model.

    Args:
        gradcam_model: DenseNet Phase 1 Keras model (standalone)
        img_array: Preprocessed image array (batch, H, W, C)
        layer_name: Name of the target convolutional layer

    Returns:
        Heatmap as numpy array (H, W) normalized to [0, 1], or None if failed
    """
    try:
        target_layer = _find_target_layer(gradcam_model, layer_name)
        if target_layer is None:
            logger.error(f"Layer {layer_name} not found in Grad-CAM model")
            return None

        # Build gradient model: input -> [conv_output, predictions]
        # Use tf_keras.Model because the DenseNet model is loaded via tf_keras (HDF5 format)
        grad_model = tf_keras.Model(
            inputs=gradcam_model.inputs,
            outputs=[target_layer.output, gradcam_model.output]
        )

        # Cast to float32 tensor for GradientTape
        img_tensor = tf.cast(img_array, tf.float32)

        # Compute gradients
        with tf.GradientTape() as tape:
            tape.watch(img_tensor)
            conv_outputs, predictions = grad_model(img_tensor, training=False)
            # Get index of top predicted class
            pred_index = tf.argmax(predictions[0])
            class_channel = predictions[:, pred_index]

        # Compute gradients of the top class with respect to feature maps
        grads = tape.gradient(class_channel, conv_outputs)

        if grads is None:
            logger.warning("Gradients are None - model may not support Grad-CAM")
            return None

        # Global average pooling of gradients
        pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))

        # Weight feature maps by gradients
        conv_outputs = conv_outputs[0]
        heatmap = conv_outputs @ pooled_grads[..., tf.newaxis]
        heatmap = tf.squeeze(heatmap)

        # ReLU and normalize
        heatmap = tf.maximum(heatmap, 0)
        max_val = tf.math.reduce_max(heatmap)
        if max_val > 0:
            heatmap = heatmap / max_val

        # Resize to input image size
        heatmap = tf.expand_dims(heatmap, axis=-1)
        heatmap = tf.image.resize(heatmap, IMG_SIZE)
        heatmap = tf.squeeze(heatmap)

        return heatmap.numpy()

    except Exception as e:
        logger.error(f"Grad-CAM computation failed: {e}")
        return None


def encode_gradcam_overlay(heatmap: np.ndarray, original_image: np.ndarray, alpha: float = 0.4) -> str:
    """
    Create a colored Grad-CAM overlay on the original image and encode as base64.

    Args:
        heatmap: Grad-CAM heatmap (H, W) normalized to [0, 1]
        original_image: Original RGB image array (H, W, 3)
        alpha: Overlay transparency (0-1)

    Returns:
        Base64-encoded PNG image string with data URI prefix
    """
    # Apply jet colormap to heatmap
    cmap = plt.get_cmap('jet')
    colored_heatmap = cmap(heatmap)[:, :, :3]  # Remove alpha channel
    colored_heatmap = np.uint8(255 * colored_heatmap)

    # Normalize original image if needed
    if original_image.max() <= 1.0:
        original_image = np.uint8(255 * original_image)

    # Blend heatmap with original image
    superimposed = colored_heatmap * alpha + original_image * (1 - alpha)
    superimposed = np.clip(superimposed, 0, 255).astype(np.uint8)

    # Convert to PIL and encode as base64
    img_pil = Image.fromarray(superimposed)
    buffer = io.BytesIO()
    img_pil.save(buffer, format='PNG', optimize=True)
    buffer.seek(0)
    img_base64 = base64.b64encode(buffer.read()).decode('utf-8')

    return f"data:image/png;base64,{img_base64}"


# ============================================================
# ENDPOINTS
# ============================================================
@router.get("/model-info")
async def get_model_info():
    """Diagnostic endpoint to check model status and architecture info."""
    try:
        model = ModelLoader.get_xray_model()

        # Check if Grad-CAM model is available
        gradcam_model = ModelLoader.get_xray_gradcam_model()
        gradcam_available = False
        gradcam_source = "none"

        if gradcam_model is not None:
            layer = _find_target_layer(gradcam_model, GRADCAM_LAYER)
            if layer is not None:
                gradcam_available = True
                gradcam_source = "densenet_phase1"

        return {
            "status": "ready",
            "model_name": model.name if hasattr(model, 'name') else "Unknown",
            "total_layers": len(model.layers),
            "gradcam_layer": GRADCAM_LAYER,
            "gradcam_available": gradcam_available,
            "gradcam_source": gradcam_source,
            "classes": CLASSES,
            "num_classes": len(CLASSES),
            "input_size": IMG_SIZE,
            "preprocessing": "densenet_preprocess_input"
        }
    except ModelLoadError as e:
        return {"status": "error", "message": f"Model not loaded: {e}"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@router.post("/")
async def predict_xray(
    file: UploadFile = File(...),
    include_gradcam: bool = True
):
    """
    Analyze chest X-ray with multi-label disease detection and Grad-CAM visualization.

    **Prediction Model**: DenseNet121 + VGG16 Late Fusion (Hybrid model)
    **Grad-CAM Model**: Standalone DenseNet121 Phase 1 (for explainability)
    **Classes**: 15 chest conditions including No Finding
    **Grad-CAM**: Real gradient-weighted class activation mapping on conv5_block16_concat

    Args:
        file: X-ray image file (PNG, JPG)
        include_gradcam: Whether to include Grad-CAM heatmap (default: True)

    Returns:
        JSON with findings, top finding, and optional Grad-CAM heatmap
    """
    # Load prediction model (fusion model)
    try:
        prediction_model = ModelLoader.get_xray_model()
    except ModelLoadError as e:
        raise HTTPException(status_code=503, detail=f"X-Ray Model not loaded: {e}")

    if not prediction_model:
        raise HTTPException(status_code=503, detail="X-Ray Model not available")

    try:
        # Read and preprocess image
        content = await file.read()
        img_array, original_image = await asyncio.to_thread(preprocess_image, content)

        # Run inference using fusion model
        preds = await asyncio.to_thread(prediction_model.predict, img_array)

        # Format findings (new format: label + confidence)
        findings = []
        for i, class_name in enumerate(CLASSES):
            findings.append({
                "label": class_name,
                "confidence": float(preds[0][i])
            })

        # Sort by confidence (descending)
        findings.sort(key=lambda x: x['confidence'], reverse=True)
        findings = findings[:3]

        # Get top finding
        top_finding = findings[0]

        # Compute Grad-CAM if requested (using standalone DenseNet model)
        gradcam_heatmap = None
        if include_gradcam:
            gradcam_model = ModelLoader.get_xray_gradcam_model()

            if gradcam_model is not None:
                heatmap = await asyncio.to_thread(
                    compute_gradcam, gradcam_model, img_array, GRADCAM_LAYER
                )
                if heatmap is not None:
                    gradcam_heatmap = await asyncio.to_thread(
                        encode_gradcam_overlay, heatmap, original_image
                    )
                    logger.info(f"Grad-CAM generated for top finding: {top_finding['label']}")
                else:
                    logger.warning("Grad-CAM heatmap computation returned None")
            else:
                logger.warning(
                    "DenseNet Grad-CAM model not available - "
                    "returning prediction without heatmap"
                )

        # Cleanup
        del img_array, original_image, content
        gc.collect()

        return {
            "ingestion_metadata": {
                "document_type": "radiograph",
                "file_name": file.filename
            },
            "findings": findings,
            "top_finding": top_finding,
            "gradcam_heatmap": gradcam_heatmap,
            "model_info": {
                "architecture": "DenseNet121_VGG16_LateFusion",
                "gradcam_layer": GRADCAM_LAYER,
                "preprocessing": "densenet_preprocess_input"
            }
        }

    except Exception as e:
        logger.error(f"X-ray prediction failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
