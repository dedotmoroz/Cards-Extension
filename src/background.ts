import { API_BASE_URL, MAX_MENU_TEXT_LENGTH, MAX_NOTIFICATION_TEXT_LENGTH } from "./config";
import { t } from "./i18n";

type Settings = {
    apiToken: string;
    folderId: string;
};

// Update menu text with selected word before showing
interface OnShownInfo {
    menuIds: number | string | Array<number | string>;
    selectionText?: string;
    editable: boolean;
    pageUrl?: string;
}

function updateMenuTitle(selectionText: string | undefined) {
    if (selectionText && selectionText.trim()) {
        // Limit text length for better display
        let displayText = selectionText.trim();
        if (displayText.length > MAX_MENU_TEXT_LENGTH) {
            displayText = displayText.slice(0, MAX_MENU_TEXT_LENGTH) + "…";
        }
        chrome.contextMenus.update("add-to-vocab", {
            title: t("addToDictionaryWithWord", displayText),
        });
    } else {
        chrome.contextMenus.update("add-to-vocab", {
            title: t("addToDictionary"),
        });
    }
}

// Create menu on installation
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "add-to-vocab",
        title: t("addToDictionary"),
        contexts: ["selection"],
    });
    
    // Try to register onShown immediately after creating menu
    setupOnShownListener();
});

// Also try to register on service worker startup
setupOnShownListener();

// Handle messages from content script to update menu
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "SELECTION_CHANGED" && message.text) {
        console.log("[CardsExtension] Selection changed from content script:", message.text);
        updateMenuTitle(message.text);
        sendResponse({ success: true });
    }
    return true; // Allow asynchronous response sending
});

function setupOnShownListener() {
    // Try to use onShown (available in Chrome 88+)
    // Use direct access through any, as types may be incomplete
    const contextMenusAny = chrome.contextMenus as any;
    
    // Check for onShown presence in different ways
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
        // For older Chrome versions: update menu after each use
        // This means that on the next menu open, the last selected word will be shown
    }
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    console.log("[CardsExtension] contextMenus.onClicked", { info, tab });

    if (info.menuItemId !== "add-to-vocab") return;

    const selectionText = info.selectionText?.trim();
    if (!selectionText) return;

    const pageUrl = info.pageUrl ?? tab?.url ?? "";

    // -------------------------------
    // 1) Read enabled flag from settings
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
    // 2) Load token and folder
    // -------------------------------
    try {
        const { apiToken, folderId } = await loadSettings();

        if (!apiToken || !folderId) {
            await showNotification(
                t("extensionTitle"),
                t("apiTokenNotConfigured")
            );
            return;
        }

        // -------------------------------
        // 3) Send word to server
        // -------------------------------
        await addWordToFolder({
            apiToken,
            folderId,
            word: selectionText,
            sourceUrl: pageUrl,
        });

        // -------------------------------
        // 4) Normalize short version for notification
        // -------------------------------
        let short = selectionText.slice(0, MAX_NOTIFICATION_TEXT_LENGTH);
        if (selectionText.length > MAX_NOTIFICATION_TEXT_LENGTH) short += "…";

        await showNotification(t("extensionTitle"), t("added", short));
        
        // -------------------------------
        // 5) Update menu for next use (fallback for older Chrome versions)
        // -------------------------------
        // If onShown is unavailable, update menu after use,
        // so that on the next context menu open, the last word will be shown
        const contextMenusAny = chrome.contextMenus as any;
        if (!contextMenusAny.onShown) {
            updateMenuTitle(selectionText);
        }
    } catch (error) {
        console.error("Error adding word:", error);
        await showNotification(t("extensionTitle"), t("errorAddingWord"));
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