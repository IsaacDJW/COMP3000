import torch
import numpy as np

def get_prediction_analysis(model, tokenizer, text):
    inputs = tokenizer(text, return_tensors="pt", truncation=True, padding=True, max_length=128)
    inputs = {k: v.to(model.device) for k, v in inputs.items()}
    
    with torch.no_grad():
        outputs = model(**inputs)
        # Apply Softmax to get percentages (0.0 to 1.0)
        probabilities = torch.nn.functional.softmax(outputs.logits, dim=-1).cpu().numpy()
    
    labels = ['negative', 'neutral', 'positive'] # Ensure this matches your LabelEncoder order
    breakdown = {labels[i]: float(probabilities[i]) for i in range(len(labels))}
    
    # Get the winning label
    best_index = np.argmax(probabilities)
    
    return {
        "sentiment": labels[best_index],
        "score": float(probabilities[best_index]),
        "breakdown": breakdown
    }