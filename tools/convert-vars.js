#!/usr/bin/env node
/**
 * Convert var → let/const in TypeScript source files.
 * Uses ts-morph (TypeScript compiler wrapper) for AST-aware conversion.
 *
 * Usage: node tools/convert-vars.js [files...]
 *   If no files given, converts all src/ .ts files that still have 'var'.
 */

import ts from "typescript";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function collectFiles(root) {
  const result = [];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory() && entry.name !== "node_modules") {
        walk(p);
      } else if (entry.isFile() && entry.name.endsWith(".ts")) {
        result.push(p);
      }
    }
  }
  walk(root);
  return result;
}

function hasVar(text) {
  return /\bvar\s+/.test(text);
}

function convertFile(filePath) {
  const sourceText = fs.readFileSync(filePath, "utf-8");
  if (!hasVar(sourceText)) return false;

  const sourceFile = ts.createSourceFile(
    path.basename(filePath),
    sourceText,
    ts.ScriptTarget.Latest,
    true
  );

  const varInfo = new Map();

  function getVarInfo(name) {
    if (!varInfo.has(name)) {
      varInfo.set(name, { declarations: new Set(), assignments: new Set(), scopes: [] });
    }
    return varInfo.get(name);
  }

  function visit(node, scopeChain) {
    if (ts.isVariableDeclaration(node)) {
      if (node.parent && ts.isVariableDeclarationList(node.parent)) {
        if (node.parent.flags & ts.NodeFlags.Let || node.parent.flags & ts.NodeFlags.Const) {
        } else if (node.parent.flags & ts.NodeFlags.Var) {
          const name = ts.isIdentifier(node.name) ? node.name.text : null;
          if (name) {
            const info = getVarInfo(name);
            info.declarations.add(node);
            info.scopes.push([...scopeChain, "function"]);
            const parent = node.parent.parent;
            if (parent && (ts.isForStatement(parent) || ts.isForInStatement(parent) || ts.isForOfStatement(parent))) {
              info.isLoopVar = true;
            }
          }
        }
      }
    }

    if (ts.isBinaryExpression(node) &&
        (node.operatorToken.kind === ts.SyntaxKind.EqualsToken ||
         node.operatorToken.kind === ts.SyntaxKind.PlusEqualsToken ||
         node.operatorToken.kind === ts.SyntaxKind.MinusEqualsToken)) {
      if (ts.isIdentifier(node.left)) {
        const name = node.left.text;
        const info = getVarInfo(name);
        info.assignments.add(node);
      }
    }

    if ((ts.isPostfixUnaryExpression(node) || ts.isPrefixUnaryExpression(node)) &&
        (node.operator === ts.SyntaxKind.PlusPlusToken || node.operator === ts.SyntaxKind.MinusMinusToken)) {
      if (ts.isIdentifier(node.operand)) {
        const name = node.operand.text;
        const info = getVarInfo(name);
        info.assignments.add(node);
      }
    }

    ts.forEachChild(node, child => visit(child, scopeChain));
  }

  visit(sourceFile, ["global"]);

  const reassignedNames = new Set();
  for (const [name, info] of varInfo) {
    for (const dec of info.declarations) {
      for (const assign of info.assignments) {
        if (assign.pos !== dec.pos) {
          reassignedNames.add(name);
          break;
        }
      }
    }
  }

  let result = sourceText;
  const replacements = [];

  function processNode(node) {
    if (ts.isVariableDeclarationList(node)) {
      if (node.flags & ts.NodeFlags.Var) {
        const varPos = node.getStart(sourceFile);
        const varEnd = varPos + 3;

        if (node.parent && ts.isVariableStatement(node.parent)) {
          const declarations = node.declarations;
          if (declarations.length === 1) {
            const name = ts.isIdentifier(declarations[0].name) ? declarations[0].name.text : null;
            if (name) {
              const keyword = reassignedNames.has(name) ? "let" : "const";
              replacements.push({ start: varPos, end: varEnd, text: keyword });
            }
          } else {
            replacements.push({ start: varPos, end: varEnd, text: "let" });
          }
        } else if (node.parent &&
                   (ts.isForStatement(node.parent) ||
                    ts.isForInStatement(node.parent) ||
                    ts.isForOfStatement(node.parent))) {
          const declarations = node.declarations;
          if (declarations.length === 1) {
            const name = ts.isIdentifier(declarations[0].name) ? declarations[0].name.text : null;
            if (name) {
              if (ts.isForInStatement(node.parent) || ts.isForOfStatement(node.parent)) {
                replacements.push({ start: varPos, end: varEnd, text: "const" });
              } else {
                replacements.push({ start: varPos, end: varEnd, text: "let" });
              }
            }
          }
        }
      }
    }
    ts.forEachChild(node, processNode);
  }

  processNode(sourceFile);

  replacements.sort((a, b) => b.start - a.start);
  for (const r of replacements) {
    result = result.slice(0, r.start) + r.text + result.slice(r.end);
  }

  if (result !== sourceText) {
    fs.writeFileSync(filePath, result, "utf-8");
    return true;
  }
  return false;
}

const args = process.argv.slice(2);
let files;
if (args.length > 0) {
  files = args.filter(f => fs.existsSync(f) && f.endsWith(".ts") && hasVar(fs.readFileSync(f, "utf-8")));
} else {
  files = collectFiles(path.join(__dirname, "..", "src")).filter(f => hasVar(fs.readFileSync(f, "utf-8")));
}

console.log(`Found ${files.length} files with 'var' declarations.`);

let converted = 0;
for (const f of files) {
  const relPath = path.relative(path.join(__dirname, ".."), f);
  try {
    if (convertFile(f)) {
      console.log(`  Converted: ${relPath}`);
      converted++;
    }
  } catch (e) {
    console.error(`  ERROR: ${relPath}: ${e.message}`);
  }
}

console.log(`\nConverted ${converted} files.`);

console.log("\nRunning tsc --noEmit...");
try {
  execSync("npx tsc --noEmit", { cwd: path.join(__dirname, ".."), stdio: "inherit" });
} catch (e) {
  console.log("\ntsc reported errors.");
}
