import os
import glob
from sentence_transformers import SentenceTransformer, util
from utils import get_logger

logger = get_logger(__name__)

class RAGSystem:
    def __init__(self, data_dir="data/rag-knowledge"):
        self.data_dir = data_dir
        self.model = None
        self.embeddings = []
        self.chunks = []
        
    def load_model(self):
        if not self.model:
            logger.info("Loading embedding model...")
            self.model = SentenceTransformer('all-MiniLM-L6-v2')
            self.load_documents()

    def load_documents(self):
        self.chunks = []
        files = glob.glob(os.path.join(self.data_dir, "*.txt"))
        for file_path in files:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                # Simple splitting by newlines or paragraphs
                # For better results, use a recursive character splitter
                sections = [s.strip() for s in content.split('\n\n') if s.strip()]
                self.chunks.extend(sections)
        
        if self.chunks:
            logger.info(f"Encoding {len(self.chunks)} chunks...")
            self.embeddings = self.model.encode(self.chunks, convert_to_tensor=True)

    def retrieve(self, query, top_k=2):
        if not self.model:
            self.load_model()
            
        if not self.chunks:
            return []

        query_embedding = self.model.encode(query, convert_to_tensor=True)
        cos_scores = util.cos_sim(query_embedding, self.embeddings)[0]
        top_results = list(zip(cos_scores, self.chunks))
        top_results.sort(key=lambda x: x[0], reverse=True)
        
        return [chunk for score, chunk in top_results[:top_k]]

rag_system = RAGSystem()
