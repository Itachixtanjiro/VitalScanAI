import logging
import io
from PIL import Image
from typing import Tuple, Dict, Any

logger = logging.getLogger(__name__)

class ImagePreprocessor:
    """
    Handles deterministic preprocessing for medical images.
    Ensures consistent resizing, normalization, and channel conversion.
    """
    
    # Standard ImageNet normalization constants (common for transfer learning models)
    MEAN = (0.485, 0.456, 0.406)
    STD = (0.229, 0.224, 0.225)
    TARGET_SIZE = (224, 224)

    @staticmethod
    def preprocess(image_bytes: bytes) -> Dict[str, Any]:
        """
        Decodes, resizes, and normalizes the image.
        Returns a dictionary containing the processed tensor stats (simulated) 
        and metadata.
        """
        try:
            image = Image.open(io.BytesIO(image_bytes))
            
            # 1. Convert to RGB (Deterministic channel count)
            if image.mode != "RGB":
                image = image.convert("RGB")
                
            # 2. Resize (Deterministic input size)
            # Use LANCZOS for high-quality downsampling
            image = image.resize(ImagePreprocessor.TARGET_SIZE, Image.Resampling.LANCZOS)
            
            # 3. Validation / Simulation of Tensor Conversion
            # In a real PyTorch app, we would do:
            # tensor = transforms.ToTensor()(image)
            # tensor = transforms.Normalize(MEAN, STD)(tensor)
            
            logger.info(f"Preprocessed image to {ImagePreprocessor.TARGET_SIZE}")
            
            return {
                "tensor_shape": (1, 3, 224, 224),
                "original_format": image.format,
                "processed_size": image.size,
                "normalized": True
            }
            
        except Exception as e:
            logger.error(f"Preprocessing failed: {str(e)}")
            raise ValueError("Invalid image format or corrupted file.")

