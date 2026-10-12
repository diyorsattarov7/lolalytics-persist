const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");

function read(file) {
    return fs.readFileSync(path.join(root, file), "utf8");
}

function write(file, content) {
    fs.writeFileSync(path.join(root, file), content);
}

const pkg = JSON.parse(read("package.json"));
const version = pkg.version;

const metadata = `// ==UserScript==
// @name         Lolalytics Persist
// @namespace    https://github.com/diyorsattarov7
// @version      ${version}
// @description  Persist Lolalytics tier, region, and patch.
// @match        *://lolalytics.com/*
// @match        *://www.lolalytics.com/*
// @grant        GM_getValue
// @grant        GM_setValue
// @run-at       document-start
// @downloadURL  https://raw.githubusercontent.com/diyorsattarov7/lolalytics-persist/master/userscript/lolalytics-persist.user.js
// @updateURL    https://raw.githubusercontent.com/diyorsattarov7/lolalytics-persist/master/userscript/lolalytics-persist.user.js
// ==/UserScript==`;

const source = [
    read("src/storage.js"),
    read("src/persist.js")
].join("\n\n");

write(
    "userscript/lolalytics-persist.user.js",
    `${metadata}\n\n${source}\n`
);

write(
    "extension/content.js",
    `${source}\n`
);

const manifest = JSON.parse(read("extension/manifest.json"));
manifest.version = version;

write(
    "extension/manifest.json",
    JSON.stringify(manifest, null, 4) + "\n"
);

console.log(`Built Lolalytics Persist v${version}`);