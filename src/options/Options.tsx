import React, { useEffect, useState } from "react";

// const API_BASE_URL = "http://localhost:3000";
const API_BASE_URL = "https://kotcat.com";

type Folder = {
    id: string;
    name: string;
    userId: string;
};

export const Options: React.FC = () => {
    const [apiToken, setApiToken] = useState("");
    const [savedToken, setSavedToken] = useState("");
    const [folderId, setFolderId] = useState("");
    const [folders, setFolders] = useState<Folder[]>([]);
    const [loadingFolders, setLoadingFolders] = useState(false);
    const [tokenError, setTokenError] = useState<string | null>(null);
    const [status, setStatus] = useState("");

    // При загрузке — читаем сохранённые значения
    useEffect(() => {
        chrome.storage.sync.get(["apiToken", "folderId"], (result) => {
            const token = (result.apiToken as string) || "";
            const folder = (result.folderId as string) || "";
            setApiToken(token);
            setSavedToken(token);
            setFolderId(folder);

            if (token) {
                loadFolders(token).catch(console.error);
            }
        });
    }, []);

    const handleSaveTokenAndLoadFolders = async () => {
        const trimmed = apiToken.trim();
        if (!trimmed) {
            setTokenError("Введите токен");
            return;
        }

        setTokenError(null);
        setStatus("");
        setLoadingFolders(true);

        try {
            // сохраняем токен в storage
            await new Promise<void>((resolve) => {
                chrome.storage.sync.set({ apiToken: trimmed }, () => resolve());
            });
            setSavedToken(trimmed);

            // грузим папки
            await loadFolders(trimmed);

            setStatus("Токен сохранён, папки загружены ✔");
            setTimeout(() => setStatus(""), 2500);
        } catch (err: any) {
            console.error("[CardsExtension] error:", err);
            setTokenError(
                err instanceof Error ? err.message : "Не удалось загрузить папки"
            );
        } finally {
            setLoadingFolders(false);
        }
    };

    async function loadFolders(token: string) {
        // 1. узнаём userId через /auth/me
        const meRes = await fetch(`${API_BASE_URL}/api/auth/me`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!meRes.ok) {
            const text = await meRes.text().catch(() => "");
            throw new Error(
                `Ошибка авторизации: ${meRes.status} ${text || meRes.statusText}`
            );
        }

        const me = (await meRes.json()) as { id: string };
        const userId = me.id;

        // 2. получаем список папок
        const foldersRes = await fetch(`${API_BASE_URL}/api/folders/${userId}`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!foldersRes.ok) {
            const text = await foldersRes.text().catch(() => "");
            throw new Error(
                `Ошибка загрузки папок: ${foldersRes.status} ${
                    text || foldersRes.statusText
                }`
            );
        }

        const data = (await foldersRes.json()) as Folder[];
        setFolders(data);

        // если папка ещё не выбрана – выбираем первую
        if (!folderId && data.length > 0) {
            const firstId = data[0].id;
            setFolderId(firstId);
            await new Promise<void>((resolve) => {
                chrome.storage.sync.set({ folderId: firstId }, () => resolve());
            });
        }
    }

    const handleFolderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        setFolderId(value);
        setStatus("");
        chrome.storage.sync.set({ folderId: value }, () => {
            setStatus("Папка сохранена ✔");
            setTimeout(() => setStatus(""), 2000);
        });
    };

    // Добавь функцию сброса выше, внутри компонента:
    const handleReset = () => {
        chrome.storage.sync.remove(["apiToken", "folderId"], () => {
            setApiToken("");
            setSavedToken("");
            setFolderId("");
            setFolders([]);
            setStatus("Настройки сброшены");
            setTimeout(() => setStatus(""), 2000);
        });
    };

    const hasToken = !!savedToken;

    return (
        <div
            style={{
                fontFamily:
                    'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                padding: 16,
                maxWidth: 520,
            }}
        >
            <h1>KotCat Cards Extension</h1>
            <p>Расширение добавляет выделенные слова в выбранную папку карточек.</p>

            {/* 1. API Token */}
            <div
                style={{
                    border: "1px solid #ddd",
                    borderRadius: 8,
                    padding: 12,
                    marginBottom: 16,
                }}
            >
                <h2 style={{ fontSize: 16, marginTop: 0 }}>1. API Token</h2>
                <p style={{ fontSize: 13, marginTop: 0 }}>
                    Вставьте токен (из <code>/auth/token</code>) и нажмите{" "}
                    <strong>OK</strong>, чтобы загрузить список папок.
                </p>

                <div style={{ display: "flex", gap: 8 }}>
                    <input
                        type="text"
                        value={apiToken}
                        onChange={(e) => setApiToken(e.target.value)}
                        style={{
                            flex: 1,
                            padding: "6px 8px",
                            boxSizing: "border-box",
                        }}
                        placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    />
                    <button
                        type="button"
                        onClick={handleSaveTokenAndLoadFolders}
                        style={{
                            padding: "6px 12px",
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                        }}
                        disabled={loadingFolders}
                    >
                        {loadingFolders ? "Загрузка…" : "OK"}
                    </button>
                </div>

                {tokenError && (
                    <div style={{ marginTop: 8, color: "#d9534f", fontSize: 12 }}>
                        {tokenError}
                    </div>
                )}

                {savedToken && !tokenError && (
                    <div
                        style={{
                            marginTop: 6,
                            fontSize: 12,
                            color: "#5cb85c",
                        }}
                    >
                        Токен сохранён.
                    </div>
                )}
            </div>

            {/* 2. Доступные папки */}
            <div
                style={{
                    border: "1px solid #ddd",
                    borderRadius: 8,
                    padding: 12,
                    marginBottom: 16,
                    opacity: hasToken ? 1 : 0.6,
                }}
            >
                <h2 style={{ fontSize: 16, marginTop: 0 }}>2. Доступные папки</h2>
                <p style={{ fontSize: 13, marginTop: 0 }}>
                    После ввода токена и нажатия <strong>OK</strong> здесь появится список
                    ваших папок.
                </p>

                <select
                    value={folderId || ""}
                    onChange={handleFolderChange}
                    disabled={!hasToken || loadingFolders || folders.length === 0}
                    style={{
                        width: "100%",
                        padding: "6px 8px",
                        boxSizing: "border-box",
                    }}
                >
                    {!hasToken && (
                        <option value="">Сначала введите токен и нажмите OK</option>
                    )}
                    {hasToken && loadingFolders && (
                        <option value="">Загрузка папок…</option>
                    )}
                    {hasToken && !loadingFolders && folders.length === 0 && (
                        <option value="">Папок не найдено</option>
                    )}
                    {hasToken &&
                        !loadingFolders &&
                        folders.length > 0 && [
                            <option key="_placeholder" value="" disabled={!folderId}>
                                Выберите папку…
                            </option>,
                            ...folders.map((f) => (
                                <option key={f.id} value={f.id}>
                                    {f.name}
                                </option>
                            )),
                        ]}
                </select>
            </div>

            {status && (
                <div style={{ fontSize: 12, color: "#5cb85c", marginTop: 4 }}>
                    {status}
                </div>
            )}

            <p style={{ fontSize: 11, marginTop: 16, opacity: 0.7 }}>
                После настройки: выделите слово на любой странице → правый клик →
                «Добавить в словарь», и оно попадёт в выбранную папку.
            </p>

            {/* Кнопка сброса */}
            <button
                type="button"
                onClick={handleReset}
                style={{
                    marginTop: 20,
                    padding: "6px 12px",
                    backgroundColor: "#d9534f",
                    color: "white",
                    border: "none",
                    borderRadius: 4,
                    cursor: "pointer",
                }}
            >
                Сбросить настройки
            </button>
        </div>
    );
};