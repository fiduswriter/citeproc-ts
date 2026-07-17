#!/usr/bin/env node
/*
 * Build the citeproc ESM bundle from the modular TypeScript entry point.
 *
 * Outputs:
 *   citeproc.mjs      – Full bundle (ES module, includes XML parsing)
 *   citeproc-core.mjs – Core bundle (no XML/DOM parsing, smaller, tree-shakeable)
 */

import fs from 'fs';
import path from 'path';
import esbuild from 'esbuild';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const LICENSE_HEADER = `/*
Copyright (c) 2009-2019 Frank Bennett

\tThis program is free software: you can redistribute it and/or
\tmodify it under EITHER

      * the terms of the Common Public Attribution License (CPAL) as
\t    published by the Open Source Initiative, either version 1 of
\t    the CPAL, or (at your option) any later version; OR

      * the terms of the GNU Affero General Public License (AGPL)
        as published by the Free Software Foundation, either version
        3 of the AGPL, or (at your option) any later version.

\tThis program is distributed in the hope that it will be useful,
\tbut WITHOUT ANY WARRANTY; without even the implied warranty of
\tMERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
\tAffero General Public License for more details.

\tYou should have received copies of the Common Public Attribution
\tLicense and the GNU Affero General Public License along with this
\tprogram.  If not, see <http://opensource.org/licenses/CPAL-1.0>
\tand <http://www.gnu.org/licenses/>.
*/

/*global CSL: true */
`;

const SRC = path.join(ROOT, 'src');

/**
 * Redirect imports of ../system and ./system to system-core.ts
 * so the core bundle excludes XML/DOM parsing code.
 */
const corePlugin = {
    name: 'core',
    setup(build) {
        build.onResolve({ filter: /system$/ }, (args) => {
            if (args.path.endsWith('-core')) {
                return;
            }
            if (args.importer && args.importer.startsWith(SRC)) {
                const resolved = path.resolve(args.resolveDir, args.path) + '.ts';
                const coreTs = path.join(SRC, 'system-core.ts');
                if (resolved === path.join(SRC, 'system.ts')) {
                    return { path: coreTs };
                }
            }
        });
    },
};

async function buildBundle(name, entry, extraPlugins) {
    const outfile = path.join(ROOT, name + '.mjs');
    await esbuild.build({
        entryPoints: [path.join(SRC, entry)],
        bundle: true,
        platform: 'neutral',
        format: 'esm',
        target: 'es2018',
        outfile,
        banner: { js: LICENSE_HEADER },
        logLevel: 'info',
        plugins: extraPlugins || [],
    });
    process.stdout.write('Built ' + outfile + '\n');
}

async function build() {
    await buildBundle('citeproc', 'index.ts');
    await buildBundle('citeproc-core', 'core.ts', [corePlugin]);
}

build().catch((err) => {
    console.error(err);
    process.exit(1);
});
