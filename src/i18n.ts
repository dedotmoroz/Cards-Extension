/**
 * Utilities for localization
 */

/**
 * Get localized string
 * @param key - Message key from messages.json
 * @param substitutions - Substitutions for placeholders (string or array of strings)
 * @returns Localized string
 */
export function t(key: string, substitutions?: string | string[]): string {
    return chrome.i18n.getMessage(key, substitutions);
}

/**
 * Get current browser interface language
 * @returns Language code (e.g., "ru", "en")
 */
export function getUILanguage(): string {
    return chrome.i18n.getUILanguage();
}

/**
 * Get list of browser preferred languages
 * @returns Promise with array of language codes
 */
export function getAcceptLanguages(): Promise<string[]> {
    return new Promise((resolve) => {
        chrome.i18n.getAcceptLanguages((languages) => {
            resolve(languages);
        });
    });
}

