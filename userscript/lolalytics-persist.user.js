// ==UserScript==
// @name         Lolalytics Persist
// @namespace    https://github.com/diyorsattarov7
// @version      0.1.5
// @description  Persist Lolalytics tier, region, and patch.
// @match        *://lolalytics.com/*
// @match        *://www.lolalytics.com/*
// @grant        GM_getValue
// @grant        GM_setValue
// @run-at       document-start
// @downloadURL  https://raw.githubusercontent.com/diyorsattarov7/lolalytics-persist/main/userscript/lolalytics-persist.user.js
// @updateURL    https://raw.githubusercontent.com/diyorsattarov7/lolalytics-persist/main/userscript/lolalytics-persist.user.js
// ==/UserScript==

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

function saveFilters() {
    const current = getFilters();
    const saved = GM_getValue(STORAGE_KEY, {});

    const updated = { ...saved, ...current };

    if (JSON.stringify(updated) !== JSON.stringify(saved)) {
    GM_setValue(STORAGE_KEY, updated);
    console.log("[Lolalytics Persist] Saved:", updated);
    }
}

function restoreFilters() {
    const saved = GM_getValue(STORAGE_KEY, {});
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

const current = getFilters();

if (Object.keys(current).length > 0) {
    saveFilters();
    restoreFilters();
} else {
    restoreFilters();
}

let previousUrl = location.href;

setInterval(() => {
    if (location.href === previousUrl) return;

    previousUrl = location.href;
    saveFilters();
}, 300);
})();