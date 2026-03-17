#!/bin/bash
echo "Starting Sentiment Analysis API Server..."
echo ""
echo "Make sure you have installed all requirements:"
echo "  pip install -r requirements.txt"
echo ""
echo "Starting server on http://127.0.0.1:8000"
echo "Press Ctrl+C to stop the server"
echo ""

python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000

