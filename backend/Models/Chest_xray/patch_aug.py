
import sys
import subprocess
import importlib.util

def install(package):
    subprocess.check_call([sys.executable, "-m", "pip", "install", package])

# Check for nbformat
if importlib.util.find_spec("nbformat") is None:
    print("Installing nbformat...", flush=True)
    install("nbformat")

import nbformat

nb_path = r'd:/VitalScanAI/backend/Models/Chest_xray/Model.ipynb'

try:
    print(f"Reading {nb_path}...", flush=True)
    with open(nb_path, 'r', encoding='utf-8') as f:
        nb = nbformat.read(f, as_version=4)

    # Find the cell with ImageDataGenerator
    found = False
    for cell in nb.cells:
        if cell.cell_type == 'code' and 'ImageDataGenerator' in cell.source and 'rescale=1./255' in cell.source:
            print("Found ImageDataGenerator cell. Updating...", flush=True)
            
            # New Content with Preprocessing and Augmentation
            new_source = """# Generators
# ENHANCED PIPELINE: Using DenseNet specific preprocessing and stronger augmentation
from tensorflow.keras.applications.densenet import preprocess_input

if 'train_df' in locals():
    # Note: When using preprocess_input, we DO NOT use rescale=1./255
    # preprocess_input handles the scaling (usually -1 to 1 or 0 to 1 depending on model)
    train_datagen = ImageDataGenerator(
        preprocessing_function=preprocess_input,
        rotation_range=20,         # Increased from 15
        width_shift_range=0.1,     # New: Horizontal shift
        height_shift_range=0.1,    # New: Vertical shift
        shear_range=0.1,           # New: Shear
        zoom_range=0.1,
        brightness_range=[0.8, 1.2], # New: Lighting variation
        horizontal_flip=True,
        fill_mode='nearest'
    )
    
    # Validation/Test should typically just utilize the preprocessing function
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
    # Test gen usage for metrics
    test_gen = val_datagen.flow_from_dataframe(dataframe=test_df, **common_args, shuffle=False)
"""
            cell.source = new_source
            found = True
            break
    
    if found:
        with open(nb_path, 'w', encoding='utf-8') as f:
            nbformat.write(nb, f)
        print("Successfully updated ImageDataGenerator settings.", flush=True)
    else:
        print("Could not find the specific ImageDataGenerator cell to patch. It might have been already updated.", flush=True)

except Exception as e:
    print(f"Error patching notebook: {e}", flush=True)
