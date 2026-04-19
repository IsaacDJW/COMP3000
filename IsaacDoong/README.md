# Supervisor
Dr HaoYi Wang

# TextLens: Deep Learning Sentiment Analysis
TextLens is a high-performance web application designed to transform massive volumes of unstructured social media chatter into actionable emotional intelligence. By utilizing a fine-tuned DistilBERT transformer model, it provides real-time classification of text into Positive, Neutral and Negative sentiments with sub-second inference speeds.

# Business Vision & Goal
The primary goal of TextLens is to provide decision support for organizations and researchers overwhelmed by the velocity of online data. In today's digital landscape, our goal isn't just to classify text, but to transform unorganized public chatter into actionable data for decision-makers. TextLens serves to bridge the gap between massive online data and human understanding by providing a high-speed, scalable tool that translates thousands of opinions into clear emotional trends, allowing organizations to respond to public sentiment in real-time. By turning unstructured text into structured sentiment metrics, the platform transforms raw feedback into real-time emotional intelligence.

This strategic transformation of data empowers users across multiple critical domains:

1. Brand Reputation: Facilitating the real-time detection of public relations crises and shifts in audience sentiment to proactively protect brand equity.

2. Product Strategy: Streamlining the analysis of customer reviews and feedback to pinpoint specific feature complaints, driving data-driven product improvements.

3. Public Policy & Research: Enabling researchers and social media users to comprehend community reactions to government initiatives and complex social trends at scale.

4. Operational Efficiency: Reducing the time required to categorize feedback from days to sub-seconds, allowing Customer Success Teams to react to the customer feedback instantly.

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