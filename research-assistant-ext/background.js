// Set up side panel behavior
chrome.runtime.onInstalled.addListener(() => {
  console.log('Research Assistant installed');
});

// Open side panel when extension icon is clicked
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId });
});

// Listen for messages from the side panel or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getSummary') {
    // Handle summarization request
    handleSummarizationRequest(request.data)
      .then(result => sendResponse({ success: true, data: result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep the message channel open for async response
  }
});

// Placeholder function for handling summarization
async function handleSummarizationRequest(data) {
  // TODO: Implement your actual API call here
  // This could be a call to OpenAI, Claude, or your custom backend
  
  // Example structure:
  // const response = await fetch('YOUR_API_ENDPOINT', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(data)
  // });
  // return await response.json();
  
  return {
    success: true,
    summary: 'Placeholder summary'
  };
}