import os
from dotenv import load_dotenv
import requests
import logging
from tenacity import retry, stop_after_attempt, wait_exponential
from sentence_transformers import SentenceTransformer
from sklearn.neighbors import NearestNeighbors
import numpy as np
from typing import Optional

# Load .env directly from current folder
load_dotenv()

API_KEY = os.getenv("GROQ_API_KEY")
API_URL = "https://api.groq.com/openai/v1/chat/completions"
MODEL_NAME = "llama-3.1-8b-instant" 

# FILE PATHS
DATA_FILE = "university_data.txt"
PROMPT_FILE = "prompts.txt"
RESPONSE_FILE = "responses.txt"
CHAT_LOG_FILE = "chat_history.txt"
FALLBACK_DATA_FILE = "extra.txt"

# Setup logging
logging.basicConfig(
    filename='errors.log',
    level=logging.WARNING,
    format='%(asctime)s - %(message)s'
)

class Assistant:
    def __init__(self):
        self.error_count = 0
        self.max_errors = 5
        self.chat_history = []
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        self.chunks = []
        self.index: Optional[NearestNeighbors] = None
        self.chunk_texts = []
        self.embeddings = None
        self.prepare_index(DATA_FILE)

    def load_file(self, filename):
        try:
            with open(filename, 'r', encoding='utf-8') as f:
                return f.read()
        except Exception as e:
            logging.warning(f"File load failed: {str(e)}")
            return ""

    def chunk_text(self, text, chunk_size=8):
        lines = text.split('\n')
        chunks = []
        for i in range(0, len(lines), chunk_size):
            chunk = '\n'.join(lines[i:i + chunk_size]).strip()
            if chunk:
                chunks.append(chunk)
        return chunks

    def prepare_index(self, data_file):
        data = self.load_file(data_file)
        self.chunks = self.chunk_text(data)
        self.chunk_texts = self.chunks
        self.embeddings = self.model.encode(self.chunks, convert_to_numpy=True)
        self.index = NearestNeighbors(n_neighbors=3, metric="cosine")
        self.index.fit(self.embeddings)

    def semantic_search(self, query, top_k=3):
        if not self.index or self.embeddings is None or len(self.chunk_texts) == 0:
            logging.warning("Semantic search called but index is not ready.")
            return ""

        query_vec = self.model.encode([query], convert_to_numpy=True)
        distances, indices = self.index.kneighbors(query_vec, n_neighbors=min(top_k, len(self.chunk_texts)))
        return '\n\n'.join([self.chunk_texts[i] for i in indices[0] if i < len(self.chunk_texts)])


    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
    def get_response(self, question, context):
        if self.error_count >= self.max_errors:
            return "System needs restart. Please try again later."

        try:
            messages = [{"role": "system", "content": "You are PAF-IAST assistant. Answer based on: " + context[:1500]}]
            messages.extend(self.chat_history)
            messages.append({"role": "user", "content": question})

            response = requests.post(
                API_URL,
                headers={
                    "Authorization": f"Bearer {API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": MODEL_NAME,
                    "messages": messages,
                    "temperature": 0.6,
                    "max_tokens": 1024
                },
                timeout=15
            )

            if response.status_code != 200:
                logging.warning(f"API error {response.status_code}: {response.text}")
                raise Exception(f"API error {response.status_code}")

            data = response.json()
            reply = data['choices'][0]['message']['content'].strip()
            self.error_count = 0

            self.chat_history.append({"role": "user", "content": question})
            self.chat_history.append({"role": "assistant", "content": reply})

            return reply

        except Exception as e:
            self.error_count += 1
            logging.warning(f"API Exception: {str(e)}")
            return f"Temporary issue. Please try again. ({self.error_count}/{self.max_errors})"

    def save_conversation(self, user_input, response):
        try:
            with open(CHAT_LOG_FILE, 'a', encoding='utf-8') as f:
                f.write(f"User: {user_input}\nBot: {response}\n\n")

            with open(PROMPT_FILE, 'a', encoding='utf-8') as f:
                f.write(f"{user_input}\n")

            with open(RESPONSE_FILE, 'a', encoding='utf-8') as f:
                f.write(f"{response}\n")
        except Exception as e:
            logging.error(f"File save error: {str(e)}")

def main():
    print("PAF-IAST Assistant (type 'exit' to quit)\n")
    bot = Assistant()
    extra_data = bot.load_file(FALLBACK_DATA_FILE)

    while True:
        try:
            user_input = input("You: ").strip()
            if not user_input:
                continue

            if user_input.lower() in ['exit', 'quit']:
                print("Goodbye!")
                break

            context = bot.semantic_search(user_input)
            if not context:
                context = bot.semantic_search(extra_data)

            if not context or context.strip() == "":
                print("Bot: Sorry, I can only answer university-related queries.\n")
                continue

            response = bot.get_response(user_input, context)
            print(f"Bot: {response}\n")
            bot.save_conversation(user_input, response)

            if bot.error_count >= bot.max_errors:
                print("Too many errors. Restart required.")
                break

        except KeyboardInterrupt:
            print("\nSession ended")
            break
        
        except Exception as e:
            print("Temporary issue. Please rephrase your question.")
            logging.warning(f"Main loop error: {str(e)}")

if __name__ == "__main__":
    main()
