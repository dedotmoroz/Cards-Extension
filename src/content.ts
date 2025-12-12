// Content script for tracking text selection
// Sends selected text to background script for context menu update

let lastSelection = "";

// Track text selection on mouse button release
document.addEventListener("mouseup", () => {
    const selection = window.getSelection()?.toString().trim();
    
    if (selection && selection.length > 0 && selection !== lastSelection) {
        lastSelection = selection;
        
        // Send selected text to background script
        chrome.runtime.sendMessage(
            { type: "SELECTION_CHANGED", text: selection },
            (response) => {
                if (chrome.runtime.lastError) {
                    // Ignore errors if background script is not ready
                    console.debug("[CardsExtension] Content script:", chrome.runtime.lastError.message);
                }
            }
        );
    }
});

// Also track selection via keyboard
document.addEventListener("keyup", () => {
    const selection = window.getSelection()?.toString().trim();
    
    if (selection && selection.length > 0 && selection !== lastSelection) {
        lastSelection = selection;
        
        chrome.runtime.sendMessage(
            { type: "SELECTION_CHANGED", text: selection },
            (response) => {
                if (chrome.runtime.lastError) {
                    console.debug("[CardsExtension] Content script:", chrome.runtime.lastError.message);
                }
            }
        );
    }
});

