from pydantic import BaseModel
from typing import Optional, List, Dict

class TextIn(BaseModel):
    text: str

class SentimentOut(BaseModel):
    sentiment: str
    score: float
    breakdown: Dict[str, float] 
    message: Optional[str] = None