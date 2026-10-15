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
    const FILTER_KEYS = ["lane", "tier", "region", "patch"];

    function isMatchupPage(url) {
        return /^\/lol\/[^/]+\/vs\/[^/]+\//.test(url.pathname);
    }

    function getFilters(url = location.href) {
        const parsed = new URL(url);
        const filters = {};

        for (const key of FILTER_KEYS) {
            if (key === "region" && isMatchupPage(parsed)) {
                continue;
            }

            const value = parsed.searchParams.get(key);

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

        const matchup = isMatchupPage(url);
        let changed = false;

        if (matchup && url.searchParams.has("region")) {
            url.searchParams.delete("region");
            changed = true;
        }

        for (const key of FILTER_KEYS) {
            if (key === "region" && matchup) {
                continue;
            }

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
        await saveFilters();

        if (await restoreFilters()) {
            return;
        }

        let previousUrl = location.href;
        let processing = false;

        setInterval(async () => {
            if (processing || location.href === previousUrl) {
                return;
            }

            processing = true;

            try {
                previousUrl = location.href;

                await saveFilters();
                await restoreFilters();
            } catch (error) {
                console.error("[Lolalytics Persist] Error:", error);
            } finally {
                processing = false;
            }
        }, 300);
    }

    const storage = createStorage();

    initialize().catch(error => {
        console.error("[Lolalytics Persist] Error:", error);
    });
})();