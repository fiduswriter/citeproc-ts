#!/bin/bash
# Build and deploy the demo to Codeberg Pages.
# Run from the project root.  Does everything in one shot.
set -euo pipefail

echo "==> Building citeproc.js..."
npm run build --silent

echo "==> Preparing pages content..."
rm -rf _pages
mkdir _pages
cp citeproc.js _pages/
cp -r demo/* _pages/
cp logo.svg _pages/
sed -i 's|src="../citeproc.js"|src="./citeproc.js"|' _pages/index.html

echo "==> Pushing to pages branch..."
cd _pages
git init -q
git add -A
git commit -q -m "Deploy demo" || true
git push -f git@codeberg.org:fiduswriter/citeproc-ts.git HEAD:pages
cd ..
rm -rf _pages

echo "==> Done — https://fiduswriter.codeberg.page/citeproc-ts/"
