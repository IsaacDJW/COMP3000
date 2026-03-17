# backend/schemas.py

from pydantic import BaseModel
from typing import Optional

# Defines the structure of the data the API *receives* from the frontend
class TextIn(BaseModel):
    """The text input sent from the frontend/script.js."""
    text: str # Must be 'text' because that's what your script.js sends

# Defines the structure of the data the API *sends* back to the frontend
class SentimentOut(BaseModel):
    """The sentiment prediction returned to the frontend."""
    sentiment: str # e.g., "positive", "negative" (The label from your model)
    score: float   # e.g., 0.95 (confidence score)
    message: Optional[str] = None # Status message