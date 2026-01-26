## Hyperparameter Tuning and Regularization to Reduce Overfitting

Add this code block after the overfitting check to improve your model:

```python
# ============================================================
# REDUCING OVERFITTING - HYPERPARAMETER TUNING
# ============================================================

from sklearn.model_selection import GridSearchCV
import warnings
warnings.filterwarnings('ignore')

print("=" * 60)
print("HYPERPARAMETER TUNING TO REDUCE OVERFITTING")
print("=" * 60)

# Define parameter grid for Decision Tree
param_grid = {
    'max_depth': [3, 5, 7, 10],
    'min_samples_split': [10, 20, 50, 100],
    'min_samples_leaf': [5, 10, 20, 50],
    'max_features': ['sqrt', 'log2', None]
}

# Perform Grid Search with Cross-Validation
print("\nPerforming Grid Search with 5-fold Cross-Validation...")
grid_search = GridSearchCV(
    DecisionTreeClassifier(random_state=42),
    param_grid,
    cv=5,
    scoring='accuracy',
    n_jobs=-1,
    verbose=1
)

grid_search.fit(X_train, y_train)

print(f"\n✓ Best Parameters Found:")
for param, value in grid_search.best_params_.items():
    print(f"  - {param}: {value}")

print(f"\n✓ Best Cross-Validation Score: {grid_search.best_score_:.4f}")

# Train new model with best parameters
clf_tuned = grid_search.best_estimator_

# Evaluate tuned model
y_pred_train_tuned = clf_tuned.predict(X_train)
y_pred_test_tuned = clf_tuned.predict(X_test)

train_acc_tuned = accuracy_score(y_train, y_pred_train_tuned)
test_acc_tuned = accuracy_score(y_test, y_pred_test_tuned)

print("\n" + "=" * 60)
print("TUNED MODEL PERFORMANCE")
print("=" * 60)
print(f"Training Accuracy: {train_acc_tuned:.4f} ({train_acc_tuned*100:.2f}%)")
print(f"Test Accuracy: {test_acc_tuned:.4f} ({test_acc_tuned*100:.2f}%)")
print(f"\nOverfitting check: {abs(train_acc_tuned - test_acc_tuned):.4f}")

if abs(train_acc_tuned - test_acc_tuned) < 0.05:
    print("✓ Model generalizes well (low overfitting)")
else:
    print("⚠ Still some overfitting detected")

# Compare with original model
print("\n" + "=" * 60)
print("COMPARISON: ORIGINAL vs TUNED MODEL")
print("=" * 60)
print(f"Original - Test Accuracy: {test_accuracy:.4f}, Overfitting: {abs(train_accuracy - test_accuracy):.4f}")
print(f"Tuned    - Test Accuracy: {test_acc_tuned:.4f}, Overfitting: {abs(train_acc_tuned - test_acc_tuned):.4f}")
print(f"\nImprovement in overfitting: {(abs(train_accuracy - test_accuracy) - abs(train_acc_tuned - test_acc_tuned)):.4f}")

# Save the tuned model
joblib.dump(clf_tuned, 'cancer_risk_model_tuned.joblib')
print("\n✓ Tuned model saved to cancer_risk_model_tuned.joblib")
```

This code block will:
1. **Grid Search** - Tests multiple hyperparameter combinations
2. **Cross-Validation** - Uses 5-fold CV to find the best parameters
3. **Key Parameters Tuned**:
   - `max_depth`: Limits tree depth (prevents overfitting)
   - `min_samples_split`: Minimum samples needed to split a node
   - `min_samples_leaf`: Minimum samples in each leaf
   - `max_features`: Number of features to consider for splitting
4. **Comparison** - Shows improvement over original model
5. **Saves** the tuned model for later use
