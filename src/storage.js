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