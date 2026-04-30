import pandas as pd
import matplotlib.pyplot as plt
from datasets import Dataset, DatasetDict
from sklearn.model_selection import train_test_split
from transformers import (
    AutoTokenizer,
    AutoModelForSequenceClassification,
    Trainer,
    TrainingArguments,
    EarlyStoppingCallback,
    AutoConfig
)
from sklearn.preprocessing import LabelEncoder
import torch
import numpy as np
from sklearn.metrics import accuracy_score, f1_score, classification_report
import re

# Constants
DATA_FILE_PATH = '/content/test.csv'
MODEL_NAME = 'distilbert-base-uncased'
OUTPUT_DIR = './model/final_bert_model'
RANDOM_SEED = 42

# Load and Prepare Data
def clean_text(text):
    if isinstance(text, str):
        text = re.sub(r'http\S+|www\S+|https\S+', '', text, flags=re.MULTILINE)
        text = re.sub(r'@\w+', '', text)
        text = re.sub(r"[^\w\s\.\,\!\?\-']+", '', text)
        return re.sub(r'\s+', ' ', text).lower().strip()
    return ""

df = pd.read_csv(DATA_FILE_PATH, encoding='latin1')
df = df[['text', 'sentiment']].dropna() if 'text' in df.columns else df[['textID', 'sentiment']].dropna().rename(columns={'textID': 'text'})
df['text'] = df['text'].apply(clean_text)

label_encoder = LabelEncoder()
df['label'] = label_encoder.fit_transform(df['sentiment'])
num_labels = len(label_encoder.classes_)
target_names = label_encoder.classes_.tolist()

train_df, eval_df = train_test_split(df, test_size=0.1, stratify=df['label'], random_state=RANDOM_SEED)
raw_datasets = DatasetDict({
    'train': Dataset.from_pandas(train_df[['text', 'label']]),
    'eval': Dataset.from_pandas(eval_df[['text', 'label']])
})

# Tokenization
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
tokenized_datasets = raw_datasets.map(lambda x: tokenizer(x['text'], truncation=True, padding='max_length', max_length=128), batched=True)
tokenized_datasets.set_format("torch")

# Model Configuration
config = AutoConfig.from_pretrained(MODEL_NAME, num_labels=num_labels)
config.hidden_dropout_prob = 0.3
config.attention_probs_dropout_prob = 0.3
model = AutoModelForSequenceClassification.from_pretrained(MODEL_NAME, config=config)

# Class Weights
train_labels = np.array(tokenized_datasets["train"]['label'])
weights = torch.tensor(len(train_labels) / (num_labels * np.bincount(train_labels)), dtype=torch.float)

class CustomTrainer(Trainer):
    def compute_loss(self, model, inputs, return_outputs=False, **kwargs):
        labels = inputs.pop("labels")
        outputs = model(**inputs)
        loss_fct = torch.nn.CrossEntropyLoss(weight=weights.to(model.device), label_smoothing=0.12)
        loss = loss_fct(outputs.logits.view(-1, self.model.config.num_labels), labels.view(-1))
        return (loss, outputs) if return_outputs else loss

def compute_metrics(p):
    preds = np.argmax(p.predictions, axis=1)
    return {
        'accuracy': accuracy_score(p.label_ids, preds),
        'f1': f1_score(p.label_ids, preds, average='weighted'),
    }

# Final Balanced Training Arguments
training_args = TrainingArguments(
    output_dir=OUTPUT_DIR,
    num_train_epochs=15,
    per_device_train_batch_size=64,   # Keeping high for T4 GPU utilization
    per_device_eval_batch_size=64,
    learning_rate=2e-6,               # Lowered further to stop the "bouncing"
    weight_decay=0.25,                # Increased to bring lines closer together
    lr_scheduler_type="cosine",
    warmup_ratio=0.2,                # Longer warmup for ultra-stability
    eval_strategy="epoch",
    save_strategy="epoch",
    logging_steps=5,
    save_total_limit=1,
    load_best_model_at_end=True,
    metric_for_best_model="f1",
    greater_is_better=True,
    seed=RANDOM_SEED,
    report_to="none"
)

trainer = CustomTrainer(
    model=model,
    args=training_args,
    train_dataset=tokenized_datasets["train"],
    eval_dataset=tokenized_datasets["eval"],
    compute_metrics=compute_metrics,
    callbacks=[EarlyStoppingCallback(early_stopping_patience=2)] # Stop faster for a cleaner curve
)

trainer.train()

# Plotting
history = trainer.state.log_history
train_loss = {int(round(x['epoch'])): x['loss'] for x in history if 'loss' in x}
val_loss = {int(round(x['epoch'])): x['eval_loss'] for x in history if 'eval_loss' in x}
epochs = sorted(list(set(train_loss.keys()) & set(val_loss.keys())))

plt.figure(figsize=(10, 6))
plt.plot(epochs, [train_loss[e] for e in epochs], label='Training Loss', color='blue', marker='o')
plt.plot(epochs, [val_loss[e] for e in epochs], label='Validation Loss', color='orange', marker='o')
plt.title('Final Optimized Learning Curve'); plt.legend(); plt.grid(True); plt.show()

# Detailed Scoring
predictions = trainer.predict(tokenized_datasets["eval"])
print("\n--- DETAILED CLASSIFICATION REPORT ---")
print(classification_report(predictions.label_ids, np.argmax(predictions.predictions, axis=1), target_names=target_names))