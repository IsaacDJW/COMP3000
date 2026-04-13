const form = document.getElementById('analysis-form');
const inputArea = document.getElementById('text-input');
const resultsContainer = document.getElementById('results-container');
const analyzeButton = document.getElementById('analyze-button');
const API_URL = 'http://127.0.0.1:8000/api/analyze'; 
const HISTORY_KEY = 'sentimentHistory';

// --- 1. LOCAL STORAGE ---
function loadHistory() {
    const historyJson = localStorage.getItem(HISTORY_KEY);
    return historyJson ? JSON.parse(historyJson) : [];
}

function saveResultToHistory(text, result) {
    const history = loadHistory();
    const newEntry = {
        id: Date.now(),
        timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        text: text.substring(0, 40) + '...',
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
    const historyTable = document.getElementById('history-table');
    if (!historyTable) return;

    if (history.length === 0) {
        historyTable.innerHTML = '<p>No recent analysis found.</p>';
        return;
    }
    
    let tableHtml = `
        <table class="history-table">
            <thead>
                <tr>
                    <th>Time</th>
                    <th>Text</th>
                    <th>Sentiment</th>
                    <th>Score</th>
                </tr>
            </thead>
            <tbody>
    `;

    history.forEach(entry => {
        let color = entry.sentiment.toLowerCase() === 'positive' ? 'text-success' : 'text-danger';
        tableHtml += `
            <tr>
                <td>${entry.timestamp}</td>
                <td>${entry.text}</td>
                <td class="${color}">${entry.sentiment.toUpperCase()}</td>
                <td>${(entry.score * 100).toFixed(0)}%</td>
            </tr>
        `;
    });

    tableHtml += `</tbody></table>`;
    historyTable.innerHTML = tableHtml;
}

// --- 2. API CALL ---
async function analyzeSentiment(text) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: text })
        });
        return await response.json();
    } catch (error) {
        return { sentiment: "Error", score: 0, message: "Connection to AI server failed." };
    }
}

// --- 3. DISPLAY RESULT WITH ANIMATION ---
function displayResult(result, originalText) {
    let type = result.sentiment.toLowerCase();
    let isPos = type.includes('positive');
    let colorClass = isPos ? 'alert-success' : 'alert-danger';
    let fillClass = isPos ? 'fill-success' : 'fill-danger';
    let scorePercent = (result.score * 100).toFixed(1);

    if (result.sentiment !== 'Error') {
        saveResultToHistory(originalText, result);
    }
    
    resultsContainer.innerHTML = `
        <div class="${colorClass} fade-in">
            <h4>Sentiment: <strong>${result.sentiment.toUpperCase()}</strong></h4>
            <div class="confidence-meter">
                <div class="confidence-fill ${fillClass}" id="bar-fill"></div>
            </div>
            <p>Confidence: <strong>${scorePercent}%</strong></p>
            <small>${result.message || 'Analysis complete.'}</small>
        </div>
    `;
    
    // Trigger the bar animation after a tiny delay
    setTimeout(() => {
        const bar = document.getElementById('bar-fill');
        if(bar) bar.style.width = scorePercent + '%';
    }, 100);
    
    document.getElementById('results-section').scrollIntoView({ behavior: 'smooth' });
}

// --- 4. EVENT LISTENER ---
form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const userText = inputArea.value.trim();

    if (userText.length === 0) return;
    
    resultsContainer.innerHTML = '<p class="loading-pulse">Scanning text emotion...</p>';
    analyzeButton.value = "Analyzing...";
    analyzeButton.disabled = true;

    const result = await analyzeSentiment(userText);
    
    analyzeButton.value = "Analyze Sentiment";
    analyzeButton.disabled = false;
    displayResult(result, userText);
});

// --- 5. INITIALIZATION ---
window.onload = () => {
    const resultsSection = document.getElementById('results-section').querySelector('.content');
    const historyContainerHtml = `
        <div style="margin-top: 3em;" class="fade-in">
            <h3 style="font-size: 1.2em; margin-bottom: 1em;">Recent Activity</h3>
            <div id="history-table"></div>
        </div>
    `;
    resultsSection.insertAdjacentHTML('beforeend', historyContainerHtml);
    displayHistory();
};