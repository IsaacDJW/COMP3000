# Supervisor
Dr HaoYi Wang

# TextLens: Deep Learning Sentiment Analysis
TextLens is a high-performance web application designed to transform massive volumes of unstructured social media chatter into actionable emotional intelligence. By utilizing a fine-tuned DistilBERT transformer model, it provides real-time classification of text into Positive, Neutral and Negative sentiments with sub-second inference speeds.

# Business Vision & Goal
The primary goal of TextLens is to provide Decision Support for organizations and researchers overwhelmed by the velocity of online data. By turning unstructured text into structured sentiment metrics, TextLens transforms raw feedback into real-time emotional intelligence.

Brand Reputation: Real-time detection of public relations crises and shifts in audience sentiment to protect brand equity.

Product Strategy: Analyzing customer reviews and feedback to identify specific feature complaints and drive data-driven product decisions.

Public Policy & Research: Helping researchers and social media users understand community reactions to government initiatives and social trends at scale.

Operational Efficiency: Reducing the time to categorize feedback from days to seconds, allowing Customer Success Teams to react to the voice of the customer instantly.

# Technical Stack
Model Architecture: DistilBERT (distilbert-base-uncased).

Backend: FastAPI for high-concurrency and fast API response times.

Environment: Developed and trained using Google Colab with NVIDIA T4 GPU acceleration.

# Model Performance & Optimization
The model underwent extensive "Trial and Error" fine-tuning to reach a stable state that avoids overfitting while maintaining high accuracy.

Final Accuracy: ~75%

Final Weighted F1-Score: 0.7455

Regularization Techniques:

    Label Smoothing: (0.1) to improve generalization across noisy social media text.

    Early Stopping: Monitored validation loss to prevent memorization of training data.

    Cosine Learning Rate Decay: Ensured smooth convergence and prevented "bouncing" in the training loss.


# Project Structure
/model: Contains the saved DistilBERT weights and configuration.

/backend: FastAPI implementation for text inference.

test.csv: The cleaned dataset used for evaluation.

requirements.txt: Python dependencies.