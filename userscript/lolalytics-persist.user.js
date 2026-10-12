// ==UserScript==
// @name         Lolalytics Persist
// @namespace    https://github.com/diyorsattarov7
// @version      0.1.6
// @description  Persist Lolalytics tier, region, and patch.
// @match        *://lolalytics.com/*
// @match        *://www.lolalytics.com/*
// @grant        GM_getValue
// @grant        GM_setValue
// @run-at       document-start
// @downloadURL  https://raw.githubusercontent.com/diyorsattarov7/lolalytics-persist/main/userscript/lolalytics-persist.user.js
// @updateURL    https://raw.githubusercontent.com/diyorsattarov7/lolalytics-persist/main/userscript/lolalytics-persist.user.js
// ==/UserScript==

function createStorage() {
    if (
        typeof GM_getValue === "function" &&
        typeof GM_setValue === "function"
    ) {
        return {
            async get(key) {
                return GM_getValue(key, {});
            },

            async set(key, value) {
                GM_setValue(key, value);
            }
        };
    }

    const api = globalThis.browser?.storage?.local
        ?? globalThis.chrome?.storage?.local;

    if (!api) {
        throw new Error("No supported storage API found");
    }

    return {
        async get(key) {
            const result = await api.get(key);
            return result[key] ?? {};
        },

        async set(key, value) {
            await api.set({
                [key]: value
            });
        }
    };
}


(function () {
    "use strict";

    const STORAGE_KEY = "lolalytics-persist";
    const FILTER_KEYS = ["tier", "region", "patch"];

    function getFilters(url = location.href) {
        const params = new URL(url).searchParams;
        const filters = {};

        for (const key of FILTER_KEYS) {
            const value = params.get(key);

            if (value !== null) {
                filters[key] = value;
            }
        }

        return filters;
    }

    async function saveFilters() {
        const current = getFilters();
        const saved = await storage.get(STORAGE_KEY);

        const updated = { ...saved, ...current };

        if (JSON.stringify(updated) !== JSON.stringify(saved)) {
            await storage.set(STORAGE_KEY, updated);

            console.log("[Lolalytics Persist] Saved:", updated);
        }
    }

    async function restoreFilters() {
        const saved = await storage.get(STORAGE_KEY);
        const url = new URL(location.href);

        let changed = false;

        for (const key of FILTER_KEYS) {
            if (!url.searchParams.has(key) && saved[key]) {
                url.searchParams.set(key, saved[key]);
                changed = true;
            }
        }

        if (changed) {
            console.log("[Lolalytics Persist] Restoring:", url.href);
            location.replace(url.href);
            return true;
        }

        return false;
    }

    async function initialize() {
        const current = getFilters();

        if (Object.keys(current).length > 0) {
            await saveFilters();
            await restoreFilters();
        } else if (await restoreFilters()) {
            return;
        }

        let previousUrl = location.href;

        setInterval(async () => {
            if (location.href === previousUrl) {
                return;
            }

            previousUrl = location.href;
            await saveFilters();
        }, 300);
    }

    const storage = createStorage();

    initialize().catch(error => {
        console.error("[Lolalytics Persist] Error:", error);
    });
})();
