import os
import glob
from utils import get_logger

logger = get_logger(__name__)

class LighterRAG:
    """
    A memory-efficient alternative to sentence-transformers.
    Uses simple keyword matching to find relevant text chunks.
    """
    def __init__(self, data_dir="data/rag-knowledge"):
        self.data_dir = data_dir
        self.chunks = []
        self.is_loaded = False
        
    def load_documents(self):
        if self.is_loaded:
            return
            
        self.chunks = []
        # Support both the root data/ and backend/data/ paths
        search_path = os.path.join(self.data_dir, "*.txt")
        files = glob.glob(search_path)
        
        if not files and not os.path.isabs(self.data_dir):
            # Try parent directory if data is outside backend/
            alt_path = os.path.join("..", self.data_dir, "*.txt")
            files = glob.glob(alt_path)

        for file_path in files:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    # Split by double newlines (paragraphs/sections)
                    sections = [s.strip() for s in content.split('\n\n') if s.strip()]
                    self.chunks.extend(sections)
            except Exception as e:
                logger.error(f"Error reading {file_path}: {e}")
        
        self.is_loaded = True
        logger.info(f"LighterRAG loaded with {len(self.chunks)} knowledge chunks.")

    def retrieve(self, query, top_k=2):
        if not self.is_loaded:
            self.load_documents()
            
        if not self.chunks:
            return []

        # Simple keyword relevance scoring
        query_words = set(query.lower().split())
        scored_chunks = []
        
        for chunk in self.chunks:
            chunk_lower = chunk.lower()
            score = sum(1 for word in query_words if word in chunk_lower)
            scored_chunks.append((score, chunk))
            
        # Sort by score descending
        scored_chunks.sort(key=lambda x: x[0], reverse=True)
        
        # Return top K chunks that have at least some match
        return [chunk for score, chunk in scored_chunks[:top_k] if score > 0]

rag_system = LighterRAG()
