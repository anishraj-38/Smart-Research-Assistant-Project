// ===== DOM Load =====
document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.local.get(['researchNotes'], function(result) {
       if (result.researchNotes) {
        document.getElementById('notes').value = result.researchNotes;
       } 
    });

    document.getElementById('summarizeBtn').addEventListener('click', summarizeText);
    document.getElementById('suggestBtn').addEventListener('click', suggestText); // ✅ Added Suggest
    document.getElementById('saveNotesBtn').addEventListener('click', saveNotes);
});

// ===== Summarize =====
async function summarizeText() {
    await processSelectedText('summarize');
}

// ===== Suggest =====
async function suggestText() {
    await processSelectedText('suggest'); // ✅ Call suggest operation
}

// ===== Common Function for API Call =====
async function processSelectedText(operation) {
    try {
        const [tab] = await chrome.tabs.query({ active:true, currentWindow: true});
        const [{ result }] = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: () => window.getSelection().toString()
        });

        if (!result) {
            showResult('⚠️ Please select some text first');
            return;
        }

        const response = await fetch('http://localhost:8080/api/research/process', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: result, operation: operation })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const text = await response.text();

        // ✅ If Suggest, convert markdown bullets to HTML <ul><li>
        if (operation === 'suggest') {
            const formatted = text
                .replace(/^###.*$/gm, "<h3>Suggestions</h3>") // headers
                .replace(/^- (.*)$/gm, "<li>$1</li>");        // list items

            showResult(`<ul>${formatted}</ul>`);
        } else {
            showResult(text.replace(/\n/g, '<br>'));
        }

    } catch (error) {
        showResult('❌ Error: ' + error.message);
    }
}

// ===== Save Notes =====
async function saveNotes() {
    const notes = document.getElementById('notes').value;
    chrome.storage.local.set({ 'researchNotes': notes }, function() {
        alert('✅ Notes saved successfully');
    });
}

// ===== Show Result =====
function showResult(content) {
    document.getElementById('results').innerHTML = `
        <div class="result-item">
            <div class="result-content">${content}</div>
        </div>
    `;
}
