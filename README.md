# citeproc-ts Demo

A live demo of the CSL processor rendering citations and bibliographies in the browser.

## Running

Build the processor first from the project root:

```bash
npm run build
```

Then serve this directory:

```bash
cd demo
npm install
npx http-server . -p 8080
```

Open `http://localhost:8080/demo.html` in your browser.

Alternatively, any static file server (Python, Apache, etc.) will work — just serve from the project root so that `../citeproc.mjs` resolves to the built bundle.
