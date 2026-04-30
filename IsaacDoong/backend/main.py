from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .schemas import TextIn, SentimentOut
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from scipy.special import softmax
import torch
import re
import numpy as np

# CONFIGURATION
MODEL_PATH_DIR = 'model/final_bert_model'
sentiment_model = None
tokenizer = None

LABEL_MAP_FIXED = {
    0: 'negative',
    1: 'neutral',
    2: 'positive'
}

app = FastAPI(title="TextLens | Sentiment Analysis Deep Learning API")

# CORS MIDDLEWARE
# Allows frontend (port 5500) to communicate with this backend (port 8000)
origins = [
    "http://127.0.0.1:8000",
    "http://localhost:8000",
    "http://127.0.0.1:5500",
    "http://localhost:5500",
    "null"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# PREPROCESSING FUNCTION
def clean_text(text):
    """Clean text by removing URLs/mentions, keeping most punctuation and emojis."""
    if isinstance(text, str):
        # Remove URLs
        text = re.sub(r'http\S+|www\S+|https\S+', '', text, flags=re.MULTILINE)
        # Remove mentions
        text = re.sub(r'@\w+', '', text)
        # Keep letters, numbers, basic punctuation
        text = re.sub(r"[^\w\s\.\,\!\?\-']+", '', text)
        # Replace multiple spaces with a single one
        text = re.sub(r'\s+', ' ', text)
        return text.lower().strip()
    return ""

# 2. MODEL LOADING
@app.on_event("startup")
def load_assets():
    """Load the trained DistilBERT model and tokenizer from disk on startup."""
    global sentiment_model, tokenizer
    try:
        tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH_DIR)
        sentiment_model = AutoModelForSequenceClassification.from_pretrained(MODEL_PATH_DIR)
        sentiment_model.eval() # Set to evaluation mode
        print("INFO: DistilBERT Model loaded successfully.")
    except Exception as e:
        print(f"ERROR: Failed to load DistilBERT model from {MODEL_PATH_DIR}. Reason: {e}")
        raise RuntimeError("BERT Model files not found. Ensure path is correct.")

# 3. API ENDPOINT
@app.post("/api/analyze", response_model=SentimentOut)
def analyze_sentiment(data: TextIn):
    """Receives text, runs DistilBERT prediction, and returns structured analysis."""
    
    if sentiment_model is None or tokenizer is None:
        return SentimentOut(
            sentiment="Error", 
            score=0.0, 
            breakdown={}, 
            message="Model not loaded on server."
        )

    # Tokenize and Preprocess
    clean_input = clean_text(data.text)
    encoded_input = tokenizer.encode_plus(
        clean_input,
        return_tensors='pt',
        truncation=True,
        padding='max_length',
        max_length=128
    )

    # Prediction Logic
    with torch.no_grad():
        output = sentiment_model(**encoded_input)

    # Convert raw logits to probabilities via Softmax
    # .logits ensures getting a 1D array from the batch
    scores = output.logits.detach().numpy().flatten()
    probabilities = softmax(scores)

    # Create the breakdown dictionary
    # .item() converts NumPy scalars back to standard Python floats
    breakdown = {
        LABEL_MAP_FIXED.get(i, f"label_{i}"): float(probabilities[i].item()) 
        for i in range(len(probabilities))
    }

    # Find winning label
    max_index = np.argmax(probabilities)
    prediction = LABEL_MAP_FIXED.get(max_index, "neutral")
    score = float(probabilities[max_index].item())

    return SentimentOut(
        sentiment=prediction,
        score=score,
        breakdown=breakdown,
        message="Analysis complete."
    )

# 4. HEALTH CHECK
@app.get("/")
def health_check():
    return {"status": "ok", "message": "FastAPI Server is running!"}