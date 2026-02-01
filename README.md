<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# VitalScanAI

**Research Prototype - NOT FOR CLINICAL USE**

VitalScanAI is a multi-modal clinical synthesis and decision support system designed to assist researchers in analyzing complex medical data. It integrates X-Ray imaging, genomic risk assessment, and clinical notes analysis into a unified interface, empowered by advanced AI models.

## Features

- **Multi-Modal Analysis**: Seamlessly synthesizes data from Chest X-Rays, genomic profiles, and clinical notes.
- **Advanced X-Ray Diagnostics**:
    - Powered by a **DenseNet121** architecture.
    - Includes **Grad-CAM** visualization for explainable AI (XAI), highlighting regions of interest in X-Rays.
- **Risk Prediction Models**:
    - **Cervical Cancer Risk**: Assessment based on patient history and demographics.
    - **Diabetes Risk**: Predictive modeling for early detection.
- **AI-Powered Insights (LLM)**:
    - Integrated with **Google Gemini** and **Mistral AI** for high-level clinical reasoning and synthesis.
    - **RAG (Retrieval-Augmented Generation)** pipeline for grounding insights in medical literature.
- **Secure & Private**: Designed with de-identified processing in mind. Data is processed locally or in secure containers.
- **Interactive Dashboard**: Modern, responsive UI built with React for visualizing risk factors, trends, and imaging data.

## Tech Stack

### Frontend
- **Framework**: [React](https://react.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Visualization**: [Recharts](https://recharts.org/), [Lucide React](https://lucide.dev/) (Icons)
- **Language**: TypeScript

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/)
- **Language**: Python 3.9+
- **ML/DL**: TensorFlow/Keras, PyTorch, Scikit-learn
- **LLM Integration**: LangChain, Google GenAI SDK, Mistral Client
- **Database**: SQLite (Local storage for research sessions)

## Project Structure

```
VitalScanAI/
├── backend/                # FastAPI Backend & ML Models
│   ├── api/                # API Routers (Endpoints)
│   ├── Models/             # ML Models (Weights, Training Notebooks)
│   │   ├── Chest_xray/     # X-Ray Model & Data
│   │   ├── Cancer_risk/    # Cancer Risk Model
│   │   └── ...
│   ├── llm/                # LLM Clients (Gemini, Mistral)
│   ├── ml/                 # ML Utilities (Grad-CAM, Visualizers)
│   ├── app.py              # Main Application Entry Point
│   └── requirements.txt    # Backend Dependencies
├── components/             # React Components (UI Building Blocks)
├── pages/                  # Main Page Layouts (Dashboard, etc.)
├── services/               # API Service Calls (Frontend -> Backend)
├── App.tsx                 # Main Frontend Entry Point
└── ...
```

## Run Locally

### Prerequisites
- **Node.js** (v18 or higher)
- **Python** (v3.9 or higher)
- **Git**

### 1. Clone the Repository
```bash
git clone https://github.com/Itachixtanjiro/VitalScanAI.git
cd VitalScanAI
```

### 2. Backend Setup
Navigate to the backend directory and set up the Python environment.

```bash
cd backend

# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env and add your API credentials (GEMINI_API_KEY, MISTRAL_API_KEY, etc.)

# Start the Backend Server
python start.py
# Server running at http://localhost:8000
```

### 3. Frontend Setup
Open a new terminal, navigate to the project root, and install dependencies.

```bash
# Install Node dependencies
npm install

# Start the Development Server
npm run dev
# App running at http://localhost:5173
```

## License
This project is for research purposes only.
