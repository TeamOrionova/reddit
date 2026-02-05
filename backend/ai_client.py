import os
import google.generativeai as genai
from groq import Groq
from utils import get_logger, config

logger = get_logger(__name__)

class AIClient:
    def __init__(self):
        self.gemini_key = config.get("GOOGLE_AI_API_KEY")
        self.groq_key = config.get("GROQ_API_KEY")
        
        if self.gemini_key:
            genai.configure(api_key=self.gemini_key)
            self.gemini_model = genai.GenerativeModel('gemini-1.5-flash')
        
        if self.groq_key:
            self.groq_client = Groq(api_key=self.groq_key)

    def generate_response(self, prompt, context=""):
        full_prompt = f"Context:\n{context}\n\nUser Question:\n{prompt}\n\nPlease provide a helpful, professional, and concise response based on the context. START YOUR RESPONSE BY STATING YOU ARE AN AI RECRUITING ASSISTANT."
        
        # Try Gemini first
        if self.gemini_key:
            try:
                response = self.gemini_model.generate_content(full_prompt)
                return response.text
            except Exception as e:
                logger.error(f"Gemini API failed: {e}")
        
        # Fallback to Groq
        if self.groq_key:
            try:
                chat_completion = self.groq_client.chat.completions.create(
                    messages=[
                        {
                            "role": "user",
                            "content": full_prompt,
                        }
                    ],
                    model="llama3-8b-8192",
                )
                return chat_completion.choices[0].message.content
            except Exception as e:
                logger.error(f"Groq API failed: {e}")
        
        # Final fallback
        return "I'm currently away but I've received your message. I'll get back to you shortly!"

    def score_lead(self, title, body):
        prompt = f"""
        Analyze this Reddit post for a sales/commission job opportunity.
        Title: {title}
        Body: {body}
        
        Return a JSON object with:
        - score (0-100)
        - reasoning (string)
        - intent (string: 'seeking_work', 'hiring', 'discussion', 'spam')
        """
        # Simplified for now, just returning a mock score if no AI
        try:
            response = self.generate_response(prompt)
            # In a real impl, parse JSON. For now assume text.
            # This is a placeholder for the complex extraction logic
            if "score" in response.lower():
                return response
            return "Score: 50. Analysis: Needs manual review."
        except:
            return "Score: 0. Error in AI analysis."

ai_client = AIClient()
