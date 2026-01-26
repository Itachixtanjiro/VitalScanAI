import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.metrics import accuracy_score
import joblib

# Configuration
DATASET_PATH = "diabetes.csv"

def verify_model():
    print("1. Loading Data...")
    if not os.path.exists(DATASET_PATH):
        print("Error: diabetes.csv not found")
        return

    df = pd.read_csv(DATASET_PATH)
    print(f"   Shape: {df.shape}")

    print("2. Cleaning Data...")
    zero_columns = ['Glucose', 'BloodPressure', 'SkinThickness', 'Insulin', 'BMI']
    df[zero_columns] = df[zero_columns].replace(0, np.nan)
    imputer = SimpleImputer(strategy='median')
    df[zero_columns] = imputer.fit_transform(df[zero_columns])
    print("   Zeros imputed.")

    print("3. Preprocessing...")
    X = df.drop("Outcome", axis=1)
    y = df["Outcome"]
    
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=0.2, random_state=42, stratify=y)
    
    print("4. Training Random Forest (Fast Check)...")
    clf = RandomForestClassifier(n_estimators=50, random_state=42)
    clf.fit(X_train, y_train)
    
    print("5. Evaluation...")
    y_pred = clf.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"   Test Accuracy: {acc:.4f}")
    
    print("6. Saving Artifacts...")
    joblib.dump(clf, "diabetic_risk_model_test.joblib")
    joblib.dump(scaler, "diabetic_risk_scaler_test.joblib")
    print("   Saved test models.")

import os
if __name__ == "__main__":
    verify_model()
