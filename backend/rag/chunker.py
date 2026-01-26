import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import logging
from typing import List, Dict
import re

logger = logging.getLogger(__name__)

class TextChunker:
    """
    Chunks text into smaller segments with overlap.
    Based on Persona-Extractor chunking strategy.
    """
    
    def __init__(
        self,
        chunk_size: int = 500,
        chunk_overlap: int = 50,
        separator: str = "\n\n"
    ):
        """
        Initialize chunker.
        
        Args:
            chunk_size: Target size of each chunk in characters
            chunk_overlap: Number of overlapping characters between chunks
            separator: Primary separator for splitting (default: paragraph breaks)
        """
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.separator = separator
    
    def _split_by_separator(self, text: str, separator: str) -> List[str]:
        """Split text by separator while preserving structure."""
        if separator:
            return text.split(separator)
        return [text]
    
    def _merge_chunks(self, splits: List[str]) -> List[str]:
        """Merge small splits into chunks of target size with overlap."""
        chunks = []
        current_chunk = ""
        
        for split in splits:
            # If adding this split would exceed chunk size
            if len(current_chunk) + len(split) > self.chunk_size and current_chunk:
                chunks.append(current_chunk.strip())
                # Start new chunk with overlap from previous
                overlap_start = max(0, len(current_chunk) - self.chunk_overlap)
                current_chunk = current_chunk[overlap_start:] + split
            else:
                current_chunk += split + self.separator
        
        # Add remaining chunk
        if current_chunk.strip():
            chunks.append(current_chunk.strip())
        
        return chunks
    
    def chunk(self, text: str) -> List[Dict[str, any]]:
        """
        Chunk text into segments.
        
        Returns:
            List of dicts with 'text', 'chunk_id', and 'metadata'
        """
        # Clean text
        text = re.sub(r'\s+', ' ', text)  # Normalize whitespace
        text = text.strip()
        
        # Split by primary separator
        splits = self._split_by_separator(text, self.separator)
        
        # Merge into chunks
        chunks = self._merge_chunks(splits)
        
        # Create chunk objects with metadata
        result = []
        for i, chunk_text in enumerate(chunks):
            result.append({
                'chunk_id': i,
                'text': chunk_text,
                'char_count': len(chunk_text),
                'metadata': {
                    'position': i,
                    'total_chunks': len(chunks)
                }
            })
        
        logger.info(f"Created {len(result)} chunks from {len(text)} characters")
        return result
    
    def chunk_with_sentences(self, text: str) -> List[Dict[str, any]]:
        """
        Chunk text by sentences for more semantic coherence.
        """
        # Split into sentences
        sentences = re.split(r'(?<=[.!?])\s+', text)
        
        chunks = []
        current_chunk = ""
        
        for sentence in sentences:
            if len(current_chunk) + len(sentence) > self.chunk_size and current_chunk:
                chunks.append(current_chunk.strip())
                # Overlap: include last sentence
                current_chunk = sentence
            else:
                current_chunk += " " + sentence
        
        if current_chunk.strip():
            chunks.append(current_chunk.strip())
        
        # Create chunk objects
        result = []
        for i, chunk_text in enumerate(chunks):
            result.append({
                'chunk_id': i,
                'text': chunk_text,
                'char_count': len(chunk_text),
                'metadata': {
                    'position': i,
                    'total_chunks': len(chunks),
                    'chunking_strategy': 'sentence-based'
                }
            })
        
        logger.info(f"Created {len(result)} sentence-based chunks")
        return result
