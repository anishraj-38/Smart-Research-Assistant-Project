// DOM Elements
const summarizeBtn = document.getElementById('summarizeBtn');
const saveNotesBtn = document.getElementById('saveNotesBtn');
const notesTextarea = document.getElementById('notesTextarea');
const resultsSection = document.getElementById('resultsSection');
const resultsContainer = document.getElementById('resultsContainer');
const successAlert = document.getElementById('successAlert');
const errorAlert = document.getElementById('errorAlert');
const successMessage = document.getElementById('successMessage');
const errorMessage = document.getElementById('errorMessage');
const darkModeToggle = document.getElementById('darkModeToggle');

// API Configuration
const API_BASE_URL = 'http://localhost:8080';

// Load saved notes and dark mode preference on startup
document.addEventListener('DOMContentLoaded', () => {
  loadNotes();
  loadDarkModePreference();
});

// Event Listeners
summarizeBtn.addEventListener('click', handleSummarize);
saveNotesBtn.addEventListener('click', handleSaveNotes);
darkModeToggle.addEventListener('click', toggleDarkMode);

// Dark Mode Toggle Function
function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
  const isDarkMode = document.body.classList.contains('dark-mode');
  
  // Save preference to Chrome storage
  chrome.storage.local.set({ darkMode: isDarkMode });
  
  // Update toggle button icon
  updateToggleIcon(isDarkMode);
}

// Update toggle button icon
function updateToggleIcon(isDarkMode) {
  const slider = darkModeToggle.querySelector('.toggle-slider');
  slider.textContent = isDarkMode ? '🌙' : '☀️';
}

// Load dark mode preference
function loadDarkModePreference() {
  chrome.storage.local.get(['darkMode'], (result) => {
    if (result.darkMode) {
      document.body.classList.add('dark-mode');
      updateToggleIcon(true);
    } else {
      updateToggleIcon(false);
    }
  });
}

// Handle Summarize button click
async function handleSummarize() {
  try {
    // Disable button and show loading state
    summarizeBtn.disabled = true;
    summarizeBtn.innerHTML = '<span><div class="loading-spinner"></div>Summarizing...</span>';
    
    // Hide any previous alerts
    hideAlerts();
    
    // Get the active tab and extract text
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab) {
      throw new Error('No active tab found');
    }
    
    // Check if the URL is accessible
    const url = tab.url || '';
    const restrictedUrls = ['chrome://', 'chrome-extension://', 'edge://', 'about:', 'view-source:'];
    const isRestricted = restrictedUrls.some(prefix => url.startsWith(prefix));
    
    if (isRestricted) {
      throw new Error('Cannot access this page. Please navigate to a regular web page (http:// or https://).');
    }
    
    // Execute script to get selected text or entire page content
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const selected = window.getSelection().toString();
        return selected || document.body.innerText;
      }
    });
    
    if (!result || result.trim() === '') {
      throw new Error('No content found. Please select some text or ensure the page has content.');
    }
    
    // Show processing message
    showProcessingResult();
    
    // Call your backend API
    const response = await fetch(`${API_BASE_URL}/api/research/process`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        content: result, 
        operation: 'summarize'
      })
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} - ${response.statusText}`);
    }
    
    const text = await response.text();
    
    // Display the summary result
    displaySummaryResult(text);
    
    // Show success message
    showSuccess('Summary generated successfully!');
    
  } catch (error) {
    console.error('Error:', error);
    showError(error.message || 'Failed to generate summary');
    
    // Show error in results section
    showErrorResult(error.message);
    
  } finally {
    // Re-enable button
    summarizeBtn.disabled = false;
    summarizeBtn.innerHTML = '<span>✨ Summarize</span>';
  }
}

// Show processing message in results
function showProcessingResult() {
  resultsContainer.innerHTML = `
    <div class="result-card processing">
      <div class="result-title">⏳ Processing...</div>
      <div class="result-content">Analyzing and summarizing the content. This may take a few moments...</div>
    </div>
  `;
  resultsSection.classList.add('active');
}

// Display summary result
function displaySummaryResult(text) {
  // Clear previous results
  resultsContainer.innerHTML = '';
  
  // Format the text (convert newlines to <br> tags)
  const formattedText = text.replace(/\n/g, '<br>');
  
  // Create result card
  const card = document.createElement('div');
  card.className = 'result-card';
  card.innerHTML = `
    <div class="result-title">📊 Summary</div>
    <div class="result-content">${formattedText}</div>
  `;
  
  resultsContainer.appendChild(card);
  resultsSection.classList.add('active');
}

// Show error in results section
function showErrorResult(errorMsg) {
  resultsContainer.innerHTML = '';
  
  const card = document.createElement('div');
  card.className = 'result-card error-card';
  card.innerHTML = `
    <div class="result-title">❌ Error</div>
    <div class="result-content">${errorMsg}</div>
  `;
  
  resultsContainer.appendChild(card);
  resultsSection.classList.add('active');
}

// Handle Save Notes button click
async function handleSaveNotes() {
  const notes = notesTextarea.value.trim();
  
  if (!notes) {
    showError('Please enter some notes before saving');
    return;
  }
  
  // Disable button temporarily
  saveNotesBtn.disabled = true;
  saveNotesBtn.innerHTML = '<span><div class="loading-spinner"></div>Saving...</span>';
  
  try {
    // Save to Chrome storage
    await chrome.storage.local.set({ researchNotes: notes });
    
    showSuccess('✅ Notes saved successfully!');
    
    // Add a subtle animation to the textarea
    notesTextarea.style.transform = 'scale(0.98)';
    setTimeout(() => {
      notesTextarea.style.transform = 'scale(1)';
    }, 200);
    
  } catch (error) {
    showError('Failed to save notes');
    console.error(error);
  } finally {
    // Re-enable button
    saveNotesBtn.disabled = false;
    saveNotesBtn.innerHTML = '<span>💾 Save Notes</span>';
  }
}

// Load saved notes
function loadNotes() {
  chrome.storage.local.get(['researchNotes'], (result) => {
    if (result.researchNotes) {
      notesTextarea.value = result.researchNotes;
    }
  });
}

// Show success alert
function showSuccess(message) {
  hideAlerts();
  successMessage.textContent = message;
  successAlert.classList.add('show');
  
  // Auto-hide after 3 seconds
  setTimeout(() => {
    successAlert.classList.remove('show');
  }, 3000);
}

// Show error alert
function showError(message) {
  hideAlerts();
  errorMessage.textContent = message;
  errorAlert.classList.add('show');
  
  // Auto-hide after 4 seconds
  setTimeout(() => {
    errorAlert.classList.remove('show');
  }, 4000);
}

// Hide all alerts
function hideAlerts() {
  successAlert.classList.remove('show');
  errorAlert.classList.remove('show');
}

// Add smooth transition to textarea
notesTextarea.style.transition = 'transform 0.2s ease';

// Optional: Auto-save notes as user types (debounced)
let saveTimeout;
notesTextarea.addEventListener('input', () => {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    const notes = notesTextarea.value.trim();
    if (notes) {
      chrome.storage.local.set({ researchNotes: notes });
    }
  }, 1000);
});