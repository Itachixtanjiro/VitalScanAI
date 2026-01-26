# VitalScan AI - Quick Start Guide

## 🚀 Start Backend Server

### **Simple One-Command Start**
```bash
cd D:\VitalScanAI\backend
python -m uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

### **Alternative Method (if above fails)**
```bash
cd D:\VitalScanAI\backend
python app.py
```

## 🔍 Run Diagnostics (if server won't start)

```bash
cd D:\VitalScanAI\backend
python diagnostic_test.py
```

This will test:
- ✅ All Python imports
- ✅ API routes
- ✅ LLM clients
- ✅ Model files
- ✅ Configuration

## 📊 Verify Server is Running

Open browser:
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

## ⚠️ Common Issues

### Issue: "No module named 'fastapi'"
**Fix**:
```bash
pip install -r requirements.txt
```

### Issue: "No module named 'api'"
**Fix**: Make sure you're in the `backend` directory

### Issue: Port already in use
**Fix**: Use different port:
```bash
uvicorn app:app --port 8001 --reload
```

### Issue: Model loading errors
**Fix**: Check that `backend/Models/` has `.h5` files

## 🎯 Expected Console Output

```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Started reloader process
INFO:     Application startup complete.
```

---

**Need Help?** Run: `python diagnostic_test.py`
