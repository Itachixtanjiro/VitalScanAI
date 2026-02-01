import json
import os
import sys

print("Starting batch test patch...", flush=True)

nb_path = r"d:/VitalScanAI/backend/Models/Chest_xray/Model.ipynb"

if not os.path.exists(nb_path):
    print(f"Error: {nb_path} does not exist.", flush=True)
    sys.exit(1)

try:
    with open(nb_path, 'r', encoding='utf-8') as f:
        nb = json.load(f)
    print("Notebook loaded.", flush=True)
except Exception as e:
    print(f"Error reading notebook: {e}", flush=True)
    sys.exit(1)

# Find the cell with predict_json
target_source_snippet = "def predict_json"
target_cell = None

for cell in nb['cells']:
    if cell['cell_type'] == 'code':
        source_str = "".join(cell['source'])
        if target_source_snippet in source_str:
            target_cell = cell
            break

if target_cell:
    print("Target cell found. Updating content...", flush=True)
    # 1. Keep the function definitions (compute_gradcam, predict_json)
    # 2. Update the TEST block to loop 10 times
    new_source = [
        "def compute_gradcam(model, img_array, layer_name='conv5_block16_concat'):\n",
        "    \"\"\"\n",
        "    Generates Grad-CAM heatmap for the top predicted class.\n",
        "    Finds the target layer within the nested DenseNet structure.\n",
        "    \"\"\"\n",
        "    # 1. Find the inner DenseNet model if nested\n",
        "    try:\n",
        "        target_layer = model.get_layer(layer_name)\n",
        "    except ValueError:\n",
        "        print(f\"Layer {layer_name} not found in top model. Using standalone DenseNet logic.\")\n",
        "        return np.zeros((224,224))\n",
        "\n",
        "    grad_model = Model(\n",
        "        inputs=model.inputs,\n",
        "        outputs=[target_layer.output, model.output]\n",
        "    )\n",
        "\n",
        "    with tf.GradientTape() as tape:\n",
        "        conv_outputs, predictions = grad_model(img_array)\n",
        "        pred_index = tf.argmax(predictions[0])\n",
        "        class_channel = predictions[:, pred_index]\n",
        "\n",
        "    grads = tape.gradient(class_channel, conv_outputs)\n",
        "    pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))\n",
        "    \n",
        "    conv_outputs = conv_outputs[0]\n",
        "    heatmap = conv_outputs @ pooled_grads[..., tf.newaxis]\n",
        "    heatmap = tf.squeeze(heatmap)\n",
        "    heatmap = tf.maximum(heatmap, 0) / tf.math.reduce_max(heatmap)\n",
        "    \n",
        "    # Resize to match input image dimensions (224, 224)\n",
        "    heatmap = tf.expand_dims(heatmap, axis=-1)\n",
        "    heatmap = tf.image.resize(heatmap, (224, 224))\n",
        "    heatmap = tf.squeeze(heatmap)\n",
        "    return heatmap.numpy()\n",
        "\n",
        "def predict_json(img_path, inference_model, gradcam_model, classes):\n",
        "    img = load_img(img_path, target_size=IMG_SIZE)\n",
        "    img_arr = img_to_array(img)\n",
        "    img_arr = np.expand_dims(img_arr, axis=0) / 255.0\n",
        "    \n",
        "    # Inference\n",
        "    probs = inference_model.predict(img_arr)[0]\n",
        "    \n",
        "    # Top 3\n",
        "    top_indices = probs.argsort()[-3:][::-1]\n",
        "    findings = [\n",
        "        {\"label\": classes[i], \"confidence\": float(probs[i])} \n",
        "        for i in top_indices\n",
        "    ]\n",
        "    \n",
        "    # Grad-CAM \n",
        "    heatmap = compute_gradcam(gradcam_model, img_arr, 'conv5_block16_concat')\n",
        "    \n",
        "    return {\n",
        "        \"image\": img_path,\n",
        "        \"findings\": findings,\n",
        "        \"gradcam\": heatmap\n",
        "    }\n",
        "\n",
        "# --- Batch Test (10 Samples) ---\n",
        "if 'test_df' in locals() and len(test_df) > 0:\n",
        "    num_samples = 10\n",
        "    print(f\"\\nrunning Evaluation on first {num_samples} test samples...\\n\")\n",
        "    \n",
        "    for i in range(num_samples):\n",
        "        row = test_df.iloc[i]\n",
        "        sample_path = row['path']\n",
        "        true_labels = row['labels']\n",
        "        filename = os.path.basename(sample_path)\n",
        "        \n",
        "        result = predict_json(sample_path, hybrid_model, densenet_model, classes)\n",
        "        \n",
        "        # Text Output\n",
        "        print(f\"--- Sample {i+1}/{num_samples} ---\")\n",
        "        print(f\"File: {filename}\")\n",
        "        print(f\"Ground Truth: {true_labels}\")\n",
        "        print(\"Predictions:\")\n",
        "        print(json.dumps(result['findings'], indent=2))\n",
        "        \n",
        "        # Visualization\n",
        "        plt.figure(figsize=(12, 5))\n",
        "        \n",
        "        # Original\n",
        "        img = load_img(result['image'], target_size=IMG_SIZE)\n",
        "        plt.subplot(1, 2, 1)\n",
        "        plt.imshow(img)\n",
        "        plt.title(f\"Original | Truth: {true_labels}\")\n",
        "        plt.axis('off')\n",
        "        \n",
        "        # Grad-CAM\n",
        "        plt.subplot(1, 2, 2)\n",
        "        plt.imshow(img)\n",
        "        plt.imshow(result['gradcam'], cmap='jet', alpha=0.5)\n",
        "        plt.title(f\"Grad-CAM | Top: {result['findings'][0]['label']} ({result['findings'][0]['confidence']:.2f})\")\n",
        "        plt.axis('off')\n",
        "        plt.show()\n",
        "        print(\"-\"*50)\n"
    ]
    target_cell['source'] = new_source
    
    try:
        with open(nb_path, 'w', encoding='utf-8') as f:
            json.dump(nb, f, indent=1)
        print("Notebook updated successfully.", flush=True)
    except Exception as e:
        print(f"Error writing notebook: {e}", flush=True)

else:
    print("Target cell not found.", flush=True)
