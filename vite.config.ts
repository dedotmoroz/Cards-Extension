import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
    plugins: [react()],
    build: {
        rollupOptions: {
            input: {
                options: "index.html",             // options page
                popup: "popup.html",               // popup
                background: "src/background.ts",   // service worker
                content: "src/content.ts",        // content script
            },
            output: {
                entryFileNames: (chunk) => {
                    if (chunk.name === "background") {
                        return "background.js";
                    }
                    if (chunk.name === "content") {
                        return "content.js";
                    }
                    return "assets/[name].js";
                },
            },
        },
    },
});