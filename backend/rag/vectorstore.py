import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import logging
import numpy as np
from typing import List, Dict, Optional, Tuple
from sentence_transformers import SentenceTransformer
import faiss
import pickle
from pathlib import Path

logger = logging.getLogger(__name__)

class VectorStore:
    """
    FAISS-based vector store for semantic search.
    Uses all-mpnet-base-v2 embeddings (from Persona-Extractor).
    """
    
    def __init__(
        self,
        model_name: str = "sentence-transformers/all-mpnet-base-v2",
        index_type: str = "flat",
        nlist: int = 100
    ):
        """
        Initialize vector store.
        
        Args:
            model_name: Sentence transformer model to use
            index_type: 'flat' for exact search or 'ivf' for approximate
            nlist: Number of clusters for IVF index
        """
        self.model_name = model_name
        self.index_type = index_type
        self.nlist = nlist
        
        # Load embedding model
        logger.info(f"Loading embedding model: {model_name}")
        self.encoder = SentenceTransformer(model_name)
        self.dimension = self.encoder.get_sentence_embedding_dimension()
        
        # Initialize FAISS index
        self.index = None
        self.chunks = []  # Store original chunks
        self._initialize_index()
    
    def _initialize_index(self):
        """Initialize FAISS index based on type."""
        if self.index_type == "flat":
            # Exact search (L2 distance)
            self.index = faiss.IndexFlatL2(self.dimension)
            logger.info(f"Initialized Flat index with dimension {self.dimension}")
        elif self.index_type == "ivf":
            # Approximate search with IVF
            quantizer = faiss.IndexFlatL2(self.dimension)
            self.index = faiss.IndexIVFFlat(quantizer, self.dimension, self.nlist)
            logger.info(f"Initialized IVF index with {self.nlist} clusters")
        else:
            raise ValueError(f"Unknown index type: {self.index_type}")
    
    def add_chunks(self, chunks: List[Dict[str, any]]):
        """
        Add text chunks to the vector store.
        
        Args:
            chunks: List of chunk dicts with 'text' and 'metadata'
        """
        if not chunks:
            logger.warning("No chunks to add")
            return
        
        # Extract text from chunks
        texts = [chunk['text'] for chunk in chunks]
        
        # Generate embeddings
        logger.info(f"Generating embeddings for {len(texts)} chunks...")
        embeddings = self.encoder.encode(texts, show_progress_bar=True)
        embeddings = np.array(embeddings).astype('float32')
        
        # Train IVF index if needed
        if self.index_type == "ivf" and not self.index.is_trained:
            logger.info("Training IVF index...")
            self.index.train(embeddings)
        
        # Add to index
        self.index.add(embeddings)
        self.chunks.extend(chunks)
        
        logger.info(f"Added {len(chunks)} chunks to vector store. Total: {len(self.chunks)}")
    
    def search(
        self,
        query: str,
        k: int = 5,
        score_threshold: Optional[float] = None
    ) -> List[Tuple[Dict, float]]:
        """
        Search for similar chunks.
        
        Args:
            query: Search query text
            k: Number of results to return
            score_threshold: Optional minimum similarity score
        
        Returns:
            List of (chunk, distance) tuples
        """
        if len(self.chunks) == 0:
            logger.warning("Vector store is empty")
            return []
        
        # Generate query embedding
        query_embedding = self.encoder.encode([query])
        query_embedding = np.array(query_embedding).astype('float32')
        
        # Search
        distances, indices = self.index.search(query_embedding, min(k, len(self.chunks)))
        
        # Format results
        results = []
        for dist, idx in zip(distances[0], indices[0]):
            if idx < len(self.chunks):  # Valid index
                if score_threshold is None or dist <= score_threshold:
                    results.append((self.chunks[idx], float(dist)))
        
        logger.info(f"Found {len(results)} results for query: '{query[:50]}...'")
        return results
    
    def save(self, path: str):
        """Save vector store to disk."""
        path = Path(path)
        path.mkdir(parents=True, exist_ok=True)
        
        # Save FAISS index
        index_path = path / "faiss.index"
        faiss.write_index(self.index, str(index_path))
        
        # Save chunks and metadata
        metadata_path = path / "metadata.pkl"
        with open(metadata_path, 'wb') as f:
            pickle.dump({
                'chunks': self.chunks,
                'model_name': self.model_name,
                'index_type': self.index_type,
                'nlist': self.nlist
            }, f)
        
        logger.info(f"Saved vector store to {path}")
    
    def load(self, path: str):
        """Load vector store from disk."""
        path = Path(path)
        
        # Load FAISS index
        index_path = path / "faiss.index"
        self.index = faiss.read_index(str(index_path))
        
        # Load chunks and metadata
        metadata_path = path / "metadata.pkl"
        with open(metadata_path, 'rb') as f:
            data = pickle.load(f)
            self.chunks = data['chunks']
            self.model_name = data['model_name']
            self.index_type = data['index_type']
            self.nlist = data['nlist']
        
        logger.info(f"Loaded vector store from {path} with {len(self.chunks)} chunks")
    
    def clear(self):
        """Clear all data from vector store."""
        self._initialize_index()
        self.chunks = []
        logger.info("Cleared vector store")
