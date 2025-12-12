import React, { useEffect, useState } from "react";
import { API_BASE_URL, PROFILE_URL } from "../config";
import { t } from "../i18n";

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

    // On load — read saved values
    useEffect(() => {
        chrome.storage.sync.get(["apiToken", "folderId"], (result) => {
            const token = (result.apiToken as string) || "";
            const folder = (result.folderId as string) || "";
            setApiToken(token);
            setSavedToken(token);
            setFolderId(folder);

            if (token) {
                // Pass saved folderId to avoid overwriting user selection
                loadFolders(token, folder).catch(console.error);
            }
        });
    }, []);

    const handleSaveTokenAndLoadFolders = async () => {
        const trimmed = apiToken.trim();
        if (!trimmed) {
            setTokenError(t("enterToken"));
            return;
        }

        setTokenError(null);
        setStatus("");
        setLoadingFolders(true);

        try {
            // save token to storage
            await new Promise<void>((resolve) => {
                chrome.storage.sync.set({ apiToken: trimmed }, () => resolve());
            });
            setSavedToken(trimmed);

            // Read saved folderId before loading folders
            const savedFolderId = await new Promise<string>((resolve) => {
                chrome.storage.sync.get(["folderId"], (result) => {
                    resolve((result.folderId as string) || "");
                });
            });
            
            // load folders, passing saved folderId
            await loadFolders(trimmed, savedFolderId);

            setStatus(t("tokenSavedFoldersLoaded"));
            setTimeout(() => setStatus(""), 2500);
        } catch (err: any) {
            console.error("[CardsExtension] error:", err);
            setTokenError(
                err instanceof Error ? err.message : t("failedToLoadFolders")
            );
        } finally {
            setLoadingFolders(false);
        }
    };

    async function loadFolders(token: string, savedFolderId?: string) {
        // 1. get userId via /auth/me
        const meRes = await fetch(`${API_BASE_URL}/api/auth/me`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!meRes.ok) {
            const text = await meRes.text().catch(() => "");
            throw new Error(
                t("authError", [String(meRes.status), text || meRes.statusText])
            );
        }

        const me = (await meRes.json()) as { id: string };
        const userId = me.id;

        // 2. get list of folders
        const foldersRes = await fetch(`${API_BASE_URL}/api/folders/${userId}`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!foldersRes.ok) {
            const text = await foldersRes.text().catch(() => "");
            throw new Error(
                t("foldersLoadError", [String(foldersRes.status), text || foldersRes.statusText])
            );
        }

        const data = (await foldersRes.json()) as Folder[];
        setFolders(data);

        // Use passed savedFolderId or read from state
        const currentFolderId = savedFolderId !== undefined ? savedFolderId : folderId;
        
        // Check that selected folder still exists in the list
        const folderExists = currentFolderId && data.some(f => f.id === currentFolderId);
        
        if (folderExists) {
            // If saved folder exists, use it
            setFolderId(currentFolderId);
        } else if (!currentFolderId && data.length > 0) {
            // If folder is not yet selected – select the first one
            const firstId = data[0].id;
            setFolderId(firstId);
            await new Promise<void>((resolve) => {
                chrome.storage.sync.set({ folderId: firstId }, () => resolve());
            });
        } else if (currentFolderId && !folderExists) {
            // If saved folder no longer exists, reset selection
            setFolderId("");
            await new Promise<void>((resolve) => {
                chrome.storage.sync.remove(["folderId"], () => resolve());
            });
        }
    }

    const handleFolderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        setFolderId(value);
        setStatus("");
        chrome.storage.sync.set({ folderId: value }, () => {
            setStatus(t("folderSaved"));
            setTimeout(() => setStatus(""), 2000);
        });
    };

    // Add reset function above, inside component:
    const handleReset = () => {
        chrome.storage.sync.remove(["apiToken", "folderId"], () => {
            setApiToken("");
            setSavedToken("");
            setFolderId("");
            setFolders([]);
            setStatus(t("settingsReset"));
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
            <h1>{t("extensionTitle")}</h1>
            <p style={{ fontSize: 14 }}>{t("extensionDescriptionFull")}</p>

            {/* 1. API Token */}
            <div
                style={{
                    border: "1px solid #ddd",
                    borderRadius: 8,
                    padding: 12,
                    marginBottom: 16,
                }}
            >
                <h2 style={{ fontSize: 16, marginTop: 0 }}>{t("apiTokenSection")}</h2>
                <p style={{ fontSize: 14, marginTop: 0 }}>
                    {t("apiTokenDescription")}
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
                        {loadingFolders ? t("loading") : t("ok")}
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
                        {t("tokenSaved")}
                    </div>
                )}
            </div>

            {/* 2. Available folders */}
            <div
                style={{
                    border: "1px solid #ddd",
                    borderRadius: 8,
                    padding: 12,
                    marginBottom: 16,
                    opacity: hasToken ? 1 : 0.6,
                }}
            >
                <h2 style={{ fontSize: 16, marginTop: 0 }}>{t("availableFolders")}</h2>
                <p style={{ fontSize: 14, marginTop: 0 }}>
                    {t("availableFoldersDescription")}
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
                        <option value="">{t("selectFolderFirst")}</option>
                    )}
                    {hasToken && loadingFolders && (
                        <option value="">{t("loadingFolders")}</option>
                    )}
                    {hasToken && !loadingFolders && folders.length === 0 && (
                        <option value="">{t("noFoldersFound")}</option>
                    )}
                    {hasToken &&
                        !loadingFolders &&
                        folders.length > 0 && [
                            <option key="_placeholder" value="" disabled={!folderId}>
                                {t("selectFolder")}
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

            <p style={{ fontSize: 14, marginTop: 16, opacity: 0.7 }}>
                {t("afterSetupInstructions")}
            </p>

            {/* Reset button */}
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
                {t("resetSettings")}
            </button>
        </div>
    );
};