#!/usr/bin/env node
/*
 * Build citeproc bundles from the modular TypeScript entry point.
 *
 * Outputs:
 *   citeproc.mjs          – ES module (Node.js: primary via "main" / "exports")
 *   citeproc.js           – ES module (browser: <script type="module">, same as .mjs)
 *   citeproc_commonjs.js  – CommonJS (internal: test-runner only, NOT published)
 */
'use strict';

const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const ROOT = path.join(__dirname, '..');
const ENTRY = path.join(ROOT, 'src', 'index.ts');

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

'use strict';
/*global CSL: true */
`;

async function build() {
    // 1. ES module for Node.js (primary: "main" / "exports")
    const esmFile = path.join(ROOT, 'citeproc.mjs');
    await esbuild.build({
        entryPoints: [ENTRY],
        bundle: true,
        platform: 'neutral',
        format: 'esm',
        target: 'es2018',
        outfile: esmFile,
        banner: { js: LICENSE_HEADER },
        logLevel: 'info'
    });

    // 2. Copy as citeproc.js for browser <script type="module"> use (demo pages)
    fs.copyFileSync(esmFile, path.join(ROOT, 'citeproc.js'));

    // 3. CommonJS – internal use by the test-runner only
    await esbuild.build({
        entryPoints: [ENTRY],
        bundle: true,
        platform: 'node',
        format: 'cjs',
        target: 'node14',
        outfile: path.join(ROOT, 'citeproc_commonjs.js'),
        banner: { js: LICENSE_HEADER },
        logLevel: 'info'
    });

    process.stdout.write('Built citeproc.mjs + citeproc.js + citeproc_commonjs.js\n');
}

build().catch((err) => {
    console.error(err);
    process.exit(1);
});
