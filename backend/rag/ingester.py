import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import logging
from typing import List, Dict, Any
from pathlib import Path
import PyPDF2
import docx

logger = logging.getLogger(__name__)

class DocumentIngester:
    """
    Ingests documents from various formats (.pdf, .docx, .txt)
    Adapted from Persona-Extractor architecture.
    """
    
    @staticmethod
    def ingest_pdf(file_path: str) -> str:
        """Extract text from PDF file."""
        try:
            text = ""
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                for page in pdf_reader.pages:
                    text += page.extract_text() + "\n"
            logger.info(f"Extracted {len(text)} characters from PDF: {file_path}")
            return text
        except Exception as e:
            logger.error(f"Error reading PDF {file_path}: {e}")
            raise
    
    @staticmethod
    def ingest_docx(file_path: str) -> str:
        """Extract text from DOCX file."""
        try:
            doc = docx.Document(file_path)
            text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
            logger.info(f"Extracted {len(text)} characters from DOCX: {file_path}")
            return text
        except Exception as e:
            logger.error(f"Error reading DOCX {file_path}: {e}")
            raise
    
    @staticmethod
    def ingest_txt(file_path: str) -> str:
        """Extract text from TXT file."""
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                text = file.read()
            logger.info(f"Extracted {len(text)} characters from TXT: {file_path}")
            return text
        except Exception as e:
            logger.error(f"Error reading TXT {file_path}: {e}")
            raise
    
    @staticmethod
    def ingest_from_bytes(content: bytes, file_type: str, filename: str = "document") -> str:
        """
        Ingest document from bytes content.
        Useful for FastAPI file uploads.
        """
        # Create temporary file
        temp_dir = Path("temp_uploads")
        temp_dir.mkdir(exist_ok=True)
        # Sanitize filename (handling cases where filename might be a path or contain invalid chars)
        safe_filename = Path(filename).name
        temp_path = temp_dir / safe_filename
        
        try:
            # Write bytes to temp file
            with open(temp_path, 'wb') as f:
                f.write(content)
            
            # Extract based on file type
            if file_type == 'application/pdf' or filename.endswith('.pdf'):
                text = DocumentIngester.ingest_pdf(str(temp_path))
            elif file_type == 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' or filename.endswith('.docx'):
                text = DocumentIngester.ingest_docx(str(temp_path))
            elif file_type.startswith('text/') or filename.endswith('.txt'):
                text = DocumentIngester.ingest_txt(str(temp_path))
            else:
                # Try to decode as text
                text = content.decode('utf-8', errors='ignore')
            
            return text
        finally:
            # Cleanup temp file
            if temp_path.exists():
                temp_path.unlink()
    
    @staticmethod
    def ingest(file_path: str) -> str:
        """
        Auto-detect file type and ingest.
        """
        path = Path(file_path)
        
        if not path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")
        
        ext = path.suffix.lower()
        
        if ext == '.pdf':
            return DocumentIngester.ingest_pdf(file_path)
        elif ext == '.docx':
            return DocumentIngester.ingest_docx(file_path)
        elif ext == '.txt':
            return DocumentIngester.ingest_txt(file_path)
        else:
            raise ValueError(f"Unsupported file type: {ext}")
