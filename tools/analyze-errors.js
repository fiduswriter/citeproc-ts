#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseFixture } from '../test-runner/dist/lib/fixture-parser.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const FIX_DIR = path.join(ROOT, 'fixtures', 'std', 'processor-tests', 'humans');
const LOCALE_FILE = path.join(ROOT, 'locale', 'locales-en-US.xml');
const LOCALE = fs.readFileSync(LOCALE_FILE, 'utf8').replace(/\s*<\?[^>]*\?>\s*\n/g, '');

function runFixture(name, CSL) {
    let test;
    try { test = parseFixture({}, name, path.join(FIX_DIR, name + '.txt'));
    } catch (e) { return null; }
    if (!test.CSL || !test.RESULT) return null;
    const mode = (test.MODE || 'citation').split('-')[0];
    if (!/^(citation|bibliography)$/.test(mode)) return null;
    if (/rtf|plain|asciidoc|xslfo/.test(test.MODE || '')) return null;
    const items = test.INPUT;
    if (!items) return null;
    const byId = {};
    for (const it of items) byId['' + it.id] = it;
    const sys = { retrieveLocale: () => LOCALE, retrieveItem: (id) => byId['' + id] };
    let engine;
    try { engine = new CSL.Engine(sys, test.CSL);
    } catch (e) { return { name, error: 'init: ' + e.message }; }
    if (test.options) {
        for (const opt of Object.keys(test.options)) {
            if (opt === 'variableWrapper') continue;
            if (typeof engine.opt.development_extensions !== 'object') return { name, error: 'no dev_ext' };
            engine.opt.development_extensions[opt] = test.options[opt];
        }
    }
    try {
        let actual;
        if (test.BIBENTRIES) {
            for (const idSet of test.BIBENTRIES) engine.updateItems(idSet);
        } else {
            engine.updateItems(items.map((i) => '' + i.id));
        }
        if (mode === 'citation') {
            if (test['CITATION-ITEMS']) {
                actual = test['CITATION-ITEMS'].map((cluster) => engine.makeCitationCluster(cluster)).join('\n');
            } else if (test.CITATIONS) {
                let doc = [];
                for (const c of test.CITATIONS) {
                    const [info, result] = engine.processCitationCluster(c[0], c[1], c[2]);
                    for (let j = doc.length - 1; j > -1; j--) {
                        const cid = doc[j].citationID;
                        if (!engine.registry.citationreg.citationById[cid]) doc = doc.slice(0, j).concat(doc.slice(j + 1));
                    }
                    for (const d of doc) d.prefix = '..';
                    for (let j = 0; j < result.length; j++) {
                        const insert = result[j];
                        let replaced = false;
                        for (const d of doc) {
                            if (d.citationID === insert[2]) { d.prefix = '>>'; d.String = insert[1]; result[j] = null; replaced = true; break; }
                        }
                        if (!replaced && insert) {
                            doc = doc.slice(0, insert[0]).concat([{ prefix: '>>', citationID: insert[2], String: insert[1] }]).concat(doc.slice(insert[0]));
                        }
                    }
                }
                actual = doc.map((elem, idx) => elem.prefix + '[' + idx + '] ' + elem.String).join('\n');
            } else { return null; }
        } else {
            const res = test.BIBSECTION ? engine.makeBibliography(test.BIBSECTION) : engine.makeBibliography();
            actual = res[0].bibstart + res[1].join('') + res[0].bibend;
        }
        const expected = ('' + test.RESULT).replace(/\r/g, '');
        return { name, pass: actual === expected, actual: actual };
    } catch (e) {
        return { name, error: e.message, errorType: e.message.split(':')[0] };
    }
}

async function main() {
    const CSL = (await import(path.join(ROOT, 'citeproc.mjs'))).default;

    const files = fs.readdirSync(FIX_DIR).filter(f => f.endsWith('.txt')).sort();
    const errors = {};
    let total = 0, passed = 0, failed = 0, errored = 0, skipped = 0;
    for (const f of files) {
        const r = runFixture(f.replace(/\.txt$/, ''), CSL);
        if (r === null) { skipped++; continue; }
        total++;
        if (r.pass) passed++;
        else if (r.error) {
            errored++;
            const key = r.error.match(/^[^:()]+/)?.[0] || r.error.slice(0, 60);
            if (!errors[key]) errors[key] = [];
            errors[key].push({ name: r.name, msg: r.error });
        } else { failed++; }
    }

    console.log(`ran=${total} passed=${passed} failed=${failed} errored=${errored} skipped=${skipped}`);
    console.log('\n=== Error categories ===');
    const sorted = Object.entries(errors).sort((a, b) => b[1].length - a[1].length);
    for (const [cat, entries] of sorted) {
        console.log(`\n[${entries.length}x] ${cat}`);
        for (const e of entries.slice(0, 8)) console.log('    ' + e.name + ': ' + e.msg);
        if (entries.length > 8) console.log('    ... and ' + (entries.length - 8) + ' more');
    }
}

main().catch(err => { console.error(err); process.exit(1); });
