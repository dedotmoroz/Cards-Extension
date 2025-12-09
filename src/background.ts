// const API_BASE_URL = "http://localhost:3000";
const API_BASE_URL = "https://kotcat.com";

type Settings = {
    apiToken: string;
    folderId: string;
};

chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "add-to-vocab",
        title: "Добавить в словарь",
        contexts: ["selection"],
    });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {

    console.log("[CardsExtension] contextMenus.onClicked", { info, tab });

    if (info.menuItemId !== "add-to-vocab") return;

    const selectionText = info.selectionText?.trim();
    if (!selectionText) return;

    const pageUrl = info.pageUrl ?? tab?.url ?? "";

    // 🔹 читаем флаг enabled
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

    try {
        const { apiToken, folderId } = await loadSettings();

        if (!apiToken || !folderId) {
            await showNotification(
                "Cards",
                "Не настроен API-токен или папка. Откройте настройки расширения."
            );
            return;
        }

        await addWordToFolder({
            apiToken,
            folderId,
            word: selectionText,
            sourceUrl: pageUrl,
        });

        await showNotification("Cards", `Добавлено: "${selectionText}"`);
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