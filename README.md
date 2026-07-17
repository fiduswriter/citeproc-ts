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

## Bundles

Two ESM bundles are published:

| Bundle | File | Size | Description |
|---|---|---|---|
| **Full** | `citeproc.mjs` | ~765 KB | Compatible with citeproc-js API. Includes XML/DOM parsing. |
| **Core** | `citeproc-core.mjs` | ~683 KB | No XML/DOM parsing. For consumers that provide pre-parsed JSON styles/locales (e.g. citeproc-plus). Allows bundlers to tree-shake unused code. |

Both export a `CSL` namespace identical in shape, except the core bundle omits `parseXml`, `stripXmlProcessingInstruction`, `XmlDOM`, and `setupXml`.

---

## Usage

### Traditional interface (full bundle)

```js
import { CSL } from 'citeproc-ts';

const sys = {
    retrieveLocale(lang) { /* return locale XML/JSON string */ },
    retrieveItem(id)     { /* return citation item object */ },
};

const engine = new CSL.Engine(sys, styleXmlString, 'en-US');
engine.previewCitationCluster(...);
engine.makeBibliography(...);
```

The full bundle is a drop-in replacement for citeproc-js. Pass CSL XML strings, JSON strings, or pre-parsed objects — `setupXml` handles all formats.

### Tree-shakeable interface (core bundle)

```js
import { CSL } from 'citeproc-ts/core';

const sys = {
    retrieveLocale(lang) { /* return JSON object — never raw XML */ },
    retrieveItem(id)     { /* return citation item object */ },
};

// Pass a pre-parsed JS object (e.g. JSON.parse(…)) or an XmlJSON instance
const engine = new CSL.Engine(sys, styleObject, 'en-US');
engine.previewCitationCluster(...);
engine.makeBibliography(...);
```

The core bundle omits the `parseXml()` XML parser and `XmlDOM` DOM wrapper. Use it when your style/locale data is always pre-parsed JSON (objects or JSON strings). This reduces bundle size and lets bundlers tree-shake the XML processing code entirely.

> **Note**: If you pass an XML string or a DOM node to the core bundle, `setupXml` will log an error and return a stub parser. Always provide JSON objects or JSON strings.

### Selecting the right bundle

| Your data format | Recommended import |
|---|---|
| CSL XML strings | `'citeproc-ts'` (full) |
| Mix of XML and JSON | `'citeproc-ts'` (full) |
| Pre-parsed JS objects only | `'citeproc-ts/core'` (core) |
| JSON strings only | `'citeproc-ts/core'` (core) |

### Advanced: using `internals`

The `internals` object (`CSL.internals`) provides hooks for host environment integration:

```js
CSL.debug = function (str) { myLogger.debug('CSL: ' + str); };
CSL.error = function (str) { myLogger.error('CSL: ' + str); };
CSL.stringCompare = function (a, b) { return myCollator.compare(a, b); };
```

This is the extension point originally designed for XSL integration. You can override `getAbbreviation`, `retrieveStyleModule`, and other callbacks here.

---

## Building

```bash
npm install
npm run build          # builds citeproc.mjs and citeproc-core.mjs
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
