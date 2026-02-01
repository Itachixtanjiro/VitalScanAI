"""Real Grad-CAM Implementation using TensorFlow GradientTape.

This module provides Gradient-weighted Class Activation Mapping (Grad-CAM)
for model interpretability in medical imaging applications.

Reference: Selvaraju et al. "Grad-CAM: Visual Explanations from Deep Networks
via Gradient-based Localization" (ICCV 2017)
"""
import logging
import base64
import io
import numpy as np
import tensorflow as tf
from PIL import Image
from typing import Optional, Tuple

logger = logging.getLogger(__name__)


class GradCAMGenerator:
    """Generates Gradient-weighted Class Activation Maps for model explainability."""

    # Common target layers for different architectures
    LAYER_MAPPINGS = {
        'densenet': 'conv5_block16_concat',
        'vgg16': 'block5_conv3',
        'resnet50': 'conv5_block3_out',
        'efficientnet': 'top_conv',
        'inception': 'mixed10'
    }

    def __init__(self):
        self._layer_cache = {}

    def find_target_layer(self, model: tf.keras.Model, architecture: str = None) -> Optional[str]:
        """
        Auto-detect the best convolutional layer for Grad-CAM.

        Args:
            model: Keras model
            architecture: Optional hint for architecture type

        Returns:
            Name of the target layer, or None if not found
        """
        model_id = id(model)
        if model_id in self._layer_cache:
            return self._layer_cache[model_id]

        target_layer = None

        # Priority 1: Use architecture hint if provided
        if architecture and architecture.lower() in self.LAYER_MAPPINGS:
            layer_name = self.LAYER_MAPPINGS[architecture.lower()]
            if self._layer_exists(model, layer_name):
                target_layer = layer_name

        # Priority 2: Try common DenseNet layer (for chest X-ray model)
        if target_layer is None:
            if self._layer_exists(model, 'conv5_block16_concat'):
                target_layer = 'conv5_block16_concat'

        # Priority 3: Try common VGG layer
        if target_layer is None:
            if self._layer_exists(model, 'block5_conv3'):
                target_layer = 'block5_conv3'

        # Priority 4: Find any suitable conv layer with 4D output
        if target_layer is None:
            for layer in reversed(model.layers):
                try:
                    shape = layer.output_shape
                    if isinstance(shape, tuple) and len(shape) == 4:
                        # Look for layers with spatial dimensions between 4-28 and at least 256 filters
                        if shape[1] and 4 <= shape[1] <= 28 and shape[-1] and shape[-1] >= 256:
                            target_layer = layer.name
                            break
                except (AttributeError, TypeError):
                    continue

        self._layer_cache[model_id] = target_layer
        if target_layer:
            logger.info(f"Grad-CAM target layer: {target_layer}")
        else:
            logger.warning("Could not find suitable Grad-CAM target layer")
        return target_layer

    def _layer_exists(self, model: tf.keras.Model, layer_name: str) -> bool:
        """Check if a layer exists in the model (including nested models)."""
        try:
            model.get_layer(layer_name)
            return True
        except ValueError:
            # Check in nested models
            for layer in model.layers:
                if hasattr(layer, 'get_layer'):
                    try:
                        layer.get_layer(layer_name)
                        return True
                    except ValueError:
                        continue
            return False

    def _get_layer(self, model: tf.keras.Model, layer_name: str):
        """Get a layer from the model (including nested models)."""
        try:
            return model.get_layer(layer_name)
        except ValueError:
            for layer in model.layers:
                if hasattr(layer, 'get_layer'):
                    try:
                        return layer.get_layer(layer_name)
                    except ValueError:
                        continue
            raise ValueError(f"Layer {layer_name} not found")

    def compute_heatmap(
        self,
        model: tf.keras.Model,
        img_array: np.ndarray,
        class_index: int = None,
        target_layer_name: str = None
    ) -> Optional[np.ndarray]:
        """
        Compute Grad-CAM heatmap using TensorFlow GradientTape.

        Args:
            model: Keras model
            img_array: Preprocessed image array with shape (1, H, W, C)
            class_index: Target class index (None = use predicted class)
            target_layer_name: Name of target conv layer (None = auto-detect)

        Returns:
            Heatmap as numpy array (H, W) normalized to [0, 1], or None if failed
        """
        try:
            # Get target layer
            layer_name = target_layer_name or self.find_target_layer(model)
            if not layer_name:
                logger.error("No target layer found for Grad-CAM")
                return None

            target_layer = self._get_layer(model, layer_name)

            # Build gradient model
            grad_model = tf.keras.Model(
                inputs=model.inputs,
                outputs=[target_layer.output, model.output]
            )

            # Convert to tensor
            img_tensor = tf.cast(img_array, tf.float32)

            # Compute gradients (training=False for Keras 3 compatibility)
            with tf.GradientTape() as tape:
                tape.watch(img_tensor)
                conv_output, predictions = grad_model(img_tensor, training=False)

                # Use specified class or top predicted class
                if class_index is None:
                    class_index = tf.argmax(predictions[0]).numpy()

                class_score = predictions[:, class_index]

            # Compute gradients of the class score with respect to conv output
            grads = tape.gradient(class_score, conv_output)

            if grads is None:
                logger.warning("Gradients are None - model may not support Grad-CAM")
                return None

            # Global average pooling of gradients
            pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))

            # Weight feature maps by gradients
            conv_output = conv_output[0]
            heatmap = conv_output @ pooled_grads[..., tf.newaxis]
            heatmap = tf.squeeze(heatmap)

            # ReLU activation
            heatmap = tf.maximum(heatmap, 0)

            # Normalize
            max_val = tf.math.reduce_max(heatmap)
            if max_val > 0:
                heatmap = heatmap / max_val

            return heatmap.numpy()

        except Exception as e:
            logger.error(f"Grad-CAM heatmap computation failed: {e}")
            return None

    def generate(
        self,
        model: tf.keras.Model,
        img_array: np.ndarray,
        original_image: np.ndarray,
        class_index: int = None,
        target_layer_name: str = None,
        alpha: float = 0.4,
        colormap: str = 'jet'
    ) -> Optional[str]:
        """
        Generate base64-encoded Grad-CAM overlay image.

        Args:
            model: Keras model
            img_array: Preprocessed image array (1, H, W, C)
            original_image: Original RGB image array (H, W, 3)
            class_index: Target class index (None = predicted class)
            target_layer_name: Name of target conv layer (None = auto-detect)
            alpha: Overlay transparency (0-1)
            colormap: Matplotlib colormap name

        Returns:
            Base64-encoded PNG with data URI prefix, or None if failed
        """
        try:
            import matplotlib.pyplot as plt

            # Compute heatmap
            heatmap = self.compute_heatmap(model, img_array, class_index, target_layer_name)
            if heatmap is None:
                return None

            # Resize heatmap to original image size
            target_size = (original_image.shape[1], original_image.shape[0])  # (width, height)
            heatmap_resized = np.array(
                Image.fromarray(np.uint8(255 * heatmap)).resize(
                    target_size,
                    Image.Resampling.BILINEAR
                )
            ) / 255.0

            # Apply colormap
            cmap = plt.get_cmap(colormap)
            colored_heatmap = np.uint8(255 * cmap(heatmap_resized)[:, :, :3])

            # Ensure original image is uint8
            if original_image.max() <= 1.0:
                original_image = np.uint8(255 * original_image)

            # Blend with original
            superimposed = colored_heatmap * alpha + original_image * (1 - alpha)
            superimposed = np.clip(superimposed, 0, 255).astype(np.uint8)

            # Convert to base64
            img_pil = Image.fromarray(superimposed)
            buffer = io.BytesIO()
            img_pil.save(buffer, format='PNG', optimize=True)
            buffer.seek(0)
            img_base64 = base64.b64encode(buffer.read()).decode('utf-8')

            return f"data:image/png;base64,{img_base64}"

        except Exception as e:
            logger.error(f"Grad-CAM generation failed: {e}")
            return None


# Singleton instance
gradcam = GradCAMGenerator()
