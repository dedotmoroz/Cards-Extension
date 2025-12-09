import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
    plugins: [react()],
    build: {
        rollupOptions: {
            input: {
                options: "index.html",             // options page
                popup: "popup.html",               // 🔹 новый popup
                background: "src/background.ts",   // service worker
            },
            output: {
                entryFileNames: (chunk) =>
                    chunk.name === "background"
                        ? "background.js"
                        : "assets/[name].js",
            },
        },
    },
});