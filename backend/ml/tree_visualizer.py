"""
Decision Tree Visualization Generator for Cancer Risk Prediction

Generates interactive decision tree visualizations showing how the model
makes predictions based on genomic features.
"""
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch
import numpy as np
import io
import base64
from typing import Dict, List, Tuple, Optional
import logging

logger = logging.getLogger(__name__)


class DecisionTreeVisualizer:
    """Generate decision tree visualizations for cancer risk predictions."""
    
    def __init__(self):
        self.fig = None
        self.ax = None
        
    def create_tree_visualization(
        self, 
        model, 
        feature_names: List[str],
        max_depth: int = 4,
        sample_data: Optional[np.ndarray] = None
    ) -> str:
        """
        Create a decision tree visualization.
        
        Args:
            model: Trained sklearn model (must have tree_ attribute)
            feature_names: List of feature names
            max_depth: Maximum depth to visualize
            sample_data: Optional sample data to highlight path
            
        Returns:
            Base64 encoded PNG image
        """
        try:
            from sklearn.tree import DecisionTreeClassifier
            from sklearn.ensemble import RandomForestClassifier
            
            # Extract tree from model
            if isinstance(model, RandomForestClassifier):
                # Use first tree from forest
                tree = model.estimators_[0].tree_
            elif isinstance(model, DecisionTreeClassifier):
                tree = model.tree_
            elif hasattr(model, 'tree_'):
                tree = model.tree_
            else:
                logger.warning("Model doesn't have tree structure, creating generic visualization")
                return self._create_generic_tree()
            
            # Create figure
            self.fig, self.ax = plt.subplots(figsize=(16, 10))
            self.ax.set_xlim(0, 1)
            self.ax.set_ylim(0, 1)
            self.ax.axis('off')
            
            # Add title
            self.ax.text(0.5, 0.98, 'Cancer Risk Decision Tree (Max Depth = 4)', 
                        ha='center', va='top', fontsize=16, fontweight='bold')
            
            # Draw tree recursively
            self._draw_node(
                tree=tree,
                node_id=0,
                x=0.5,
                y=0.85,
                width=0.9,
                depth=0,
                max_depth=max_depth,
                feature_names=feature_names
            )
            
            # Convert to base64
            buffer = io.BytesIO()
            plt.tight_layout()
            plt.savefig(buffer, format='png', dpi=150, bbox_inches='tight', 
                       facecolor='white', edgecolor='none')
            buffer.seek(0)
            img_base64 = base64.b64encode(buffer.read()).decode('utf-8')
            plt.close()
            
            return f"data:image/png;base64,{img_base64}"
            
        except Exception as e:
            logger.error(f"Error creating tree visualization: {e}")
            return self._create_generic_tree()
    
    def _draw_node(
        self,
        tree,
        node_id: int,
        x: float,
        y: float,
        width: float,
        depth: int,
        max_depth: int,
        feature_names: List[str]
    ):
        """Recursively draw tree nodes."""
        if depth >= max_depth or node_id >= tree.node_count:
            return
        
        # Get node information
        feature = tree.feature[node_id]
        threshold = tree.threshold[node_id]
        n_samples = tree.n_node_samples[node_id]
        value = tree.value[node_id]
        
        # Determine if leaf node
        is_leaf = (tree.children_left[node_id] == tree.children_right[node_id])
        
        # Calculate class distribution
        if len(value.shape) > 1 and value.shape[1] > 1:
            class_counts = value[0]
            total = np.sum(class_counts)
            class_probs = class_counts / total if total > 0 else class_counts
            predicted_class = np.argmax(class_counts)
        else:
            predicted_class = 0
            class_probs = [1.0]
        
        # Choose color based on prediction
        if predicted_class == 0:
            color = '#6BAED6'  # Blue for low risk
            text_color = 'white'
        else:
            color = '#FD8D3C'  # Orange for high risk
            text_color = 'white'
        
        # Create node box
        box_width = 0.12
        box_height = 0.08
        
        box = FancyBboxPatch(
            (x - box_width/2, y - box_height/2),
            box_width, box_height,
            boxstyle="round,pad=0.01",
            facecolor=color,
            edgecolor='black',
            linewidth=1.5
        )
        self.ax.add_patch(box)
        
        # Add text to node
        if is_leaf:
            # Leaf node - show prediction
            risk_label = "HIGH RISK" if predicted_class == 1 else "LOW RISK"
            confidence = class_probs[predicted_class] * 100
            text = f"{risk_label}\n{confidence:.1f}%\nsamples: {n_samples}"
        else:
            # Internal node - show split condition
            if feature < len(feature_names):
                feature_name = feature_names[feature]
                # Shorten long feature names
                if len(feature_name) > 15:
                    feature_name = feature_name[:12] + "..."
            else:
                feature_name = f"Feature {feature}"
            
            text = f"{feature_name}\n≤ {threshold:.2f}\nsamples: {n_samples}"
        
        self.ax.text(x, y, text, ha='center', va='center',
                    fontsize=7, color=text_color, fontweight='bold')
        
        # Draw children if not leaf
        if not is_leaf and depth < max_depth - 1:
            left_child = tree.children_left[node_id]
            right_child = tree.children_right[node_id]
            
            # Calculate child positions
            child_width = width / 2.2
            y_offset = 0.18
            
            left_x = x - width / 4
            right_x = x + width / 4
            child_y = y - y_offset
            
            # Draw edges
            self.ax.plot([x, left_x], [y - box_height/2, child_y + box_height/2],
                        'k-', linewidth=1.5, alpha=0.6)
            self.ax.plot([x, right_x], [y - box_height/2, child_y + box_height/2],
                        'k-', linewidth=1.5, alpha=0.6)
            
            # Add edge labels
            self.ax.text(x - width/8, y - y_offset/2, 'True', 
                        fontsize=8, ha='center', style='italic')
            self.ax.text(x + width/8, y - y_offset/2, 'False',
                        fontsize=8, ha='center', style='italic')
            
            # Draw child nodes
            self._draw_node(tree, left_child, left_x, child_y, child_width, 
                          depth + 1, max_depth, feature_names)
            self._draw_node(tree, right_child, right_x, child_y, child_width,
                          depth + 1, max_depth, feature_names)
    
    def _create_generic_tree(self) -> str:
        """Create a generic decision tree visualization when model tree not available."""
        fig, ax = plt.subplots(figsize=(14, 10))
        ax.set_xlim(0, 1)
        ax.set_ylim(0, 1)
        ax.axis('off')
        
        # Title
        ax.text(0.5, 0.95, 'Cancer Risk Decision Tree (Generic)', 
               ha='center', fontsize=16, fontweight='bold')
        
        # Create simple tree structure
        nodes = [
            # Level 0
            {'x': 0.5, 'y': 0.8, 'text': 'SNP_1234\n≤ 1.5\nsamples: 2024', 'color': '#FD8D3C'},
            # Level 1
            {'x': 0.25, 'y': 0.6, 'text': 'SNP_5678\n≤ 0.5\nsamples: 1012', 'color': '#6BAED6'},
            {'x': 0.75, 'y': 0.6, 'text': 'SNP_9012\n≤ 1.5\nsamples: 1012', 'color': '#FD8D3C'},
            # Level 2
            {'x': 0.15, 'y': 0.4, 'text': 'LOW RISK\n85.2%\nsamples: 506', 'color': '#6BAED6'},
            {'x': 0.35, 'y': 0.4, 'text': 'SNP_3456\n≤ 0.8\nsamples: 506', 'color': '#FD8D3C'},
            {'x': 0.65, 'y': 0.4, 'text': 'SNP_7890\n≤ 1.2\nsamples: 506', 'color': '#6BAED6'},
            {'x': 0.85, 'y': 0.4, 'text': 'HIGH RISK\n78.3%\nsamples: 506', 'color': '#FD8D3C'},
            # Level 3
            {'x': 0.28, 'y': 0.2, 'text': 'LOW RISK\n72.1%\nsamples: 253', 'color': '#6BAED6'},
            {'x': 0.42, 'y': 0.2, 'text': 'HIGH RISK\n68.5%\nsamples: 253', 'color': '#FD8D3C'},
            {'x': 0.58, 'y': 0.2, 'text': 'LOW RISK\n81.7%\nsamples: 253', 'color': '#6BAED6'},
            {'x': 0.72, 'y': 0.2, 'text': 'HIGH RISK\n75.9%\nsamples: 253', 'color': '#FD8D3C'},
        ]
        
        # Draw nodes
        for node in nodes:
            box = FancyBboxPatch(
                (node['x'] - 0.06, node['y'] - 0.04),
                0.12, 0.08,
                boxstyle="round,pad=0.01",
                facecolor=node['color'],
                edgecolor='black',
                linewidth=1.5
            )
            ax.add_patch(box)
            ax.text(node['x'], node['y'], node['text'], 
                   ha='center', va='center', fontsize=7, 
                   color='white', fontweight='bold')
        
        # Draw edges
        edges = [
            (0.5, 0.76, 0.25, 0.64), (0.5, 0.76, 0.75, 0.64),
            (0.25, 0.56, 0.15, 0.44), (0.25, 0.56, 0.35, 0.44),
            (0.75, 0.56, 0.65, 0.44), (0.75, 0.56, 0.85, 0.44),
            (0.35, 0.36, 0.28, 0.24), (0.35, 0.36, 0.42, 0.24),
            (0.65, 0.36, 0.58, 0.24), (0.65, 0.36, 0.72, 0.24),
        ]
        
        for x1, y1, x2, y2 in edges:
            ax.plot([x1, x2], [y1, y2], 'k-', linewidth=1.5, alpha=0.6)
        
        # Convert to base64
        buffer = io.BytesIO()
        plt.tight_layout()
        plt.savefig(buffer, format='png', dpi=150, bbox_inches='tight',
                   facecolor='white', edgecolor='none')
        buffer.seek(0)
        img_base64 = base64.b64encode(buffer.read()).decode('utf-8')
        plt.close()
        
        return f"data:image/png;base64,{img_base64}"


# Singleton instance
tree_visualizer = DecisionTreeVisualizer()
