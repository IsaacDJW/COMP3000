const form = document.getElementById('analysis-form');
const inputArea = document.getElementById('text-input');
const analyzeButton = document.getElementById('analyze-button');
const API_URL = 'http://127.0.0.1:8000/api/analyze'; 
const HISTORY_KEY = 'sentimentHistory';

// Functions
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
    if (history.length > 50) history.pop(); 
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    displayHistory();
}

// THE NEW CIRCLE CHART LOGIC
function updateGlobalChart() {
    const history = loadHistory();
    const counts = { positive: 0, neutral: 0, negative: 0 };

    history.forEach(entry => {
        const s = entry.sentiment.toLowerCase();
        if (s.includes('positive')) counts.positive++;
        else if (s.includes('negative')) counts.negative++;
        else counts.neutral++;
    });

    const ctx = document.getElementById('globalSentimentChart');
    if (!ctx) return;

    if (window.myGlobalChart) { window.myGlobalChart.destroy(); }

    window.myGlobalChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Positive', 'Neutral', 'Negative'],
            datasets: [{
                data: [counts.positive, counts.neutral, counts.negative],
                backgroundColor: ['#2ecc71', '#94a3b8', '#e74c3c'],
                borderWidth: 0
            }]
        },
        options: {
            cutout: '75%',
            plugins: { legend: { position: 'bottom' } }
        }
    });
}

function displayHistory() {
    const allHistory = loadHistory();
    const historyDiv = document.getElementById('history-table-mount');
    if (!historyDiv) return;

    if (allHistory.length === 0) {
        historyDiv.innerHTML = '<p class="placeholder-text">Your activity history is currently empty.</p>';
        return;
    }
    
    const tableHistory = allHistory.slice(0, 5);

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

    tableHistory.forEach(entry => {
        const sentiment = entry.sentiment.toLowerCase();
        let colorClass = 'sentiment-neutral'; 
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
    updateGlobalChart();
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
    saveResultToHistory(originalText, result);
    const analysisData = {
        text: originalText,
        sentiment: result.sentiment,
        score: result.score,
        breakdown: result.breakdown
    };
    sessionStorage.setItem('latestAnalysis', JSON.stringify(analysisData));
    setTimeout(() => { window.location.href = 'analysis.html'; }, 150);
}

// SAFETY HANDLER TO PREVENT CONNECTION ERRORS
async function handleManualClick() {
    const text = inputArea.value.trim();
    if (!text) return;
    
    analyzeButton.value = "Analyzing...";
    analyzeButton.disabled = true;

    try {
        const result = await analyzeSentiment(text);
        displayResult(result, text);
    } catch (error) {
        console.error("Error:", error);
        alert("Connection Error: Please ensure your FastAPI server is running.");
        analyzeButton.value = "Analyze Sentiment";
        analyzeButton.disabled = false;
    }
}

// Event Listener for the form
if (form) {
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        handleManualClick();
    });
}

window.onload = () => {
    displayHistory();
};