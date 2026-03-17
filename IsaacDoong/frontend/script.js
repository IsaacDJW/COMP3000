// frontend/script.js - FINAL VERSION WITH LOCAL STORAGE HISTORY

// --- CONFIGURATION & ELEMENTS ---
const form = document.getElementById('analysis-form');
const inputArea = document.getElementById('text-input');
const resultsContainer = document.getElementById('results-container');
const analyzeButton = document.getElementById('analyze-button');
const API_URL = 'http://127.0.0.1:8000/api/analyze'; 
const HISTORY_KEY = 'sentimentHistory'; // Key for browser's Local Storage


// --- 1. LOCAL STORAGE FUNCTIONS ---

// Function to load all saved history from the browser
function loadHistory() {
    // Get the data, or an empty array if no data exists
    const historyJson = localStorage.getItem(HISTORY_KEY);
    return historyJson ? JSON.parse(historyJson) : [];
}

// Function to save a new result to the browser's history
function saveResultToHistory(text, result) {
    const history = loadHistory();
    const newEntry = {
        id: Date.now(), // Unique ID based on timestamp
        timestamp: new Date().toLocaleTimeString(),
        text: text.substring(0, 50) + '...', // Save only a snippet of the text
        sentiment: result.sentiment,
        score: result.score
    };
    
    // Add new entry to the front of the array (most recent first)
    history.unshift(newEntry);
    
    // Limit history size to 10 entries for cleanup
    if (history.length > 10) {
        history.pop();
    }

    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    displayHistory(); // Update the history table immediately
}


// Function to display the history table
function displayHistory() {
    const history = loadHistory();
    const historyTable = document.getElementById('history-table');

    if (!historyTable) return; // Exit if the table container doesn't exist yet

    if (history.length === 0) {
        historyTable.innerHTML = '<p>No analysis history saved in this browser session.</p>';
        return;
    }
    
    // Build the table HTML dynamically
    let tableHtml = `
        <table class="history-table">
            <thead>
                <tr>
                    <th>Time</th>
                    <th>Snippet</th>
                    <th>Result</th>
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
                <td class="${color}"><strong>${entry.sentiment.toUpperCase()}</strong></td>
                <td>${(entry.score * 100).toFixed(1)}%</td>
            </tr>
        `;
    });

    tableHtml += `</tbody></table>`;
    historyTable.innerHTML = tableHtml;
}


// --- 2. API CALL FUNCTION (No Change) ---
async function analyzeSentiment(text) {
    // ... (Your original analyzeSentiment code remains here)
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: text })
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Analysis failed:", error);
        return { sentiment: "Error", score: 0, message: "Could not connect to the API." };
    }
}


// --- 3. DISPLAY RESULT (MODIFIED TO SAVE HISTORY) ---
function displayResult(result, originalText) { // Added originalText parameter
    let colorClass = 'neutral';
    if (result.sentiment.toLowerCase().includes('positive')) {
        colorClass = 'alert-success'; 
    } else if (result.sentiment.toLowerCase().includes('negative')) {
        colorClass = 'alert-danger'; 
    }

    // Save result to Local Storage only if it was a successful prediction
    if (result.sentiment !== 'Error') {
        saveResultToHistory(originalText, result);
    }
    
    resultsContainer.innerHTML = `
        <div class="${colorClass}">
            <h4>Sentiment Result: <span>${result.sentiment.toUpperCase()}</span></h4>
            <p>Confidence Score: <strong>${(result.score * 100).toFixed(2)}%</strong></p>
            <p>API Message: ${result.message || 'Analysis complete.'}</p>
        </div>
    `;
    
    document.getElementById('results-section').scrollIntoView({ behavior: 'smooth' });
}


// --- 4. EVENT LISTENER (MODIFIED TO PASS TEXT) ---
form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const userText = inputArea.value.trim();

    if (userText.length === 0) {
        resultsContainer.innerHTML = '<p class="text-warning">Please enter some text to analyze.</p>';
        return;
    }
    
    // START: Show loading state
    resultsContainer.innerHTML = '<p>Analyzing sentiment... please wait.</p>';
    analyzeButton.value = "Analyzing...";
    analyzeButton.disabled = true;

    // Call the main analysis function
    const result = await analyzeSentiment(userText);
    
    // END: Re-enable button
    analyzeButton.value = "Analyze Sentiment";
    analyzeButton.disabled = false;

    // Display the result (Pass userText for history saving)
    displayResult(result, userText);
});


// --- 5. INITIALIZATION ---

// Initial message for the primary results container
resultsContainer.innerHTML = '<p>Enter text above and click Analyze to get started.</p>';

// Add a container for the history table below the main result box
const historyContainerHtml = `
    <div style="margin-top: 4em;">
        <h3>Recent History (Local Session)</h3>
        <div id="history-table" class="box" style="text-align: left; padding: 1.5em;">
            <p>Loading history...</p>
        </div>
    </div>
`;

// Insert the history container HTML into the results section content
const resultsSection = document.getElementById('results-section').querySelector('.content');
resultsSection.insertAdjacentHTML('beforeend', historyContainerHtml);

// Load and display history when the page loads
displayHistory();