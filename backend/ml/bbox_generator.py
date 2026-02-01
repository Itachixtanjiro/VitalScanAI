"""
Simple bounding box generator for chest X-ray predictions.

Maps predicted conditions to anatomical regions using normalized coordinates (0-1).
Much simpler and faster than Grad-CAM, with clearer clinical visualization.
"""
import logging
from typing import List, Dict, Optional

logger = logging.getLogger(__name__)

# Anatomical region mapping for chest X-ray conditions
# Coordinates are normalized (0-1): {x, y, width, height}
# x, y = top-left corner, width/height = box dimensions
CONDITION_REGIONS = {
    # Cardiac conditions - center chest
    'Cardiomegaly': {'x': 0.35, 'y': 0.35, 'width': 0.30, 'height': 0.40, 'color': '#FF6B6B'},
    
    # Lung field conditions - bilateral
    'Pneumonia': [
        {'x': 0.15, 'y': 0.50, 'width': 0.30, 'height': 0.35, 'color': '#4ECDC4'},  # Left lower
        {'x': 0.55, 'y': 0.50, 'width': 0.30, 'height': 0.35, 'color': '#4ECDC4'},  # Right lower
    ],
    
    # Pleural conditions - lateral
    'Pneumothorax': [
        {'x': 0.05, 'y': 0.20, 'width': 0.15, 'height': 0.50, 'color': '#FFE66D'},  # Left edge
        {'x': 0.80, 'y': 0.20, 'width': 0.15, 'height': 0.50, 'color': '#FFE66D'},  # Right edge
    ],
    
    # Effusion - costophrenic angles (lower corners)
    'Effusion': [
        {'x': 0.10, 'y': 0.70, 'width': 0.25, 'height': 0.25, 'color': '#95E1D3'},  # Left
        {'x': 0.65, 'y': 0.70, 'width': 0.25, 'height': 0.25, 'color': '#95E1D3'},  # Right
    ],
    
    # Consolidation - lung fields
    'Consolidation': [
        {'x': 0.20, 'y': 0.40, 'width': 0.25, 'height': 0.30, 'color': '#A8E6CF'},  # Left
        {'x': 0.55, 'y': 0.40, 'width': 0.25, 'height': 0.30, 'color': '#A8E6CF'},  # Right
    ],
    
    # Edema - perihilar (central)
    'Edema': {'x': 0.30, 'y': 0.30, 'width': 0.40, 'height': 0.45, 'color': '#FFB6D9'},
    
    # Atelectasis - variable, show bilateral
    'Atelectasis': [
        {'x': 0.15, 'y': 0.35, 'width': 0.30, 'height': 0.40, 'color': '#DDA15E'},  # Left
        {'x': 0.55, 'y': 0.35, 'width': 0.30, 'height': 0.40, 'color': '#DDA15E'},  # Right
    ],
    
    # Mass/Nodule - central lung fields
    'Mass': {'x': 0.30, 'y': 0.35, 'width': 0.40, 'height': 0.35, 'color': '#F4A261'},
    'Nodule': {'x': 0.35, 'y': 0.40, 'width': 0.30, 'height': 0.25, 'color': '#E76F51'},
    
    # Infiltration - scattered, show multiple areas
    'Infiltration': [
        {'x': 0.20, 'y': 0.30, 'width': 0.20, 'height': 0.25, 'color': '#B4A7D6'},  # Upper left
        {'x': 0.60, 'y': 0.30, 'width': 0.20, 'height': 0.25, 'color': '#B4A7D6'},  # Upper right
        {'x': 0.25, 'y': 0.60, 'width': 0.20, 'height': 0.25, 'color': '#B4A7D6'},  # Lower left
        {'x': 0.55, 'y': 0.60, 'width': 0.20, 'height': 0.25, 'color': '#B4A7D6'},  # Lower right
    ],
    
    # Other conditions
    'Emphysema': {'x': 0.20, 'y': 0.25, 'width': 0.60, 'height': 0.50, 'color': '#CDB4DB'},
    'Fibrosis': {'x': 0.25, 'y': 0.40, 'width': 0.50, 'height': 0.40, 'color': '#FFC8DD'},
    'Pleural_Thickening': [
        {'x': 0.05, 'y': 0.25, 'width': 0.10, 'height': 0.50, 'color': '#FFAFCC'},  # Left
        {'x': 0.85, 'y': 0.25, 'width': 0.10, 'height': 0.50, 'color': '#FFAFCC'},  # Right
    ],
    'Hernia': {'x': 0.30, 'y': 0.75, 'width': 0.40, 'height': 0.20, 'color': '#BDE0FE'},
}


def generate_bounding_boxes(
    predictions: List[Dict],
    confidence_threshold: float = 0.3,
    max_boxes: int = 5
) -> List[Dict]:
    """
    Generate bounding boxes for predicted conditions.
    
    Args:
        predictions: List of predictions with 'condition' and 'probability'
        confidence_threshold: Minimum confidence to show box (default: 0.3)
        max_boxes: Maximum number of boxes to return (default: 5)
        
    Returns:
        List of bounding box dicts with condition, confidence, and box coordinates
    """
    bounding_boxes = []
    
    # Filter predictions by confidence and exclude "No Finding"
    significant_predictions = [
        p for p in predictions
        if p['probability'] >= confidence_threshold and p['condition'] != 'No Finding'
    ]
    
    # Sort by confidence (highest first)
    significant_predictions.sort(key=lambda x: x['probability'], reverse=True)
    
    # Generate boxes for top predictions
    for pred in significant_predictions[:max_boxes]:
        condition = pred['condition']
        regions = CONDITION_REGIONS.get(condition)
        
        if regions:
            # Handle both single region and multiple regions
            if isinstance(regions, list):
                # Multiple regions (e.g., bilateral findings)
                for i, region in enumerate(regions):
                    bounding_boxes.append({
                        'condition': condition,
                        'confidence': round(pred['probability'], 3),
                        'label': f"{condition} ({pred['probability']*100:.1f}%)",
                        'box': {
                            'x': region['x'],
                            'y': region['y'],
                            'width': region['width'],
                            'height': region['height']
                        },
                        'color': region.get('color', '#FF6B6B')
                    })
            else:
                # Single region
                bounding_boxes.append({
                    'condition': condition,
                    'confidence': round(pred['probability'], 3),
                    'label': f"{condition} ({pred['probability']*100:.1f}%)",
                    'box': {
                        'x': regions['x'],
                        'y': regions['y'],
                        'width': regions['width'],
                        'height': regions['height']
                    },
                    'color': regions.get('color', '#FF6B6B')
                })
    
    logger.info(f"Generated {len(bounding_boxes)} bounding boxes from {len(significant_predictions)} predictions")
    return bounding_boxes


def format_for_frontend(bounding_boxes: List[Dict]) -> List[Dict]:
    """
    Format bounding boxes for frontend consumption.
    Ensures all coordinates are valid (0-1 range).
    """
    formatted = []
    for bbox in bounding_boxes:
        # Validate coordinates
        box = bbox['box']
        if all(0 <= box[k] <= 1 for k in ['x', 'y', 'width', 'height']):
            formatted.append(bbox)
        else:
            logger.warning(f"Invalid bounding box coordinates for {bbox['condition']}: {box}")
    
    return formatted
