import React, { useEffect, useState } from "react";
import { t } from "../i18n";

type Settings = {
    apiToken: string;
    folderId: string;
    enabled: boolean;
};

export const Popup: React.FC = () => {
    const [settings, setSettings] = useState<Settings>({
        apiToken: "",
        folderId: "",
        enabled: true,
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        chrome.storage.sync.get(
            ["apiToken", "folderId", "enabled"],
            (result) => {
                setSettings({
                    apiToken: (result.apiToken as string) || "",
                    folderId: (result.folderId as string) || "",
                    enabled:
                        typeof result.enabled === "boolean" ? result.enabled : true,
                });
            }
        );
    }, []);

    const toggleEnabled = () => {
        const next = !settings.enabled;
        setSettings((prev) => ({ ...prev, enabled: next }));
        setSaving(true);
        chrome.storage.sync.set({ enabled: next }, () => {
            setSaving(false);
        });
    };

    const openOptions = () => {
        chrome.runtime.openOptionsPage();
    };

    const short = (value: string) =>
        value.length > 16 ? value.slice(0, 6) + "… " + value.slice(-6) : value;

    const statusColor =
        !settings.apiToken || !settings.folderId
            ? "#d9534f"
            : settings.enabled
                ? "#5cb85c"
                : "#f0ad4e";

    const statusText =
        !settings.apiToken || !settings.folderId
            ? t("notConfigured")
            : settings.enabled
                ? t("enabled")
                : t("disabled");

    const [token, setToken] = useState("");
    const [folderId, setFolderId] = useState("");

    useEffect(() => {
        chrome.storage.sync.get(["apiToken", "folderId"], (result) => {
            setToken(result.apiToken || "");
            setFolderId(result.folderId || "");
        });
    }, []);


    const isReady = token && folderId;

    return (
        <div
            style={{
                fontFamily:
                    'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                padding: 12,
                minWidth: 260,
            }}
        >
            <h2 style={{ fontSize: 16, margin: 0, marginBottom: 8 }}>
                {t("extensionTitle")}
            </h2>

            <div
                style={{
                    fontSize: 13,
                    marginBottom: 8,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                }}
            >
        <span
            style={{
                display: "inline-block",
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: statusColor,
            }}
        />
                <span>{statusText}</span>
                {saving && <span style={{ opacity: 0.6 }}>…</span>}
            </div>

            <div style={{ fontSize: 12, marginBottom: 8 }}>
                <div>
                    <strong>{t("folderId")}:</strong>{" "}
                    {settings.folderId ? short(settings.folderId) : "—"}
                </div>
                <div>
                    <strong>{t("token")}:</strong>{" "}
                    {settings.apiToken ? short(settings.apiToken) : "—"}
                </div>
            </div>

            <div
                style={{
                    display: "flex",
                    gap: 8,
                    marginTop: 8,
                    justifyContent: "space-between",
                }}
            >
                <button
                    disabled={!isReady}
                    type="button"
                    onClick={toggleEnabled}
                    style={{
                        flex: 1,
                        padding: "6px 8px",
                        fontSize: 12,
                        cursor: "pointer",
                    }}
                >
                    {settings.enabled ? t("disable") : t("enable")}
                </button>
                <button
                    type="button"
                    onClick={openOptions}
                    style={{
                        flex: 1,
                        padding: "6px 8px",
                        fontSize: 12,
                        cursor: "pointer",
                    }}
                >
                    {t("settings")}
                </button>
            </div>

            <p style={{ fontSize: 11, marginTop: 8, opacity: 0.7 }}>
                {t("wordsAddedFromContextMenu")}
            </p>
        </div>
    );
};