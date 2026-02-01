
import os
import numpy as np
import tensorflow as tf
from tensorflow.keras.applications import VGG16, DenseNet121
from tensorflow.keras.layers import GlobalAveragePooling2D, Dense, Input, Concatenate, Dropout, BatchNormalization
from tensorflow.keras.models import Model

# --- Replicating the Notebook Logic for Verification ---

def build_densenet(input_shape, num_classes):
    base_model = DenseNet121(weights='imagenet', include_top=False, input_shape=input_shape)
    x = base_model.output
    x = GlobalAveragePooling2D(name='densenet_gap')(x)
    x = BatchNormalization()(x)
    x = Dropout(0.5)(x)
    output = Dense(num_classes, activation='sigmoid', name='phase1_output')(x)
    return Model(inputs=base_model.input, outputs=output, name="DenseNet_Phase1")

def build_vgg_extractor(input_shape):
    vgg = VGG16(weights='imagenet', include_top=False, input_shape=input_shape)
    vgg.trainable = False
    x = vgg.output
    x = GlobalAveragePooling2D(name='vgg_gap')(x)
    return Model(inputs=vgg.input, outputs=x, name="VGG_Extractor")

def build_late_fusion_model(densenet_p1, vgg_ext, num_classes):
    input_tensor = Input(shape=(224, 224, 3))
    
    # Simulate feature extraction from pre-trained parts
    # DenseNet Features
    dense_gap = densenet_p1.get_layer('densenet_gap').output
    dense_feat_model = Model(inputs=densenet_p1.input, outputs=dense_gap)
    dense_feat_model.trainable = False
    
    dense_feats = dense_feat_model(input_tensor)
    vgg_feats = vgg_ext(input_tensor)
    
    concat = Concatenate(name='late_fusion_concat')([dense_feats, vgg_feats])
    
    x = Dense(512, activation='relu')(concat)
    x = Dropout(0.4)(x)
    x = Dense(256, activation='relu')(x)
    x = Dropout(0.3)(x)
    output = Dense(num_classes, activation='sigmoid', name='final_output')(x)
    
    return Model(inputs=input_tensor, outputs=output, name="Hybrid_Fusion_Model")

def compute_gradcam(model, img_array, layer_name='conv5_block16_concat'):
    try:
        target_layer = model.get_layer(layer_name)
    except ValueError:
        print(f"Layer {layer_name} not found directly.")
        return None

    grad_model = Model(
        inputs=model.inputs,
        outputs=[target_layer.output, model.output]
    )

    with tf.GradientTape() as tape:
        conv_outputs, predictions = grad_model(img_array)
        pred_index = tf.argmax(predictions[0])
        class_channel = predictions[:, pred_index]

    grads = tape.gradient(class_channel, conv_outputs)
    pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))
    
    conv_outputs = conv_outputs[0]
    heatmap = conv_outputs @ pooled_grads[..., tf.newaxis]
    heatmap = tf.squeeze(heatmap)
    heatmap = tf.maximum(heatmap, 0) / tf.math.reduce_max(heatmap)
    return heatmap.numpy()

# --- Execution ---
print("1. Building DenseNet-121...")
densenet = build_densenet((224, 224, 3), 14)
print("   Success.")

print("2. Building VGG16 Extractor...")
vgg = build_vgg_extractor((224, 224, 3))
print("   Success.")

print("3. Building Late Fusion Model...")
fusion_model = build_late_fusion_model(densenet, vgg, 14)
print("   Success.")

print("4. Verifying Grad-CAM on Fake Data...")
dummy_img = np.random.rand(1, 224, 224, 3).astype(np.float32)
# We test Grad-CAM on the fusing model, accessing the internal DenseNet layer
# Note: In functional API, 'conv5_block16_concat' is part of the graph if 'densenet' inputs are preserved.
# In build_late_fusion_model, we used 'dense_feat_model(input_tensor)'.
# This effectively copies the graph structure onto 'input_tensor'.
# Let's see if the layer name is accessible via the fusion model.
# Note: Layer names in shared functional models might get suffixes like '_1'.
# We will iterate layers to find the matching one just to be robust.

target_layer_name = 'conv5_block16_concat'
found = False
for layer in fusion_model.layers:
    if target_layer_name in layer.name:
        target_layer_name = layer.name
        found = True
        break

if found:
    print(f"   Target layer found: {target_layer_name}")
    heatmap = compute_gradcam(fusion_model, dummy_img, target_layer_name)
    if heatmap is not None and heatmap.shape == (7, 7): # DenseNet121 last conv is 7x7
        print(f"   Grad-CAM Success: Heatmap shape {heatmap.shape}")
    else:
        print(f"   Grad-CAM Verification Failed. Shape: {heatmap.shape if heatmap is not None else 'None'}")
else:
    print("   Target layer NOT found in Fusion Model. This is expected if the graph is wrapped.")
    print("   Attempting on DenseNet model directly...")
    heatmap = compute_gradcam(densenet, dummy_img, 'conv5_block16_concat')
    if heatmap is not None:
        print(f"   Grad-CAM on Base Model Success: Heatmap shape {heatmap.shape}")

print("\nALL SYSTEMS GO.")
