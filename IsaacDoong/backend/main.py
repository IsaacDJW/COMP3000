from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .schemas import TextIn, SentimentOut
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from scipy.special import softmax
import torch
import re
import numpy as np

# --- CONFIGURATION ---
# NOTE: Ensure this path is correct relative to where you run the FastAPI server
MODEL_PATH_DIR = 'model/final_bert_model'
sentiment_model = None
tokenizer = None

# CRITICAL: This MUST match the LabelEncoder's alphabetical order
# used in bert_fine_tune.py (0: negative, 1: neutral, 2: positive)

LABEL_MAP_FIXED = {

    0: 'negative',
    1: 'neutral',
    2: 'positive'

}



app = FastAPI(title="Sentiment Analysis Deep Learning API")

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



# -----------------------------------------------------------

# 1. PREPROCESSING FUNCTION (Must match fine-tuning script)

# -----------------------------------------------------------



def clean_text(text):

    """Clean text by removing URLs/mentions, keeping most punctuation and emojis."""

    if isinstance(text, str):

        # Remove URLs
        text = re.sub(r'http\S+|www\S+|https\S+', '', text, flags=re.MULTILINE)

        # Remove mentions
        text = re.sub(r'@\w+', '', text)

        # Keep letters, numbers, basic punctuation, and emojis (general approach)
        text = re.sub(r"[^\w\s\.\,\!\?\-']+", '', text)

        # Replace multiple spaces with a single one
        text = re.sub(r'\s+', ' ', text)

        text = text.lower().strip()

        return text

    return ""



# -----------------------------------------------------------

# 2. MODEL LOADING (Runs ONCE when the server starts)

# -----------------------------------------------------------



@app.on_event("startup")

def load_assets():

    """Load the trained DistilBERT model and tokenizer from the disk."""

    global sentiment_model, tokenizer

    try:

        # Load assets saved by the fine-tuning script
        tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH_DIR)
        sentiment_model = AutoModelForSequenceClassification.from_pretrained(MODEL_PATH_DIR)
        sentiment_model.eval()

        print("INFO: DistilBERT Model loaded successfully.")

    except Exception as e:

        print(f"ERROR: Failed to load DistilBERT model from {MODEL_PATH_DIR}. Reason: {e}")

        # Raising an error prevents the server from starting without the model
        raise RuntimeError("BERT Model files not found. Run the fine-tuning script first and check path.")



# -----------------------------------------------------------

# 3. API ENDPOINT (The Core Prediction Logic)

# -----------------------------------------------------------



@app.post("/api/analyze", response_model=SentimentOut)

def analyze_sentiment(data: TextIn):

    """

    Receives text, runs the trained DistilBERT model prediction, and returns result.

    """

   

    if sentiment_model is None or tokenizer is None:

        return SentimentOut(sentiment="Error", score=0.0, message="Model not loaded on server.")



    # Tokenize the input text
    clean_input = clean_text(data.text)
    encoded_input = tokenizer.encode_plus(

        clean_input,

        return_tensors='pt',

        truncation=True,

        padding='max_length',

        max_length=128

    )

   

    # Prediction

    with torch.no_grad():

        output = sentiment_model(**encoded_input)

   

    # Extract raw logits (pre-softmax scores)

    scores = output.logits[0].detach().numpy()

    # Convert logits to probabilities
    probabilities = softmax(scores)

    # NEW: Create a dictionary of all scores for the Analysis Dashboard
    breakdown = {
        LABEL_MAP_FIXED[i]: float(probabilities[i]) 
        for i in range(len(probabilities))
    }

    max_index = np.argmax(probabilities)
    prediction = LABEL_MAP_FIXED.get(max_index, f"LABEL_{max_index}")
    score = probabilities[max_index]

    return SentimentOut(
        sentiment=prediction,
        score=float(score),
        breakdown=breakdown, # <--- Add this!
        message="Analysis complete."
    )



# -----------------------------------------------

# 4. Simple Health Check Route

# -----------------------------------------------

@app.get("/")

def health_check():
    """A route to check if the API server is running."""
    return {"status": "ok", "message": "FastAPI Server is running!"}