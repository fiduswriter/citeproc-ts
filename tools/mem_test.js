#!/usr/bin/env node

// Memory usage test for CSL.Engine instantiation.
//
// Usage: node --expose-gc mem_test.js [path-to-style.csl]
//
// If no style path is provided, downloads chicago-shortened-notes-bibliography
// from the citation-style-language/styles repo (155 macros, 6 macro-based sort
// keys -- good for memory testing).

import fs from "fs";
import path from "path";
import os from "os";
import { execFileSync } from "child_process";
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

let STYLE_URL = "https://raw.githubusercontent.com/citation-style-language/styles/master/chicago-shortened-notes-bibliography.csl";
let CACHED_STYLE_PATH = path.join(os.tmpdir(), "citeproc-mem-test-chicago-shortened-notes-bibliography.csl");
let FALLBACK_STYLE_PATH = path.join(ROOT, "docs", "chicago-fullnote-bibliography.csl");

async function main() {
    let CSL = (await import(path.join(ROOT, "citeproc.mjs"))).default;

    let localeXml = fs.readFileSync(path.join(ROOT, "locale", "locales-en-US.xml"), "utf8");

    let stylePath = process.argv[2];
    let styleXml;
    if (stylePath) {
        styleXml = fs.readFileSync(stylePath, "utf8");
    }
    else if (fs.existsSync(CACHED_STYLE_PATH)) {
        stylePath = CACHED_STYLE_PATH;
        styleXml = fs.readFileSync(CACHED_STYLE_PATH, "utf8");
    }
    else {
        try {
            console.log("Downloading style...");
            styleXml = execFileSync("curl", ["-sfL", STYLE_URL], { encoding: "utf8" });
            fs.writeFileSync(CACHED_STYLE_PATH, styleXml);
            stylePath = CACHED_STYLE_PATH;
        }
        catch (e) {
            console.log("Download failed, falling back to " + FALLBACK_STYLE_PATH);
            stylePath = FALLBACK_STYLE_PATH;
            styleXml = fs.readFileSync(FALLBACK_STYLE_PATH, "utf8");
        }
    }
    console.log("Style: " + stylePath);

    let sys = {
        retrieveLocale: function (lang) {
            if (lang === "en-US") return localeXml;
            try {
                return fs.readFileSync(path.join(ROOT, "locale", "locales-" + lang + ".xml"), "utf8");
            }
            catch (e) {
                return null;
            }
        },
        retrieveItem: function (id) {
            return {};
        }
    };

    function gc() {
        if (global.gc) {
            global.gc();
            global.gc();
            global.gc();
        }
    }

    function heapMB() {
        gc();
        return Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 10) / 10;
    }

    let warmup = new CSL.Engine(sys, styleXml, "en-US");
    warmup = null;
    gc();

    let RUNS = 5;

    console.log("Creating " + RUNS + " CSL.Engine instances...\n");

    let baseline = heapMB();
    console.log("Baseline heap: " + baseline + " MB");

    let engines = [];
    for (let i = 0; i < RUNS; i++) {
        let before = heapMB();
        engines.push(new CSL.Engine(sys, styleXml, "en-US"));
        let after = heapMB();
        console.log("Engine " + (i + 1) + ": " + before + " -> " + after + " MB (delta=" + (after - before).toFixed(1) + " MB)");
    }

    console.log("\nTotal heap after " + RUNS + " engines: " + heapMB() + " MB");
    console.log("Total delta from baseline: " + (heapMB() - baseline).toFixed(1) + " MB");
    console.log("Average per engine: " + ((heapMB() - baseline) / RUNS).toFixed(1) + " MB");
}

main().catch(err => { console.error(err); process.exit(1); });
