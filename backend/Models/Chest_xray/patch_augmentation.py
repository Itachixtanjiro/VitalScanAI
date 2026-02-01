import nbformat
import os

NOTEBOOK_PATH = r"d:/VitalScanAI/backend/Models/Chest_xray/Model.ipynb"

def patch_notebook():
    if not os.path.exists(NOTEBOOK_PATH):
        print(f"Error: Notebook not found at {NOTEBOOK_PATH}")
        return

    with open(NOTEBOOK_PATH, 'r', encoding='utf-8') as f:
        nb = nbformat.read(f, as_version=4)

    imports_updated = False
    generators_updated = False
    predict_updated = False

    for cell in nb.cells:
        if cell.cell_type == 'code':
            source = cell.source

            # 1. Update Imports
            if 'from tensorflow.keras.applications import VGG16, DenseNet121' in source:
                if 'preprocess_input' not in source:
                    print("Updating imports...")
                    # Add preprocess_input import
                    new_import = "from tensorflow.keras.applications.densenet import preprocess_input"
                    # Insert after existing imports
                    lines = source.split('\n')
                    # Find a good place to insert, e.g., after loading_img
                    insert_idx = -1
                    for i, line in enumerate(lines):
                        if 'from tensorflow.keras.preprocessing.image import' in line:
                            insert_idx = i + 1
                            break
                    
                    if insert_idx != -1:
                        lines.insert(insert_idx, new_import)
                        cell.source = '\n'.join(lines)
                        imports_updated = True
                    else:
                        # Fallback: append to end of imports
                        cell.source = source + "\n" + new_import
                        imports_updated = True
                else:
                    print("Imports already contain preprocess_input. Skipping.")
                    imports_updated = True

            # 2. Update Generators
            if "train_datagen = ImageDataGenerator(" in source and "rescale=1./255" in source:
                print("Updating ImageDataGenerator...")
                new_source = """# Generators
if 'train_df' in locals():
    # Enhanced Data Augmentation for Grad-CAM Improvement
    train_datagen = ImageDataGenerator(
        preprocessing_function=preprocess_input, # Correct for DenseNet (ImageNet)
        rotation_range=20,     # Increased from 15
        width_shift_range=0.1, # New
        height_shift_range=0.1,# New
        shear_range=0.1,       # New
        zoom_range=0.1,
        horizontal_flip=True,
        brightness_range=[0.8, 1.2], # New: Robustness to exposure
        fill_mode='nearest'
    )
    # Validation/Test should only have preprocessing
    val_datagen = ImageDataGenerator(preprocessing_function=preprocess_input)

    common_args = {
        'x_col': 'path',
        'y_col': 'labels',
        'target_size': IMG_SIZE,
        'batch_size': BATCH_SIZE,
        'class_mode': 'categorical',
        'classes': list(classes)
    }

    train_gen = train_datagen.flow_from_dataframe(dataframe=train_df, **common_args, shuffle=True)
    val_gen = val_datagen.flow_from_dataframe(dataframe=val_df, **common_args, shuffle=False)
    test_gen = val_datagen.flow_from_dataframe(dataframe=test_df, **common_args, shuffle=False)"""
                cell.source = new_source
                generators_updated = True

            # 3. Update predict_json
            if "def predict_json" in source and "/ 255.0" in source:
                print("Updating predict_json...")
                new_source = """def predict_json(img_path, inference_model, gradcam_model, classes):
    img = load_img(img_path, target_size=IMG_SIZE)
    img_arr = img_to_array(img)
    # Preprocessing: Use the same function as training (no manual /255.0)
    img_arr = np.expand_dims(img_arr, axis=0)
    img_arr = preprocess_input(img_arr)
    
    # Inference
    probs = inference_model.predict(img_arr)[0]
    
    # Top 3
    top_indices = probs.argsort()[-3:][::-1]
    findings = [
        {"label": classes[i], "confidence": float(probs[i])} 
        for i in top_indices
    ]
    
    # Grad-CAM 
    heatmap = compute_gradcam(gradcam_model, img_arr, 'conv5_block16_concat')
    
    return {
        "image": img_path,
        "findings": findings,
        "gradcam": heatmap
    }

# --- Batch Test (10 Samples) ---
if 'test_df' in locals() and len(test_df) > 0:
    num_samples = 10
    print(f"\\nrunning Evaluation on first {num_samples} test samples...\\n")
    
    for i in range(num_samples):
        row = test_df.iloc[i]
        sample_path = row['path']
        true_labels = row['labels']
        filename = os.path.basename(sample_path)
        
        result = predict_json(sample_path, hybrid_model, densenet_model, classes)
        
        # Text Output
        print(f"--- Sample {i+1}/{num_samples} ---")
        print(f"File: {filename}")
        print(f"Ground Truth: {true_labels}")
        print("Predictions:")
        print(json.dumps(result['findings'], indent=2))
        
        # Visualization
        plt.figure(figsize=(12, 5))
        
        # Original
        img = load_img(result['image'], target_size=IMG_SIZE)
        plt.subplot(1, 2, 1)
        plt.imshow(img)
        plt.title(f"Original | Truth: {true_labels}")
        plt.axis('off')
        
        # Grad-CAM
        plt.subplot(1, 2, 2)
        plt.imshow(img)
        plt.imshow(result['gradcam'], cmap='jet', alpha=0.5)
        plt.title(f"Grad-CAM | Top: {result['findings'][0]['label']} ({result['findings'][0]['confidence']:.2f})")
        plt.axis('off')
        plt.show()
        print("-" * 50)"""
                # Note: I am replacing the whole cell including the loop which was part of the same cell in the viewed file
                # But wait, in view_file (line 599 and 623), they seem to be in the SAME cell block?
                # Looking at view_file, cell starts at line 558. The source is a list of strings.
                # Lines 563-661 are in the 'source' list of that cell.
                # Ah, 'compute_gradcam' is also in that cell.
                # My 'predict_json' update above replaces 'predict_json' AND the batch loop.
                # BUT 'compute_gradcam' is ABOVE 'predict_json' in the SAME cell.
                # If I replace the whole cell source with my string, I will delete 'compute_gradcam'!
                # I need to be careful.
                # The 'generators' cell was isolated (lines 300-324).
                # The 'predict_json' cell (lines 558-661) includes `compute_gradcam`.
                # I should only replace the `predict_json` function definition and below.
                
                # Let's fix the logic for 'predict_json' update.
                print("  Refining predict_json replacement to preserve compute_gradcam...")
                parts = source.split("def predict_json")
                if len(parts) > 1:
                    pre_content = parts[0] # Includes compute_gradcam
                    # Reconstruct
                    new_full_source = pre_content + new_source
                    cell.source = new_full_source
                    predict_updated = True
                else:
                     print("  Could not split by 'def predict_json'. Skipping.")

    if imports_updated and generators_updated and predict_updated:
        with open(NOTEBOOK_PATH, 'w', encoding='utf-8') as f:
            nbformat.write(nb, f)
        print("Successfully patched Model.ipynb")
    else:
        print(f"Patch incomplete: Imports={imports_updated}, Generators={generators_updated}, Predict={predict_updated}")

if __name__ == "__main__":
    patch_notebook()
