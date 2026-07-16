<p align="center"><img src="logo.svg" width="80" alt="citeproc-ts"></p>

# citeproc-ts

> A TypeScript fork of [citeproc-js](https://github.com/Juris-M/citeproc-js) — a Citation Style Language (CSL) processor for JavaScript, with a modernized code structure.

This is a fork of citeproc-js with relatively few changes beyond:

- Porting the codebase from raw JavaScript to **TypeScript**
- Adopting a modern project structure (esbuild bundling, local dev dependencies, gitignored build artifacts)
- Replacing the Java-based Jing RELAX NG validator with a **pure-JavaScript RNC validator** (`tools/rnc-validator.js`)

The processor itself — CSL style parsing, citation formatting, bibliography generation — follows citeproc-js closely, with minimal rendering changes. All 1,518 integration tests pass.

**→ [Live demo](https://fiduswriter.codeberg.page/citeproc-ts/)** — renders Chicago-style citations and bibliography in the browser.

## Credits

This project is derived from **citeproc-js**, created and maintained over many years by:

- **Michael McMillan** — original author
- **Frank Bennett** — long-time maintainer, added CSL-M extensions for multilingual and legal content

citeproc-js powers the word processor integrations in both [Zotero](https://www.zotero.org) and [Mendeley](https://www.mendeley.com).

## Building

```bash
npm install
npm run build          # builds citeproc.mjs
npm run build:runner   # compiles the test runner
```

## Running Tests

```bash
npm test               # builds + runs all 1,518 tests (no Java required)
```

The test runner (`cslrun`) is included locally — no global installs needed.

## License

CPAL-1.0 OR AGPL-3.0-or-later (same as citeproc-js).

The test runner component (`test-runner/`) is MIT (original author: Frank Bennett).

## Repository

<https://codeberg.org/fiduswriter/citeproc-ts>
