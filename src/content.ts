// Content script для отслеживания выделения текста
// Отправляет выделенный текст в background script для обновления контекстного меню

let lastSelection = "";

// Отслеживаем выделение текста при отпускании кнопки мыши
document.addEventListener("mouseup", () => {
    const selection = window.getSelection()?.toString().trim();
    
    if (selection && selection.length > 0 && selection !== lastSelection) {
        lastSelection = selection;
        
        // Отправляем выделенный текст в background script
        chrome.runtime.sendMessage(
            { type: "SELECTION_CHANGED", text: selection },
            (response) => {
                if (chrome.runtime.lastError) {
                    // Игнорируем ошибки, если background script не готов
                    console.debug("[CardsExtension] Content script:", chrome.runtime.lastError.message);
                }
            }
        );
    }
});

// Также отслеживаем выделение через клавиатуру
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

