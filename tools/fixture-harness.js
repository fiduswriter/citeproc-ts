#!/usr/bin/env node
// Regression net for the citeproc refactor. Runs the standard CSL fixture
// suite through the bundled citeproc (citeproc_commonjs.js) using the
// test-runner's canonical fixture parser, and compares to RESULT.
//
// Requires the test-runner to be compiled next to source:
//   (cd test-runner && npx tsc -p tsconfig.json)   # after removing outDir
'use strict';
const fs = require('fs');
const path = require('path');
const CSL = require(path.join(__dirname, '..', 'citeproc_commonjs.js'));
const { parseFixture } = require(path.join(__dirname, '..', 'test-runner', 'lib', 'fixture-parser'));

const ROOT = path.join(__dirname, '..');
const FIX_DIR = path.join(ROOT, 'fixtures', 'std', 'processor-tests', 'humans');
const LOCALE_FILE = path.join(ROOT, 'locale', 'locales-en-US.xml');
const LOCALE = fs.readFileSync(LOCALE_FILE, 'utf8').replace(/\s*<\?[^>]*\?>\s*\n/g, '');

function runFixture(name) {
    let test;
    try {
        test = parseFixture({}, name, path.join(FIX_DIR, name + '.txt'));
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
    try {
        engine = new CSL.Engine(sys, test.CSL);
    } catch (e) { return { name, error: 'init: ' + e.message }; }
    if (test.options) {
        for (const opt of Object.keys(test.options)) {
            if (opt === 'variableWrapper') continue;
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
                const outs = test['CITATION-ITEMS'].map((cluster) => engine.makeCitationCluster(cluster));
                actual = outs.join('\n');
            } else if (test.CITATIONS) {
                // Replicate the test-runner doc-update flow.
                let doc = [];
                for (const c of test.CITATIONS) {
                    const [info, result] = engine.processCitationCluster(c[0], c[1], c[2]);
                    for (let j = doc.length - 1; j > -1; j--) {
                        const cid = doc[j].citationID;
                        if (!engine.registry.citationreg.citationById[cid]) {
                            doc = doc.slice(0, j).concat(doc.slice(j + 1));
                        }
                    }
                    for (const d of doc) d.prefix = '..';
                    for (let j = 0; j < result.length; j++) {
                        const insert = result[j];
                        if (!insert) continue;
                        let replaced = false;
                        for (const d of doc) {
                            if (d.citationID === insert[2]) {
                                d.prefix = '>>'; d.String = insert[1]; result[j] = null; replaced = true; break;
                            }
                        }
                        if (!replaced) {
                            doc = doc.slice(0, insert[0]).concat([{ prefix: '>>', citationID: insert[2], String: insert[1] }]).concat(doc.slice(insert[0]));
                        }
                    }
                }
                actual = doc.map((elem, idx) => elem.prefix + '[' + idx + '] ' + elem.String).join('\n');
            } else {
                return null;
            }
        } else {
            const res = test.BIBSECTION ? engine.makeBibliography(test.BIBSECTION) : engine.makeBibliography();
            actual = res[0].bibstart + res[1].join('') + res[0].bibend;
        }
        const expected = ('' + test.RESULT).replace(/\r/g, '');
        const pass = actual === expected;
        return { name, pass, actual: actual.slice(0, 160), expected: expected.slice(0, 160) };
    } catch (e) {
        return { name, error: 'run: ' + e.message };
    }
}

const filter = process.argv[2] || null;
const verbose = process.argv.includes('-v');
const files = fs.readdirSync(FIX_DIR).filter((f) => f.endsWith('.txt')).sort();
let total = 0, passed = 0, failed = 0, errored = 0, skipped = 0;
const fails = [];
for (const f of files) {
    if (filter && !f.includes(filter)) continue;
    const r = runFixture(f.replace(/\.txt$/, ''));
    if (r === null) { skipped++; continue; }
    total++;
    if (r.pass) passed++;
    else if (r.error) { errored++; fails.push(r); }
    else { failed++; fails.push(r); }
}
console.log(`ran=${total} passed=${passed} failed=${failed} errored=${errored} skipped=${skipped}`);
if (verbose) {
    for (const r of fails.slice(0, 40)) {
        console.log('--- ' + r.name + (r.error ? ' ERROR' : ' FAIL'));
        if (r.error) console.log('  ' + r.error);
        else { console.log('  actual:   ' + JSON.stringify(r.actual)); console.log('  expected: ' + JSON.stringify(r.expected)); }
    }
}
