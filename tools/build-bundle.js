#!/usr/bin/env node
/*
 * Build citeproc.js and citeproc_commonjs.js bundles from the src/ tree.
 *
 * The source files are concatenated in the order published by the
 * citeproc-test-runner package (lib/sources.js).  The first source
 * file (load.js) opens the top-level `var CSL = { ... }` object, the
 * remaining files extend it, and the CommonJS bundle is closed with a
 * `module.exports = CSL` statement.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '..', 'src');

// Order of source files, copied from citeproc-test-runner/lib/sources.js
const SOURCES = [
    'load', 'xmljson', 'xmldom', 'system', 'sort', 'util_disambig',
    'util_nodes', 'util_dateparser', 'build', 'util_static_locator',
    'util_processor', 'util_citationlabel', 'api_control', 'queue', 'state',
    'api_cite', 'api_bibliography', 'util_integration', 'api_update',
    'util_locale', 'util_locale_sniff', 'node_bibliography', 'node_choose',
    'node_citation', 'node_comment', 'node_date', 'node_datepart',
    'node_elseif', 'node_else', 'node_etal', 'node_group', 'node_if',
    'node_conditions', 'node_condition', 'util_conditions', 'node_info',
    'node_institution', 'node_institutionpart', 'node_key', 'node_label',
    'node_layout', 'node_macro', 'node_alternative', 'node_alternativetext',
    'util_names_output', 'util_names_tests', 'util_names_truncate',
    'util_names_divide', 'util_names_join', 'util_names_common',
    'util_names_constraints', 'util_names_disambig', 'util_names_etalconfig',
    'util_names_etal', 'util_names_render', 'util_publishers', 'util_label',
    'node_name', 'node_namepart', 'node_names', 'node_number', 'node_sort',
    'node_substitute', 'node_text', 'node_intext', 'attributes', 'stack',
    'util_parallel', 'util', 'util_transform', 'obj_token', 'obj_ambigconfig',
    'obj_blob', 'obj_number', 'util_datenode', 'util_date', 'util_names',
    'util_dates', 'util_sort', 'util_substitute', 'util_number', 'util_page',
    'util_flipflop', 'formatters', 'formats', 'registry', 'disambig_names',
    'disambig_citations', 'disambig_cites', 'util_modules', 'util_name_particles'
];

function buildBundle() {
    const header = fs.readFileSync(path.join(__dirname, '..', 'citeproc.js'), 'utf8')
        .split('/*global CSL: true */')[0].replace(/\s+$/, '');
    const parts = [header];
    for (const name of SOURCES) {
        const file = path.join(SRC_DIR, name + '.js');
        if (!fs.existsSync(file)) {
            throw new Error('Missing source file: ' + file);
        }
        parts.push(fs.readFileSync(file, 'utf8'));
    }
    return parts.join('\n');
}

function main() {
    const body = buildBundle();
    const browser = body + '\n';
    const commonjs = body + '\n\nmodule.exports = CSL';
    fs.writeFileSync(path.join(__dirname, '..', 'citeproc.js'), browser);
    fs.writeFileSync(path.join(__dirname, '..', 'citeproc_commonjs.js'), commonjs);
    process.stdout.write('Built citeproc.js and citeproc_commonjs.js\n');
}

if (require.main === module) {
    main();
}

module.exports = { buildBundle, SOURCES };
