import os
import json
import logging
from typing import Dict, List, Optional
import requests
import torch
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from transformers import pipeline

logger = logging.getLogger(__name__)

class ClinicalNoteParser:
    def __init__(self, mistral_api_key: Optional[str] = None):
        """
        Initialize the Clinical Note Parser.
        
        Args:
            mistral_api_key: API Key for Mistral. If None, checks MISTRAL_API_KEY env var.
        """
        self.mistral_key = mistral_api_key or os.environ.get("MISTRAL_API_KEY")
        
        if not self.mistral_key:
            logger.warning("No Mistral API Key provided. LLM capabilities will be disabled.")
            print("TIP: Set `os.environ['MISTRAL_API_KEY'] = 'your_key'` before initialization.")
        else:
            logger.info("Mistral API Key detected.")

        self.ner_pipeline = None
        self.embedding_pipeline = None

    def load_local_models(self, ner_model: str = "d4data/biomedical-ner-all", embedding_model: str = "emilyalsentzer/Bio_ClinicalBERT", device: int = -1):
        """
        Load local BioBERT/ClinicalBERT models for Entity Recognition and Embeddings.
        
        Args:
            ner_model: Hugging Face model for NER.
            embedding_model: Hugging Face model for Feature Extraction.
            device: Device ID (-1 for CPU, 0+ for GPU).
        """
        logger.info(f"Loading local NER model: {ner_model}...")
        try:
            # Check for GPU
            if torch.cuda.is_available() and device < 0:
                device = 0
                logger.info(f"CUDA detected. Using GPU: {torch.cuda.get_device_name(0)}")
            
            # NER Pipeline
            self.ner_pipeline = pipeline(
                "token-classification", 
                model=ner_model, 
                tokenizer=ner_model, 
                aggregation_strategy="simple",
                device=device
            )
            
            # Embedding Pipeline
            logger.info(f"Loading local Embedding model: {embedding_model}...")
            self.embedding_pipeline = pipeline(
                "feature-extraction",
                model=embedding_model,
                tokenizer=embedding_model,
                device=device
            )

            logger.info("Local models loaded successfully.")
        except Exception as e:
            logger.error(f"Error loading local models: {e}")
            raise

    def get_embeddings(self, texts: List[str]) -> np.ndarray:
        """
        Generate vector embeddings for a list of text chunks.
        """
        if not self.embedding_pipeline:
            logger.warning("Embedding pipeline not loaded. Call load_local_models() first.")
            return np.array([])
        
        try:
            # features is a list of lists of lists (batch x seq_len x hidden_dim)
            features = self.embedding_pipeline(texts, truncation=True, max_length=512)
            
            embeddings = []
            for i, seq_features in enumerate(features):
                # seq_features is a List[List[float]] (seq_len x hidden_dim)
                # Convert to numpy array to ensure consistency
                try:
                    seq_arr = np.array(seq_features)
                    if seq_arr.ndim == 2:
                         # Standard case: (SeqLen, HiddenDim)
                         mean_embedding = np.mean(seq_arr, axis=0)
                    elif seq_arr.ndim == 3:
                         # Unexpected nested case: (1, SeqLen, HiddenDim)
                         mean_embedding = np.mean(seq_arr, axis=1).flatten()
                    else:
                         # Fallback for weird shapes
                         logger.warning(f"Unexpected shape for text {i}: {seq_arr.shape}")
                         mean_embedding = np.zeros(768) # Fallback to zeros if dimensions are wrong
                         
                except Exception as array_err:
                    logger.error(f"Array conversion error for text {i}: {array_err}")
                    mean_embedding = np.zeros(768)

                # Ensure it's 1D
                if mean_embedding.ndim > 1:
                    mean_embedding = mean_embedding.flatten()
                    
                embeddings.append(mean_embedding)
                
            return np.array(embeddings)
        except Exception as e:
            logger.error(f"Error generating embeddings: {e}")
            return np.array([])

    def search_similar(self, query: str, corpus_texts: List[str], top_k: int = 3) -> List[Dict]:
        """
        Semantic search: Find chunks in corpus_texts similar to the query.
        """
        if not self.embedding_pipeline:
            logger.warning("Embedding pipeline not loaded.")
            return []

        query_emb = self.get_embeddings([query]) # [1, hidden_dim]
        corpus_emb = self.get_embeddings(corpus_texts) # [N, hidden_dim]
        
        if len(query_emb) == 0 or len(corpus_emb) == 0:
            return []

        # Cosine Similarity
        # Reshape for sklearn if needed, but [1, dim] and [N, dim] works
        similarities = cosine_similarity(query_emb, corpus_emb)[0] # [N] scores
        
        # Get indices of top k
        top_indices = similarities.argsort()[-top_k:][::-1]
        
        results = []
        for idx in top_indices:
            results.append({
                "text": corpus_texts[idx],
                "score": float(similarities[idx])
            })
            
        return results

    def extract_entities_bert(self, text: str) -> List[Dict]:
        """
        Extract medical entities using the local BERT model.
        """
        if not self.ner_pipeline:
            logger.warning("NER pipeline not loaded. Call load_local_models() first.")
            return []
        
        try:
            entities = self.ner_pipeline(text)
            cleaned_entities = []
            for entity in entities:
                cleaned_entities.append({
                    "entity_group": entity.get("entity_group"),
                    "score": float(entity.get("score", 0.0)),
                    "word": entity.get("word"),
                    "start": entity.get("start"),
                    "end": entity.get("end")
                })
            return cleaned_entities
        except Exception as e:
            logger.error(f"Error during BERT extraction: {e}")
            return []

    def analyze_ui_hints(self, structured_data: Dict) -> Dict:
        """
        Analyze the parsed data to generate UI hints.
        Determines which charts or components should be triggered.
        """
        hints = {
            "show_bp_trend": False,
            "show_medication_list": False,
            "show_lab_table": False,
            "critical_alert": False
        }
        
        if not structured_data:
            return hints

        # logic for BP Trend
        vitals = structured_data.get("vital_signs", {})
        if isinstance(vitals, list): # If it's a list of readings
             if len(vitals) > 1:
                 hints["show_bp_trend"] = True
        elif isinstance(vitals, dict):
            bp = vitals.get("blood_pressure") or vitals.get("bp")
            if isinstance(bp, list) and len(bp) > 1:
                 hints["show_bp_trend"] = True

        # Logic for Med List
        meds = structured_data.get("medications", [])
        if meds and len(meds) > 0:
            hints["show_medication_list"] = True

        # Logic for Critical Alert
        plan = str(structured_data.get("plan", "")).lower()
        assessment = str(structured_data.get("diagnosis", "")).lower()
        critical_keywords = ["urgent", "emergency", "crisis", "critical", "severe"]
        if any(w in plan for w in critical_keywords) or any(w in assessment for w in critical_keywords):
            hints["critical_alert"] = True
            
        return hints

    def parse_with_mistral(self, text: str, context: Optional[List[Dict]] = None) -> Dict:
        """
        Parse the clinical note into a structured JSON using Mistral API via HTTP requests.
        """
        if not self.mistral_key:
            return {"error": "Mistral API Key missing"}

        context_str = ""
        if context:
            context_str = f"\n\nDetected Entities (Reference): {json.dumps(context, indent=2)}"

        prompt = f"""
        You are an expert medical AI assistant. Your task is to parse the following clinical note into a structured JSON format.
        
        Extract the following fields accurately:
        - patient_demographics (age, sex, etc.)
        - chief_complaint
        - history_of_present_illness (summary)
        - vital_signs: Normalize to a list of objects if multiple readings exist (e.g. [{{ "type": "blood_pressure", "value": "120/80", "timestamp": "current" }}]).
        - diagnosis (list of conditions)
        - medications (list of current meds)
        - plan (action items)

        Output ONLY valid JSON.
        
        Clinical Note:
        {text}
        {context_str}
        """

        url = "https://api.mistral.ai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.mistral_key}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
        data = {
            "model": "mistral-large-latest",
            "messages": [{"role": "user", "content": prompt}],
            "response_format": {"type": "json_object"}
        }

        try:
            response = requests.post(url, headers=headers, json=data)
            response.raise_for_status()
            result = response.json()
            content = result['choices'][0]['message']['content']
            parsed_json = json.loads(content)
            
            # Post-process for UI hints
            parsed_json["ui_hints"] = self.analyze_ui_hints(parsed_json)
            
            return parsed_json
        except Exception as e:
            logger.error(f"Mistral API Error: {e}")
            if 'response' in locals() and hasattr(response, 'text'):
                logger.error(f"API Response: {response.text}")
            return {"error": str(e)}

    def process_note(self, text: str, use_local: bool = True, use_llm: bool = True) -> Dict:
        """
        Full pipeline: BERT Extraction -> Mistral Parsing -> Merged Result.
        """
        result = {
            "raw_text": text,
            "bert_entities": [],
            "structured_data": {}
        }
        
        # Step 1: Local BERT
        if use_local:
            if not self.ner_pipeline:
                self.load_local_models()
            result["bert_entities"] = self.extract_entities_bert(text)
            
        # Step 2: Mistral LLM
        if use_llm:
            result["structured_data"] = self.parse_with_mistral(text, context=result["bert_entities"])
            
        return result

# Singleton instance for easy import
clinical_agent = ClinicalNoteParser()
