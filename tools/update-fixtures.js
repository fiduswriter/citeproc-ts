#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const FIXTURES_DIR = path.join(ROOT, 'fixtures', 'local');

async function main() {
    const config = (await import(path.join(ROOT, 'test-runner', 'dist', 'lib', 'configs.js'))).getConfig(
        path.join(ROOT, 'test-runner', 'dist')
    );
    const { createSys } = await import(path.join(ROOT, 'test-runner', 'dist', 'lib', 'sys.js'));
    const Sys = await createSys(config);
    const { parseFixture } = await import(path.join(ROOT, 'test-runner', 'dist', 'lib', 'fixture-parser.js'));

    function updateFixture(fixtureName) {
        var filePath = path.join(FIXTURES_DIR, fixtureName + '.txt');
        if (!fs.existsSync(filePath)) {
            console.log('NOT FOUND:', fixtureName);
            return;
        }

        var test = parseFixture({}, fixtureName, filePath);
        if (!test) {
            console.log('PARSE FAILED:', fixtureName);
            return;
        }

        try {
            var sys = new Sys(config, test, []);
            sys.preloadAbbreviationSets(config);
            var actual = sys.run();

            if (actual === test.RESULT) {
                console.log('ALREADY MATCHES:', fixtureName);
                return;
            }

            var rawContent = fs.readFileSync(filePath, 'utf8');
            var resultRegex = /(>>={2,5} RESULT ={2,5}>>\n)([\s\S]*?)(\n<<={2,5} RESULT ={2,5}<<)/;
            if (!resultRegex.test(rawContent)) {
                resultRegex = /(>>=+ RESULT =+>>\r?\n)([\s\S]*?)(\r?\n<<=+ RESULT =+<<)/;
            }
            var updated = rawContent.replace(resultRegex, '$1' + actual + '$3');

            if (updated === rawContent) {
                console.log('NO RESULT SECTION:', fixtureName);
                return;
            }

            fs.writeFileSync(filePath, updated, 'utf8');
            console.log('UPDATED:', fixtureName);
        } catch (e) {
            console.log('ERROR:', fixtureName, '-', e.message);
        }
    }

    var args = process.argv.slice(2);
    if (args.length === 0) {
        console.log('Usage: node tools/update-fixtures.js <fixtureName> [<fixtureName> ...]');
        process.exit(1);
    }

    for (var i = 0; i < args.length; i++) {
        updateFixture(args[i]);
    }
}

main().catch(err => { console.error(err); process.exit(1); });
