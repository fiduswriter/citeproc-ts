#!/usr/bin/env node
/**
 * Convert bare side-effect imports (import './foo') to named exports.
 * Processes each file, finds top-level CSL.xxx assignments,
 * converts them to export declarations, and updates index.ts.
 */

import fs from 'fs';
import path from 'path';
import ts from 'typescript';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const CSL_IMPORT_REGEX = /^import\s*\{\s*CSL\s*\}\s*from\s['"]\.\.?\/csl['"];?/m;

function processFile(filePath) {
  const source = fs.readFileSync(filePath, 'utf-8');
  const lines = source.split('\n');
  const result = [];
  const exports = new Map();

  if (!source.includes('CSL.')) return null;

  let converted = false;
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
      result.push(line);
      i++;
      continue;
    }

    result.push(line);
    i++;
  }

  return null;
}

function convertSimplePatterns(filePath) {
  let source = fs.readFileSync(filePath, 'utf-8');
  const basename = path.basename(filePath, '.ts');
  const oldLines = source.split('\n');
  const newLines = [];
  const allExports = [];

  let i = 0;
  while (i < oldLines.length) {
    const line = oldLines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*') ||
        trimmed.startsWith('import') || trimmed.startsWith('///') || trimmed.startsWith('/*global')) {
      newLines.push(line);
      i++;
      continue;
    }

    if (/^\s*CSL\.\w+\s*[=:]/.test(trimmed) || /^\s*CSL\.\w+\.\w+\s*[=:]/.test(trimmed)) {
      let stmtLines = [line];
      let j = i + 1;
      let braceCount = (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
      while (j < oldLines.length && braceCount > 0) {
        const next = oldLines[j];
        stmtLines.push(next);
        braceCount += (next.match(/{/g) || []).length;
        braceCount -= (next.match(/}/g) || []).length;
        j++;
      }
      i = j;
      const stmt = stmtLines.join('\n');

      const match = stmt.match(/^\s*CSL\.(\w+(?:\.\w+)*)\s*[=:]/);
      if (match) {
        const cslPath = match[1];
        const exportName = cslPath.replace(/\./g, '_');
        const afterEquals = stmt.slice(stmt.indexOf('=') + 1).trim();

        if (afterEquals.startsWith('{') || afterEquals.startsWith('[')) {
          newLines.push(`export const ${exportName} = ${afterEquals}`);
        } else if (afterEquals.startsWith('function')) {
          newLines.push(`export ${afterEquals}`);
        } else if (/^class\s/.test(afterEquals)) {
          newLines.push(`export ${afterEquals}`);
        } else if (/^new\s/.test(afterEquals)) {
          newLines.push(`export const ${exportName} = ${afterEquals}`);
        } else {
          newLines.push(`export const ${exportName} = ${afterEquals}`);
        }

        allExports.push({ cslPath, exportName });
        converted = true;
      } else {
        newLines.push(line);
        i++;
      }
    } else if (/^\s*\}\s*$/.test(trimmed) && i > 0 && /^\s*CSL\./.test(oldLines[i-1])) {
      newLines.push(line);
      i++;
    } else {
      newLines.push(line);
      i++;
    }
  }

  if (allExports.length === 0) return { file: filePath, exports: [] };

  const newSource = newLines.join('\n');
  const stillNeedsCSL = /\bCSL\./.test(newSource.replace(/^(import|export)/m, ''));

  let finalSource;
  if (!stillNeedsCSL) {
    finalSource = newSource.replace(/^import\s*\{\s*CSL\s*\}\s*from\s.*csl.*;?\n?/m, '');
  } else {
    finalSource = newSource;
  }

  fs.writeFileSync(filePath, finalSource, 'utf-8');
  return { file: filePath, exports: allExports };
}

const srcDir = path.join(__dirname, '..', 'src');
const indexFile = path.join(srcDir, 'index.ts');

let indexSource = fs.readFileSync(indexFile, 'utf-8');
const bareImports = [];
const indexLines = indexSource.split('\n');
for (const line of indexLines) {
  const m = line.match(/^import '\.\/(.+?)';$/);
  if (m) {
    bareImports.push(m[1]);
  }
}

console.log(`Found ${bareImports.length} bare imports in index.ts`);

const allNewImports = [];

for (const impPath of bareImports) {
  const fullPath = path.join(srcDir, impPath + '.ts');
  if (!fs.existsSync(fullPath)) {
    console.log(`  SKIP (not found): ${impPath}`);
    continue;
  }
  const result = convertSimplePatterns(fullPath);
  if (result && result.exports.length > 0) {
    allNewImports.push(result);
    console.log(`  CONVERT: ${impPath} → { ${result.exports.map(e => e.exportName).join(', ')} }`);
  } else {
    console.log(`  SKIP (no CSL exports): ${impPath}`);
  }
}

let newIndexLines = [];
for (const line of indexLines) {
  const m = line.match(/^import '\.\/(.+?)';$/);
  if (m) {
    const impPath = m[1];
    const result = allNewImports.find(r => {
      const rPath = path.relative(srcDir, r.file).replace(/\.ts$/, '');
      return rPath === impPath;
    });
    if (result && result.exports.length > 0) {
      const exportNames = result.exports.map(e => e.exportName).join(', ');
      const relPath = path.relative(srcDir, result.file).replace(/\.ts$/, '');
      newIndexLines.push(`import { ${exportNames} } from './${relPath}';`);
      for (const exp of result.exports) {
        newIndexLines.push(`CSL.${exp.cslPath} = ${exp.exportName};`);
      }
    } else {
      newIndexLines.push(line);
    }
  } else {
    newIndexLines.push(line);
  }
}

fs.writeFileSync(indexFile, newIndexLines.join('\n'), 'utf-8');
console.log('\nUpdated index.ts');

console.log('\nRunning tsc --noEmit...');
try {
  execSync('npx tsc --noEmit', {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit'
  });
} catch (e) {
  console.log('tsc reported errors.');
}
