## Simple Solution to Reduce Overfitting (Low Disk Space)

**Use this code instead - it doesn't require parallel processing:**

```python
# ============================================================
# REDUCING OVERFITTING - SIMPLE APPROACH (LOW DISK SPACE)
# ============================================================

print("=" * 60)
print("REDUCING OVERFITTING - REGULARIZATION")
print("=" * 60)

# Test different max_depth values manually
depths = [3, 5, 7, 10]
best_score = 0
best_depth = None
best_model = None

print("\nTesting different tree depths...")
for depth in depths:
    # Create model with regularization
    clf_test = DecisionTreeClassifier(
        max_depth=depth,
        min_samples_split=20,
        min_samples_leaf=10,
        random_state=42
    )
    
    # Cross-validation score
    cv_scores = cross_val_score(clf_test, X_train, y_train, cv=5, scoring='accuracy')
    mean_score = cv_scores.mean()
    
    print(f"  max_depth={depth}: CV Score = {mean_score:.4f}")
    
    if mean_score > best_score:
        best_score = mean_score
        best_depth = depth
        best_model = clf_test

print(f"\n✓ Best max_depth: {best_depth}")
print(f"✓ Best CV Score: {best_score:.4f}")

# Train best model
best_model.fit(X_train, y_train)

# Evaluate
y_pred_train_tuned = best_model.predict(X_train)
y_pred_test_tuned = best_model.predict(X_test)

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
    print("⚠ Overfitting reduced but still present")

# Compare with original
print("\n" + "=" * 60)
print("IMPROVEMENT")
print("=" * 60)
print(f"Original Overfitting: {abs(train_accuracy - test_accuracy):.4f}")
print(f"New Overfitting:      {abs(train_acc_tuned - test_acc_tuned):.4f}")
print(f"Improvement:          {(abs(train_accuracy - test_accuracy) - abs(train_acc_tuned - test_acc_tuned)):.4f}")

# Save tuned model
joblib.dump(best_model, 'cancer_risk_model_tuned.joblib')
print("\n✓ Tuned model saved!")
```

**Key Changes:**
- ✅ No parallel processing (saves disk space)
- ✅ Manual loop instead of GridSearchCV  
- ✅ Tests only 4 depth values
- ✅ Uses regularization parameters:
  - `min_samples_split=20` (prevents tiny splits)
  - `min_samples_leaf=10` (ensures larger leaves)
- ✅ Much faster and lighter on resources

This should work without disk space issues!
