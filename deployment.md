# VitalScanAI Deployment Guide

## 1. System Requirements
- **OS**: Windows / Linux / macOS
- **Python**: 3.9+
- **Node.js**: 18+
- **GPU**: Recommended for X-ray Model inference (NVIDIA CUDA), but CPU is supported (slower).

## 2. Local Deployment (Development)

### A. Backend API
1. Navigate to the api directory:
   ```bash
   cd backend/api
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   **Swagger UI**: Access http://localhost:8000/docs to test endpoints.

### B. Frontend Application
1. Navigate to the root root:
   ```bash
   cd ../../
   ```
2. Install packages:
   ```bash
   npm install
   ```
3. Start Vite server:
   ```bash
   npm run dev
   ```
   Access http://localhost:5173

## 3. Production Deployment (Cloud)

### Docker Approach (Recommended)
Create a `Dockerfile` for the backend:

```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY ./backend/api /app/api
COPY ./backend/Models /app/Models
RUN pip install --no-cache-dir -r api/requirements.txt
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "80"]
```

### Platforms
- **Frontend**: Deploy `dist/` folder to **Vercel** or **Netlify**.
- **Backend API**: Deploy Docker container to **AWS ECS**, **Google Cloud Run**, or **Railway**.
- **Model Storage**: For large scale, store `.keras` models in AWS S3 and download on container startup.

## 4. Troubleshooting
- **Model Not Found**: Ensure `backend/Models/.../models_export/` contains the `.keras`/`.joblib` files. The API `ModelLoader` prints logs on startup indicating success/failure.
- **CORS/Network Error**: Verify `CORSMiddleware` in `main.py` includes your frontend domain.
