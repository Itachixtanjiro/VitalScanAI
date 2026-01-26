# RAG Pipeline and Mistral API Integration

## Summary

Successfully integrated RAG (Retrieval-Augmented Generation) pipeline and Mistral API for clinical text processing.

---

## Components Implemented

### 1. RAG Pipeline (Adapted from Persona-Extractor)

#### **Document Ingester** (`backend/rag/ingester.py`)
- Supports PDF, DOCX, and TXT files
- Extracts text from uploaded documents
- Handles both file paths and byte content (for API uploads)

#### **Text Chunker** (`backend/rag/chunker.py`)
- Configurable chunk size (default: 500 chars) and overlap (default: 50 chars)
- Two chunking strategies:
  - Paragraph-based chunking
  - Sentence-based chunking (better semantic coherence)
- Preserves metadata for each chunk

#### **Vector Store** (`backend/rag/vectorstore.py`)
- Uses **FAISS** for efficient similarity search
- Embeddings: `sentence-transformers/all-mpnet-base-v2` (768 dimensions)
- Supports two index types:
  - **Flat**: Exact search (good for <100K chunks)
  - **IVF**: Approximate search (scalable to millions)
- Persistent storage (save/load to disk)

#### **RAG API** (`backend/api/rag.py`)
- `POST /api/rag/ingest` - Upload and ingest documents
- `POST /api/rag/search` - Semantic search across ingested documents
- `GET /api/rag/stats` - Vector store statistics
- `DELETE /api/rag/clear` - Clear all documents

---

### 2. Mistral API Client (`backend/llm/mistral_client.py`)

#### **Features:**
- **Entity Extraction**: Extract symptoms, medications, vital signs, diagnoses, procedures
- **Text Preprocessing**: Clean and normalize clinical text
- **Summarization**: Generate concise clinical summaries
- **Fallback Mode**: Works without API key using regex-based extraction

#### **Usage:**
```python
from llm.mistral_client import mistral_client

# Extract entities
entities = await mistral_client.extract_entities(clinical_text)
# Returns: {"symptoms": [...], "medications": [...], "vital_signs": {...}}

# Preprocess text
cleaned = await mistral_client.preprocess_text(raw_text)

# Summarize
summary = await mistral_client.summarize_clinical_text(text, max_length=200)
```

---

## API Endpoints

### RAG Endpoints

**Ingest Document:**
```bash
POST /api/rag/ingest
Content-Type: multipart/form-data

file: <PDF/DOCX/TXT file>
chunk_size: 500 (optional)
chunk_overlap: 50 (optional)
```

**Search Documents:**
```bash
POST /api/rag/search
Content-Type: application/json

{
  "query": "patient symptoms",
  "k": 5
}
```

**Get Stats:**
```bash
GET /api/rag/stats
```

---

## Configuration

### Environment Variables

Add to `.env` file:
```bash
MISTRAL_API_KEY=your_mistral_api_key_here
```

Get your API key from: https://console.mistral.ai

---

## Dependencies Installed

```
sentence-transformers>=2.2.2  # Embedding model
faiss-cpu>=1.7.4              # Vector search
PyPDF2>=3.0.1                 # PDF parsing
python-docx>=1.1.0            # DOCX parsing
mistralai>=0.1.0              # Mistral API client
```

---

## Testing

### Test RAG Pipeline:
```bash
# 1. Start server
cd backend
uvicorn app:app --reload

# 2. Upload a document
curl -X POST "http://localhost:8000/api/rag/ingest" \
  -F "file=@clinical_notes.pdf"

# 3. Search
curl -X POST "http://localhost:8000/api/rag/search" \
  -H "Content-Type: application/json" \
  -d '{"query": "patient symptoms", "k": 3}'
```

### Test Mistral Client:
```python
from llm.mistral_client import mistral_client

text = "Patient reports chest pain. BP: 140/90 mmHg. HR: 85 bpm."
entities = await mistral_client.extract_entities(text)
print(entities)
```

---

## Next Steps

1. **Integrate into Synthesis Endpoint**: Use Mistral for clinical text preprocessing before risk analysis
2. **RAG-Enhanced Context**: Retrieve relevant historical data for better LLM prompts
3. **MedGemma Integration**: Add multimodal medical image understanding (requires GPU or cloud endpoint)

---

## Notes

- RAG vector store is **in-memory** by default (cleared on restart)
- Use `vs.save(path)` and `vs.load(path)` for persistence
- Mistral client falls back to regex-based extraction if API key is not set
- All components work independently and can be tested separately
