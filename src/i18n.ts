/**
 * Утилиты для работы с локализацией
 */

/**
 * Получить локализованную строку
 * @param key - Ключ сообщения из messages.json
 * @param substitutions - Замены для плейсхолдеров (строка или массив строк)
 * @returns Локализованная строка
 */
export function t(key: string, substitutions?: string | string[]): string {
    return chrome.i18n.getMessage(key, substitutions);
}

/**
 * Получить текущий язык интерфейса браузера
 * @returns Код языка (например, "ru", "en")
 */
export function getUILanguage(): string {
    return chrome.i18n.getUILanguage();
}

/**
 * Получить список предпочитаемых языков браузера
 * @returns Promise с массивом кодов языков
 */
export function getAcceptLanguages(): Promise<string[]> {
    return new Promise((resolve) => {
        chrome.i18n.getAcceptLanguages((languages) => {
            resolve(languages);
        });
    });
}

