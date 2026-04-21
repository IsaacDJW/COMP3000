const form = document.getElementById('analysis-form');
const inputArea = document.getElementById('text-input');
const resultsContainer = document.getElementById('results-container');
const analyzeButton = document.getElementById('analyze-button');
const API_URL = 'http://127.0.0.1:8000/api/analyze'; 
const HISTORY_KEY = 'sentimentHistory';

// --- Functions ---
function loadHistory() {
    const historyJson = localStorage.getItem(HISTORY_KEY);
    return historyJson ? JSON.parse(historyJson) : [];
}

function saveResultToHistory(text, result) {
    const history = loadHistory();
    const newEntry = {
        id: Date.now(),
        timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        text: text.length > 50 ? text.substring(0, 47) + '...' : text,
        sentiment: result.sentiment,
        score: result.score
    };
    history.unshift(newEntry);
    if (history.length > 5) history.pop();
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    displayHistory();
}

function displayHistory() {
    const history = loadHistory();
    const historyDiv = document.getElementById('history-table-mount');
    if (!historyDiv) return;

    if (history.length === 0) {
        historyDiv.innerHTML = '<p class="placeholder-text">Your activity history is currently empty.</p>';
        return;
    }
    
    let tableHtml = `
        <table class="history-table">
            <thead>
                <tr>
                    <th>Time</th>
                    <th>Text Snippet</th>
                    <th>Sentiment</th>
                    <th>Confidence</th>
                </tr>
            </thead>
            <tbody>
    `;

    history.forEach(entry => {
        const sentiment = entry.sentiment.toLowerCase();
        let colorClass = 'sentiment-neutral'; // Default
        if (sentiment.includes('positive')) colorClass = 'sentiment-positive';
        if (sentiment.includes('negative')) colorClass = 'sentiment-negative';

        tableHtml += `
            <tr>
                <td>${entry.timestamp}</td>
                <td style="color: #64748b; font-style: italic;">"${entry.text}"</td>
                <td class="${colorClass}" style="font-weight:800;">${entry.sentiment.toUpperCase()}</td>
                <td>${(entry.score * 100).toFixed(0)}%</td>
            </tr>
        `;
    });

    tableHtml += `</tbody></table>`;
    historyDiv.innerHTML = tableHtml;
}

async function analyzeSentiment(text) {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text })
    });
    
    if (!response.ok) { throw new Error("API Connection Failed"); }
    return await response.json();
}

function displayResult(result, originalText) {
    // 1. Save to History
    saveResultToHistory(originalText, result);

    // 2. Prepare Data for redirect
    const analysisData = {
        text: originalText,
        sentiment: result.sentiment,
        score: result.score,
        breakdown: result.breakdown
    };
    
    sessionStorage.setItem('latestAnalysis', JSON.stringify(analysisData));

    // 3. Redirect to the Dashboard
    setTimeout(() => {
        window.location.href = 'analysis.html';
    }, 150);
}

// --- Events ---
if (form) {
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const userText = inputArea.value.trim();
        if (userText.length === 0) return;
        
        // UI Loading State
        analyzeButton.value = "Analyzing...";
        analyzeButton.disabled = true;

        try {
            const result = await analyzeSentiment(userText);
            displayResult(result, userText);
        } catch (error) {
            console.error("Error:", error);
            alert("Connection Error: Please ensure your FastAPI server is running on port 8000.");
            
            // Reset Button
            analyzeButton.value = "Analyze Sentiment";
            analyzeButton.disabled = false;
        }
    });
}

// --- Initialization ---
window.onload = () => {
    const historyContainer = document.getElementById('history-container');
    if (historyContainer) {
        historyContainer.innerHTML = `
            <div style="margin-top: 2em; padding-bottom: 2rem;">
                <h3 style="font-weight: 800; margin-bottom: 1.5rem; color: #1e293b;">Recent Activity</h3>
                <div id="history-table-mount"></div>
            </div>
        `;
    }
    displayHistory();
};