# How to Start the Sentiment Analysis Application

## Prerequisites
1. Make sure you have Python installed (Python 3.8 or higher)
2. Install all required packages:
   ```bash
   pip install -r requirements.txt
   ```
3. Make sure the model has been trained (the model files should exist):
   ```bash
   python model/train_model.py
   ```

## Step 1: Start the Backend API Server

### Option A: Using the startup script (Windows)
Double-click `start_server.bat` or run:
```bash
start_server.bat
```

### Option B: Using the startup script (Mac/Linux)
```bash
chmod +x start_server.sh
./start_server.sh
```

### Option C: Manual start (Any OS)
```bash
python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```

The server will start on: **http://127.0.0.1:8000**

You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     ML Models loaded successfully.
```

## Step 2: Open the Frontend

### Option A: Open directly in browser
1. Navigate to the `frontend` folder
2. Double-click `index.html` to open it in your default browser

### Option B: Using a local web server (Recommended)
If you have Python installed, you can serve the frontend:

```bash
cd frontend
python -m http.server 5500
```

Then open: **http://127.0.0.1:5500** in your browser

### Option C: Using VS Code Live Server
1. Install the "Live Server" extension in VS Code
2. Right-click on `frontend/index.html`
3. Select "Open with Live Server"

## Step 3: Test the Application

1. Make sure the backend server is running (Step 1)
2. Open the frontend in your browser (Step 2)
3. Enter some text in the text area
4. Click "Analyze Sentiment"
5. Check the results below

## Troubleshooting

### Server won't start
- Check if port 8000 is already in use
- Make sure all dependencies are installed: `pip install -r requirements.txt`
- Verify the model files exist: `model/sentiment_model.pkl` and `model/tfidf_vectorizer.pkl`

### Frontend can't connect to API
- Make sure the backend server is running on http://127.0.0.1:8000
- Check the browser console for errors (F12)
- Verify CORS is enabled in the backend (it should be)

### Model not found error
- Run the training script: `python model/train_model.py`
- Make sure you're running commands from the project root directory

## Quick Test

Test if the API is working:
```bash
curl http://127.0.0.1:8000/
```

You should see: `{"status":"ok","message":"FastAPI Server is running!"}`

Test the sentiment analysis:
```bash
curl -X POST "http://127.0.0.1:8000/api/analyze" -H "Content-Type: application/json" -d "{\"text\": \"I love this product!\"}"
```

