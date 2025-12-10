// const API_BASE_URL = "http://localhost:3000";
const API_BASE_URL = "https://kotcat.com";

type Settings = {
    apiToken: string;
    folderId: string;
};

// Обновляем текст меню с выделенным словом перед показом
interface OnShownInfo {
    menuIds: number | string | Array<number | string>;
    selectionText?: string;
    editable: boolean;
    pageUrl?: string;
}

function updateMenuTitle(selectionText: string | undefined) {
    if (selectionText && selectionText.trim()) {
        // Ограничиваем длину текста для удобства отображения
        let displayText = selectionText.trim();
        const maxLength = 30;
        if (displayText.length > maxLength) {
            displayText = displayText.slice(0, maxLength) + "…";
        }
        chrome.contextMenus.update("add-to-vocab", {
            title: `«${displayText}» - Добавить в словарь`,
        });
    } else {
        chrome.contextMenus.update("add-to-vocab", {
            title: "Добавить в словарь",
        });
    }
}

// Создаем меню при установке
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "add-to-vocab",
        title: "Добавить в словарь",
        contexts: ["selection"],
    });
    
    // Пытаемся зарегистрировать onShown сразу после создания меню
    setupOnShownListener();
});

// Также пытаемся зарегистрировать при старте service worker
setupOnShownListener();

// Обрабатываем сообщения от content script для обновления меню
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "SELECTION_CHANGED" && message.text) {
        console.log("[CardsExtension] Selection changed from content script:", message.text);
        updateMenuTitle(message.text);
        sendResponse({ success: true });
    }
    return true; // Позволяем асинхронную отправку ответа
});

function setupOnShownListener() {
    // Пытаемся использовать onShown (доступен в Chrome 88+)
    // Используем прямой доступ через any, так как типы могут быть неполными
    const contextMenusAny = chrome.contextMenus as any;
    
    // Проверяем наличие onShown разными способами
    const hasOnShown = 
        contextMenusAny.onShown !== undefined && 
        contextMenusAny.onShown !== null &&
        typeof contextMenusAny.onShown.addListener === 'function';
    
    if (hasOnShown) {
        try {
            contextMenusAny.onShown.addListener(
                (info: OnShownInfo, tab?: chrome.tabs.Tab) => {
                    console.log("[CardsExtension] onShown triggered", {
                        selectionText: info.selectionText,
                        menuIds: info.menuIds,
                    });
                    updateMenuTitle(info.selectionText);
                }
            );
            console.log("[CardsExtension] onShown listener registered successfully");
        } catch (error) {
            console.error("[CardsExtension] Error registering onShown:", error);
        }
    } else {
        console.warn(
            "[CardsExtension] onShown is not available in this Chrome version. " +
            "Dynamic menu titles require Chrome 88 or later. " +
            "Using fallback: menu will update after each use."
        );
        // Для старых версий Chrome: обновляем меню после каждого использования
        // Это означает, что при следующем открытии меню будет показано последнее выделенное слово
    }
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    console.log("[CardsExtension] contextMenus.onClicked", { info, tab });

    if (info.menuItemId !== "add-to-vocab") return;

    const selectionText = info.selectionText?.trim();
    if (!selectionText) return;

    const pageUrl = info.pageUrl ?? tab?.url ?? "";

    // -------------------------------
    // 1) Читаем флаг enabled из настроек
    // -------------------------------
    const { enabled } = await new Promise<{ enabled: boolean }>((resolve) => {
        chrome.storage.sync.get(["enabled"], (result) => {
            resolve({
                enabled:
                    typeof result.enabled === "boolean" ? result.enabled : true,
            });
        });
    });

    if (!enabled) {
        console.log("[CardsExtension] disabled via settings, skipping");
        return;
    }

    // -------------------------------
    // 2) Грузим токен и папку
    // -------------------------------
    try {
        const { apiToken, folderId } = await loadSettings();

        if (!apiToken || !folderId) {
            await showNotification(
                "Cards",
                "Не настроен API-токен или папка. Откройте настройки расширения."
            );
            return;
        }

        // -------------------------------
        // 3) Отправляем слово на сервер
        // -------------------------------
        await addWordToFolder({
            apiToken,
            folderId,
            word: selectionText,
            sourceUrl: pageUrl,
        });

        // -------------------------------
        // 4) Нормализуем короткую версию для уведомления
        // -------------------------------
        let short = selectionText.slice(0, 16);
        if (selectionText.length > 16) short += "…";

        await showNotification("Cards", `Добавлено: «${short}»`);
        
        // -------------------------------
        // 5) Обновляем меню для следующего использования (fallback для старых версий Chrome)
        // -------------------------------
        // Если onShown недоступен, обновляем меню после использования,
        // чтобы при следующем открытии контекстного меню было показано последнее слово
        const contextMenusAny = chrome.contextMenus as any;
        if (!contextMenusAny.onShown) {
            updateMenuTitle(selectionText);
        }
    } catch (error) {
        console.error("Ошибка при добавлении слова:", error);
        await showNotification("Cards", "Ошибка при добавлении слова.");
    }
});

function loadSettings(): Promise<Settings> {
    return new Promise((resolve) => {
        chrome.storage.sync.get(["apiToken", "folderId"], (result) => {
            resolve({
                apiToken: (result.apiToken as string) || "",
                folderId: (result.folderId as string) || "",
            });
        });
    });
}

interface AddWordParams {
    apiToken: string;
    folderId: string;
    word: string;
    sourceUrl?: string;
}

async function addWordToFolder({ apiToken, folderId, word, sourceUrl }: AddWordParams) {
    const url = `${API_BASE_URL}/api/ext/cards`;

    const res = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiToken}`,
        },
        body: JSON.stringify({
            word,
            folderId,
            sourceUrl,
        }),
    });

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`API error: ${res.status} ${text}`);
    }
}

function showNotification(title: string, message: string): Promise<void> {
    return new Promise((resolve) => {
        if (!chrome.notifications) {
            return resolve();
        }

        chrome.notifications.create(
            "",
            {
                type: "basic",
                iconUrl: "icons/icon48.png",
                title,
                message,
            },
            () => resolve()
        );
    });
}