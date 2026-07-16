import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseFixture } from '../test-runner/dist/lib/fixture-parser.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const FIX_DIR = path.join(ROOT, 'fixtures', 'std', 'processor-tests', 'humans');
const LOCALE = fs.readFileSync(path.join(ROOT, 'locale', 'locales-en-US.xml'), 'utf8').replace(/\s*<\?[^>]*\?>\s*\n/g, '');

function runFixture(name, CSL) {
    let test;
    try { test = parseFixture({}, name, path.join(FIX_DIR, name + '.txt')); } catch (e) { return null; }
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
    try { engine = new CSL.Engine(sys, test.CSL); } catch (e) { return null; }
    if (test.options) {
        for (const opt of Object.keys(test.options)) {
            if (opt === 'variableWrapper') continue;
            if (typeof engine.opt.development_extensions !== 'object') return null;
            engine.opt.development_extensions[opt] = test.options[opt];
        }
    }
    try {
        if (test.BIBENTRIES) { for (const idSet of test.BIBENTRIES) engine.updateItems(idSet); }
        else { engine.updateItems(items.map((i) => '' + i.id)); }
        let actual;
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
                            if (d && d.citationID === insert?.[2]) { d.prefix = '>>'; d.String = insert[1]; result[j] = null; replaced = true; break; }
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
        const pass = actual === expected;
        return { name, mode, pass, actual: actual || '', expected };
    } catch (e) {
        return { name, error: e.message };
    }
}

async function main() {
    const CSL = (await import(path.join(ROOT, 'citeproc.mjs'))).default;

    const files = fs.readdirSync(FIX_DIR).filter(f => f.endsWith('.txt')).sort();
    const fails = [];
    for (const f of files) {
        const r = runFixture(f.replace(/\.txt$/, ''), CSL);
        if (r && !r.pass && !r.error) {
            let diffPos = 0;
            while (diffPos < r.actual.length && diffPos < r.expected.length && r.actual[diffPos] === r.expected[diffPos]) diffPos++;
            const ctxA = r.actual.slice(Math.max(0, diffPos - 20), diffPos + 80);
            const ctxE = r.expected.slice(Math.max(0, diffPos - 20), diffPos + 80);
            fails.push({ ...r, diffPos, ctxA, ctxE });
        }
    }

    console.log(`Total failures: ${fails.length}`);
    const modes = {};
    for (const f of fails) {
        if (!modes[f.mode]) modes[f.mode] = [];
        modes[f.mode].push(f);
    }
    for (const [mode, list] of Object.entries(modes)) {
        console.log(`\n${mode}: ${list.length} failures`);
    }

    for (const f of fails.slice(0, 20)) {
        console.log(`\n--- ${f.name} (${f.mode}) diff at ${f.diffPos} ---`);
        if (f.actual.includes('CSL STYLE ERROR')) {
            console.log('  [STYLE ERROR — item data not found]');
        }
        console.log('  actual:   ' + JSON.stringify(f.ctxA));
        console.log('  expected: ' + JSON.stringify(f.ctxE));
    }
}

main().catch(err => { console.error(err); process.exit(1); });
