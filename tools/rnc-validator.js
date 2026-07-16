#!/usr/bin/env node
'use strict';

import fs from 'fs';
import path from 'path';

const DEBUG = process.env.RNC_DEBUG === '1';

function warn(msg) {
    if (DEBUG) process.stderr.write('RNC: ' + msg + '\n');
}

// ---------------------------------------------------------------------------
// Tokenizer
// ---------------------------------------------------------------------------
function isIdentStart(c) { return /[a-zA-Z_]/.test(c); }
function isIdentPart(c) { return /[a-zA-Z0-9_\-\.\:\/\#]/.test(c); }
function isSpace(c) { return /\s/.test(c); }

function tokenize(src) {
    let tokens = [];
    let pos = 0;
    let len = src.length;

    function skipWs() {
        while (pos < len && isSpace(src[pos])) pos++;
    }
    function skipLineComment() {
        while (pos < len && src[pos] !== '\n') pos++;
    }
    function skipAnnotation() {
        // Skip [ ... ] with proper nesting
        let depth = 1;
        pos++; // skip opening [
        while (pos < len && depth > 0) {
            if (src[pos] === '[') depth++;
            else if (src[pos] === ']') depth--;
            else if (src[pos] === '"') { pos++; while (pos < len && src[pos] !== '"') pos++; } // skip quoted strings inside annotations
            pos++;
        }
    }

    while (pos < len) {
        skipWs();
        if (pos >= len) break;

        // Line comments
        if (src[pos] === '#') { skipLineComment(); continue; }

        // Annotations: [ ... ] - skip them entirely (they're metadata)
        if (src[pos] === '[') { skipAnnotation(); continue; }

        // Multi-line doc strings: \( ... \)
        if (src.slice(pos, pos + 2) === '\\(') {
            let escStart = pos;
            pos += 2;
            let escVal = '';
            while (pos < len && src[pos] !== '\\') { escVal += src[pos]; pos++; }
            if (src.slice(pos, pos + 2) === '\\)') pos += 2;
            tokens.push({type:'STRING',value:escVal,pos:escStart});
            continue;
        }

        // String literals: " ... "
        if (src[pos] === '"') {
            pos++; // skip opening "
            let strVal = '';
            while (pos < len && src[pos] !== '"') { strVal += src[pos]; pos++; }
            pos++; // skip closing "
            tokens.push({type:'STRING',value:strVal,pos:pos - strVal.length - 2});
            continue;
        }

        // Names / keywords
        if (isIdentStart(src[pos])) {
            let identStart = pos;
            let ident = '';
            while (pos < len && isIdentPart(src[pos])) { ident += src[pos]; pos++; }
            let kw = KEYWORDS[ident];
            if (kw !== undefined) {
                tokens.push({type:kw, value:ident, pos:identStart});
            } else {
                tokens.push({type:'NAME', value:ident, pos:identStart});
            }
            continue;
        }

        // Two-char symbols first (|=, &=)
        let ch2 = src.slice(pos, pos + 2);
        if (SYMBOLS[ch2]) { tokens.push({type:SYMBOLS[ch2], value:ch2, pos:pos}); pos += 2; continue; }

        // Single-char symbols
        let ch = src[pos];
        if (SYMBOLS[ch]) { tokens.push({type:SYMBOLS[ch], value:ch, pos:pos}); pos++; continue; }

        throw new Error('Unexpected character at position ' + pos + ': ' + JSON.stringify(src.slice(pos, pos+20)));
    }
    tokens.push({type:'EOF',value:'',pos:pos});
    return tokens;
}

let KEYWORDS = {
    'element': 'ELEMENT', 'attribute': 'ATTRIBUTE', 'text': 'TEXT_KW',
    'string': 'STRING_KW', 'list': 'LIST', 'include': 'INCLUDE',
    'div': 'DIV', 'namespace': 'NAMESPACE', 'default': 'DEFAULT',
    'notAllowed': 'NOTALLOWED', 'empty': 'EMPTY', 'start': 'START'
};

let SYMBOLS = {
    '=': 'EQ', '|=': 'COMBINE_CHOICE', '&=': 'COMBINE_INTERLEAVE',
    '|': 'CHOICE', '&': 'INTERLEAVE', ',': 'COMMA',
    '?': 'OPTIONAL', '*': 'STAR', '+': 'PLUS',
    '{': 'LBRACE', '}': 'RBRACE', '(': 'LPAREN', ')': 'RPAREN'
};

// ---------------------------------------------------------------------------
// Parser - builds an AST from tokens
// ---------------------------------------------------------------------------
function Parser(tokens) {
    this.tokens = tokens;
    this.pos = 0;
}

Parser.prototype.peek = function() { return this.tokens[this.pos]; };
Parser.prototype.next = function() { return this.tokens[this.pos++]; };

Parser.prototype.expect = function(type) {
    let t = this.next();
    if (t.type !== type) throw new Error('Expected ' + type + ' but got ' + t.type + ' (' + t.value + ') at ' + t.pos);
    return t;
};

// grammar := (namespace_decl | include | definition)*
Parser.prototype.parseGrammar = function() {
    let grammar = { definitions: {}, includes: [], start: null, namespaces: {} };
    while (this.peek().type !== 'EOF') {
        let t = this.peek();
        if (t.type === 'NAMESPACE') {
            this.next();
            let prefix = this.expect('NAME').value;
            this.expect('EQ');
            let uri = this.expect('STRING').value;
            grammar.namespaces[prefix] = uri;
        } else if (t.type === 'DEFAULT') {
            this.next();
            this.expect('NAMESPACE');
            let def = this.next();
            if (def.type === 'EQ' || def.type === 'NAME') {
                // default namespace = "uri"  or  default namespace ns = "uri"
                if (def.type === 'NAME' && def.value !== '=') {
                    this.expect('EQ');
                }
                let uri2 = this.expect('STRING').value;
                grammar.namespaces[''] = uri2;
            } else {
                throw new Error('Unexpected token after "default": ' + def.type);
            }
        } else if (t.type === 'INCLUDE') {
            this.next();
            let filePath = this.expect('STRING').value;
            let overrides = {};
            if (this.peek().type === 'LBRACE') {
                this.expect('LBRACE');
                while (this.peek().type !== 'RBRACE' && this.peek().type !== 'EOF') {
                    let def = this.parseDefinition();
                    if (def) overrides[def.name] = def.pattern;
                }
                this.expect('RBRACE');
            }
            grammar.includes.push({ file: filePath, overrides: overrides });
        } else if (t.type === 'DIV') {
            this.next();
            this.expect('LBRACE');
            while (this.peek().type !== 'RBRACE' && this.peek().type !== 'EOF') {
                if (this.peek().type === 'START') {
                    this.next();
                    this.expect('EQ');
                    grammar.start = this.parsePattern();
                } else {
                    let def2 = this.parseDefinition();
                    if (def2) grammar.definitions[def2.name] = def2.pattern;
                }
            }
            this.expect('RBRACE');
        } else if (t.type === 'START') {
            this.next();
            this.expect('EQ');
            grammar.start = this.parsePattern();
        } else if (t.type === 'NAME') {
            // Could be a definition or metadata (Schematron/dc/bibo namespaced annotation)
            // Check if next token is a definition operator
            let saved = this.pos;
            this.next(); // consume the NAME
            let next = this.peek();
            if (next.type === 'EQ' || next.type === 'COMBINE_CHOICE' || next.type === 'COMBINE_INTERLEAVE') {
                // Actually a definition - rewind and parse as definition
                this.pos = saved;
                let def3 = this.parseDefinition();
                if (def3) grammar.definitions[def3.name] = def3.pattern;
            }
            // Otherwise it was metadata (the annotation block [ ... ] was already skipped by the tokenizer)
        } else if (t.type === 'STRING') {
            // Bare string at top level - skip (metadata)
            this.next();
        } else {
            throw new Error('Unexpected token in grammar: ' + t.type + ' (' + t.value + ') at ' + t.pos);
        }
    }
    return grammar;
};

// definition := name ("=" | "|=" | "&=") pattern
Parser.prototype.parseDefinition = function() {
    let name = this.expect('NAME').value;
    let op = this.next();
    if (op.type !== 'EQ' && op.type !== 'COMBINE_CHOICE' && op.type !== 'COMBINE_INTERLEAVE') {
        throw new Error('Expected = or |= or &= after name "' + name + '" but got ' + op.type);
    }
    let pattern = this.parsePattern();
    return { name: name, op: op.type, pattern: pattern };
};

// pattern := choice_pattern
Parser.prototype.parsePattern = function() {
    return this.parseChoice();
};

// choice_pattern := interleave_pattern ("|" interleave_pattern)*
Parser.prototype.parseChoice = function() {
    let left = this.parseInterleave();
    while (this.peek().type === 'CHOICE') {
        this.next();
        let right = this.parseInterleave();
        left = { type: 'CHOICE', left: left, right: right };
    }
    return left;
};

// interleave_pattern := sequence_pattern ("&" sequence_pattern)*
Parser.prototype.parseInterleave = function() {
    let left = this.parseSequence();
    while (this.peek().type === 'INTERLEAVE') {
        this.next();
        let right = this.parseSequence();
        left = { type: 'INTERLEAVE', left: left, right: right };
    }
    return left;
};

// sequence_pattern := suffix_pattern ("," suffix_pattern)*
Parser.prototype.parseSequence = function() {
    let left = this.parseSuffix();
    while (this.peek().type === 'COMMA') {
        this.next();
        let right = this.parseSuffix();
        left = { type: 'SEQ', left: left, right: right };
    }
    return left;
};

// suffix_pattern := primary ("?" | "*" | "+")?
Parser.prototype.parseSuffix = function() {
    let node = this.parsePrimary();
    if (this.peek().type === 'OPTIONAL') { this.next(); node = { type: 'OPTIONAL', child: node }; }
    else if (this.peek().type === 'STAR') { this.next(); node = { type: 'STAR', child: node }; }
    else if (this.peek().type === 'PLUS') { this.next(); node = { type: 'PLUS', child: node }; }
    return node;
};

// primary := "(" pattern ")" | "element" QName "{" pattern "}" | "attribute" QName "{" pattern "}"
//          | "string" STRING | "list" "{" pattern "}" | "text" | "empty" | "notAllowed" | div | NAME
Parser.prototype.parsePrimary = function() {
    let t = this.peek();
    if (t.type === 'LPAREN') {
        this.next();
        let p = this.parsePattern();
        this.expect('RPAREN');
        return p;
    } else if (t.type === 'ELEMENT') {
        this.next();
        let name = this.parseQName();
        this.expect('LBRACE');
        let child = this.parsePattern();
        this.expect('RBRACE');
        return sanitizePattern({ type: 'ELEMENT', name: name, child: child });
    } else if (t.type === 'ATTRIBUTE') {
        this.next();
        let name = this.parseQName();
        this.expect('LBRACE');
        let child = this.parsePattern();
        this.expect('RBRACE');
        return sanitizePattern({ type: 'ATTRIBUTE', name: name, child: child });
    } else if (t.type === 'STRING_KW') {
        // "string" STRING - literal string content: string "value"
        this.next();
        let val = this.expect('STRING').value;
        return { type: 'STRING', value: val };
    } else if (t.type === 'STRING') {
        // Bare string literal: "value" (shorthand for string "value")
        this.next();
        return { type: 'STRING', value: t.value };
    } else if (t.type === 'LIST') {
        this.next();
        this.expect('LBRACE');
        let child = this.parsePattern();
        this.expect('RBRACE');
        return { type: 'LIST', child: child };
    } else if (t.type === 'TEXT_KW') {
        this.next();
        return { type: 'TEXT' };
    } else if (t.type === 'EMPTY') {
        this.next();
        return { type: 'EMPTY' };
    } else if (t.type === 'NOTALLOWED') {
        this.next();
        return { type: 'NOTALLOWED' };
    } else if (t.type === 'NAME') {
        this.next();
        let ref = { type: 'REF', name: t.value };
        // Handle type parameters: xsd:string { pattern = "..." }
        if (this.peek().type === 'LBRACE') {
            this.next(); // skip {
            let depth = 1;
            while (depth > 0 && this.pos < this.tokens.length) {
                let tt = this.next();
                if (tt.type === 'LBRACE') depth++;
                else if (tt.type === 'RBRACE') depth--;
            }
        }
        return ref;
    } else {
        throw new Error('Unexpected token in pattern: ' + t.type + ' (' + t.value + ') at ' + t.pos);
    }
};

Parser.prototype.parseQName = function() {
    let t = this.peek();
    if (t.type === 'NAME') {
        let val = this.next().value;
        if (this.peek().type === 'NAME' && this.peek().value === ':') {
            // Handle "cs : style" (with spaces)
            this.next();
            let name2 = this.expect('NAME').value;
            return val + ':' + name2;
        }
        let parts = val.split(':');
        if (parts.length === 2) {
            return { ns: parts[0], local: parts[1] };
        }
        return { ns: '', local: val };
    }
    throw new Error('Expected QName but got ' + t.type);
};

function sanitizePattern(node) {
    if (!node) return node;
    // Normalize binary SEQ into children array
    if (node.type === 'SEQ' && !node.children && node.left && node.right) {
        let seqChildren = [];
        (function collect(n) {
            if (n.type === 'SEQ' && !n.children && n.left && n.right) {
                collect(n.left);
                collect(n.right);
            } else if (n.type === 'SEQ' && n.children) {
                for (let i = 0; i < n.children.length; i++) collect(n.children[i]);
            } else {
                seqChildren.push(n);
            }
        })(node);
        node = { type: 'SEQ', children: seqChildren };
    }
    // Recursively normalize sub-patterns
    let childKey = node.child || (node.children ? 'children' : null) || node.left || node.right;
    if (!childKey) return node;
    if (node.child) { node.child = sanitizePattern(node.child); }
    if (node.children) { for (let i = 0; i < node.children.length; i++) node.children[i] = sanitizePattern(node.children[i]); }
    if (node.left) { node.left = sanitizePattern(node.left); }
    if (node.right) { node.right = sanitizePattern(node.right); }
    return node;
}

function sanitizeGrammar(grammar) {
    for (let key in grammar.definitions) {
        grammar.definitions[key] = sanitizePattern(grammar.definitions[key]);
    }
    if (grammar.start) {
        grammar.start = sanitizePattern(grammar.start);
    }
    return grammar;
}

// ---------------------------------------------------------------------------
// Include Resolver
// ---------------------------------------------------------------------------
function resolveIncludes(grammar, baseDir, visited) {
    visited = visited || new Set();
    let resolvedDefs = Object.assign({}, grammar.definitions);
    let resolved = { definitions: resolvedDefs, start: grammar.start, namespaces: Object.assign({}, grammar.namespaces) };

    for (let inc of grammar.includes) {
        let incPath = path.resolve(baseDir, inc.file);
        let absPath = incPath;
        // Try .rnc extension if not specified
        if (!fs.existsSync(absPath) && !path.extname(absPath)) {
            absPath = incPath + '.rnc';
        }
        if (!fs.existsSync(absPath)) {
            warn('Included file not found: ' + incPath);
            continue;
        }
        if (visited.has(absPath)) continue;
        visited.add(absPath);

        let src = fs.readFileSync(absPath, 'utf8');
        let tokens = tokenize(src);
        let parser = new Parser(tokens);
        let incGrammar = parser.parseGrammar();
        incGrammar = resolveIncludes(incGrammar, path.dirname(absPath), visited);

        // Merge definitions from included grammar
        for (let key in incGrammar.definitions) {
            if (inc.overrides[key]) {
                resolved.definitions[key] = inc.overrides[key];
            } else if (!resolved.definitions[key]) {
                resolved.definitions[key] = incGrammar.definitions[key];
            }
        }
        // Apply overrides that weren't in the included grammar
        for (let key in inc.overrides) {
            resolved.definitions[key] = inc.overrides[key];
        }
        // Merge namespaces
        for (let ns in incGrammar.namespaces) {
            if (!resolved.namespaces[ns]) resolved.namespaces[ns] = incGrammar.namespaces[ns];
        }
    }

    return resolved;
}

// ---------------------------------------------------------------------------
// Pattern Matching / XML Validation
// ---------------------------------------------------------------------------
function Validator(grammar) {
    this.grammar = grammar;
    this.errors = [];
}

Validator.prototype.resolve = function(name) {
    if (name.startsWith('xsd:')) {
        return { type: 'XSD', name: name };
    }
    return this.grammar.definitions[name] || null;
};

Validator.prototype.validate = function(xmlStr) {
    this.errors = [];
    let doc = parseXmlSimple(xmlStr);
    if (!doc || !doc.root) {
        this.errors.push('Failed to parse XML');
        return false;
    }

    if (this.grammar.start) {
        this.matchPattern(this.grammar.start, doc.root, []);
    } else {
        this.matchAny(doc.root, []);
    }

    return this.errors.length === 0;
};

Validator.prototype.matchAny = function(node, path) {
    for (let key in this.grammar.definitions) {
        let def = this.grammar.definitions[key];
        if (def.type === 'ELEMENT' || (def.type === 'REF' && this.resolve(def.name)?.type === 'ELEMENT')) {
            let savedErrors = this.errors.length;
            this.matchPattern(def, node, path.concat(key));
            if (this.errors.length === savedErrors) return true;
            this.errors = this.errors.slice(0, savedErrors);
        }
    }
    this.errors.push(path.join('/') + ': No matching definition found for <' + ((node.ns ? node.ns + ':' : '') + node.local) + '>');
    return false;
};

Validator.prototype.matchPattern = function(pattern, node, path) {
    if (!pattern) return true;

    let ptype = pattern.type;

    if (ptype === 'REF') {
        let def = this.resolve(pattern.name);
        if (!def) {
            this.errors.push(path.join('/') + ': Undefined pattern reference "' + pattern.name + '"');
            return false;
        }
        return this.matchPattern(def, node, path);
    }

    if (ptype === 'CHOICE') {
        let savedErrors = this.errors.length;
        if (this.matchPattern(pattern.left, node, path)) return true;
        this.errors = this.errors.slice(0, savedErrors);
        return this.matchPattern(pattern.right, node, path);
    }

    if (ptype === 'SEQ') {
        let seqChildren = [];
        let me = this;
        (function flattenSeq(p) {
            if (!p) return;
            if (p.type === 'SEQ' && p.children) {
                for (let ci = 0; ci < p.children.length; ci++) flattenSeq(p.children[ci]);
            } else if (p.type === 'SEQ' && p.left && p.right) {
                flattenSeq(p.left);
                flattenSeq(p.right);
            } else if (p.type === 'REF') {
                let def = me.resolve(p.name);
                if (def) flattenSeq(def);
                else seqChildren.push(p);
            } else {
                seqChildren.push(p);
            }
        })(pattern);

        let elemChildren = (node.children || []).filter(function(c) { return c.type === 'element'; });
        let consumed = new Set();
        let interleaveIndex = -1;

        // Find the interleave pattern position and process pre-interleave children
        for (let i = 0; i < seqChildren.length; i++) {
            if (me.isInterleavePattern(seqChildren[i])) {
                interleaveIndex = i;
                break;
            }
        }

        // First pass: match element patterns in order (before interleave)
        let ei = 0;
        for (let i = 0; i < (interleaveIndex > -1 ? interleaveIndex : seqChildren.length); i++) {
            let childPat = seqChildren[i];
            if (me.isAttributePattern(childPat)) continue;

            // Find a matching unconsumed child
            let found = false;
            for (let j = 0; j < elemChildren.length; j++) {
                if (consumed.has(j)) continue;
                let savedErrors = me.errors.length;
                if (me.matchPattern(childPat, elemChildren[j], path.concat('[' + j + ']'))) {
                    consumed.add(j);
                    found = true;
                    break;
                }
                me.errors = me.errors.slice(0, savedErrors);
            }
            if (!found) {
                if (isNullablePattern(childPat, me)) continue;
                me.errors.push(path.join('/') + ': Expected child element for "' + (childPat.type === 'ELEMENT' ? childPat.name.local : childPat.type) + '"');
                return false;
            }
        }

        // Second pass: interleave patterns match against remaining unconsumed children
        if (interleaveIndex > -1) {
            // Build a temporary node with only unconsumed children
            let savedChildren = node.children;
            node.children = (node.children || []).filter(function(c) {
                if (c.type !== 'element') return true;
                let idx = elemChildren.indexOf(c);
                return idx === -1 || !consumed.has(idx);
            });
            let interPat = seqChildren[interleaveIndex];
            let interOk = me.matchPattern(interPat, node, path);
            node.children = savedChildren;
            if (!interOk) return false;
        }

        return true;
    }

    if (ptype === 'INTERLEAVE') {
        let allChildren = (node.children || []).filter(function(c) { return c.type === 'element'; });
        let remaining = allChildren.slice();

        // Flatten nested interleave into list of alternatives
        let interAlts = [];
        (function flattenInter(p) {
            if (!p) return;
            if (p.type === 'INTERLEAVE') {
                flattenInter(p.left);
                flattenInter(p.right);
            } else {
                interAlts.push(p);
            }
        })(pattern);

        // For each alternative, try to match against remaining children
        for (let ai = 0; ai < interAlts.length; ai++) {
            let alt = interAlts[ai];
            if (!matchSubPatterns(this, alt, remaining, path)) return false;
        }
        // Remove matched children from node.children
        if (node.children) {
            node.children = node.children.filter(function(c) {
                return c.type !== 'element' || remaining.indexOf(c) === -1;
            });
        }
        return true;
    }

    if (ptype === 'ELEMENT') {
        let nodeNs = node.ns ? '' + node.ns : '';
        let patNs = pattern.name.ns ? '' + pattern.name.ns : '';
        if (nodeNs !== patNs) {
            let resolvedNs = this.grammar.namespaces[pattern.name.ns] || patNs;
            if (nodeNs !== resolvedNs) {
                this.errors.push(path.join('/') + ': Namespace mismatch for <' + node.local + '>: expected "' + resolvedNs + '" got "' + nodeNs + '"');
                return false;
            }
        }
        if (node.local !== pattern.name.local && node.local !== pattern.name.ns + ':' + pattern.name.local) {
            this.errors.push(path.join('/') + ': Element name mismatch: expected <' + pattern.name.local + '> got <' + node.local + '>');
            return false;
        }
        // Validate attributes
        this.validateAttributes(pattern.child, node, path);
        // Recursively validate child elements: collect valid child element names and check each XML child
        let validChildNames = this.collectValidChildElements(pattern.child);
        if (node.children) {
            for (let ci = 0; ci < node.children.length; ci++) {
                let child = node.children[ci];
                if (child.type !== 'element') continue;
                let childKey = (child.ns ? child.ns + ':' : '') + child.local;
                let childNsResolved = child.ns || '';
                // Resolve namespace prefix
                for (let nsk in this.grammar.namespaces) {
                    if (this.grammar.namespaces[nsk] === childNsResolved) { childKey = nsk + ':' + child.local; break; }
                }
                if (this.grammar.definitions[childKey] || this.grammar.definitions[child.local]) {
                    // Child element has a known definition, validate it
                    let childDef = this.grammar.definitions[childKey] || this.grammar.definitions[child.local];
                    if (childDef.type === 'ELEMENT') {
                        let savedErrors = this.errors.length;
                        if (!this.matchPattern(childDef, child, path.concat(childKey))) {
                            this.errors = this.errors.slice(0, savedErrors);
                        }
                    }
                }
            }
        }
        return true;
    }

    if (ptype === 'ATTRIBUTE') {
        return true;
    }

    if (ptype === 'TEXT') {
        return true;
    }

    if (ptype === 'XSD') {
        return true;
    }

    if (ptype === 'STRING') {
        let textContent = (node.children || []).filter(function(c) { return c.type === 'text'; }).map(function(c) { return c.text; }).join('');
        return textContent.trim() === pattern.value;
    }

    if (ptype === 'OPTIONAL') {
        let savedErrors = this.errors.length;
        if (this.matchPattern(pattern.child, node, path)) return true;
        this.errors = this.errors.slice(0, savedErrors);
        return true;
    }

    if (ptype === 'STAR') {
        return true;
    }

    if (ptype === 'PLUS') {
        return this.matchPattern(pattern.child, node, path);
    }

    if (ptype === 'EMPTY') {
        return !node.children || node.children.length === 0;
    }

    if (ptype === 'NOTALLOWED') {
        this.errors.push(path.join('/') + ': Element not allowed here');
        return false;
    }

    if (ptype === 'LIST') {
        return true;
    }

    warn('Unhandled pattern type: ' + ptype);
    return true;
};

Validator.prototype.isAttributePattern = function(pattern) {
    if (!pattern) return false;
    let p = pattern;
    if (p.type === 'REF') p = this.resolve(p.name);
    if (!p) return false;
    if (p.type === 'ATTRIBUTE') return true;
    if (p.type === 'OPTIONAL') return this.isAttributePattern(p.child);
    if (p.type === 'CHOICE') return this.isAttributePattern(p.left) || this.isAttributePattern(p.right);
    return false;
};

Validator.prototype.isInterleavePattern = function(pattern) {
    if (!pattern) return false;
    let p = pattern;
    if (p.type === 'REF') p = this.resolve(p.name);
    if (!p) return false;
    if (p.type === 'INTERLEAVE') return true;
    if (p.type === 'OPTIONAL') return this.isInterleavePattern(p.child);
    return false;
};

Validator.prototype.collectValidChildElements = function(pattern) {
    let names = {};
    let me = this;
    (function walk(p) {
        if (!p) return;
        if (p.type === 'ELEMENT') {
            let key = (p.name.ns ? p.name.ns + ':' : '') + p.name.local;
            names[key] = true;
        } else if (p.type === 'REF') {
            walk(me.resolve(p.name));
        } else if (p.type === 'SEQ' && p.children) {
            for (let i = 0; i < p.children.length; i++) walk(p.children[i]);
        } else if (p.type === 'SEQ' && p.left) {
            walk(p.left); walk(p.right);
        } else if (p.type === 'CHOICE') {
            walk(p.left); walk(p.right);
        } else if (p.type === 'INTERLEAVE') {
            walk(p.left); walk(p.right);
        } else if (p.type === 'OPTIONAL' || p.type === 'STAR' || p.type === 'PLUS') {
            walk(p.child);
        }
    })(pattern);
    return names;
};

Validator.prototype.matchElementName = function(pattern, local, ns) {
    if (!pattern) return false;
    if (pattern.type === 'REF') return this.matchElementName(this.resolve(pattern.name), local, ns);
    if (pattern.type === 'ELEMENT') {
        let pNs = pattern.name.ns || '';
        if (pNs && this.grammar.namespaces[pNs]) pNs = this.grammar.namespaces[pNs];
        return pattern.name.local === local && (!pNs || pNs === (ns || ''));
    }
    if (pattern.type === 'CHOICE') {
        return this.matchElementName(pattern.left, local, ns) || this.matchElementName(pattern.right, local, ns);
    }
    if (pattern.type === 'SEQ' && pattern.children && pattern.children.length > 0) {
        return this.matchElementName(pattern.children[0], local, ns);
    }
    return false;
};

Validator.prototype.matchTextPattern = function(pattern, text, path) {
    if (!pattern) return !text;
    if (pattern.type === 'TEXT') return true;
    if (pattern.type === 'STRING') return text.trim() === pattern.value;
    if (pattern.type === 'OPTIONAL') return true;
    if (pattern.type === 'STAR') return true;
    if (pattern.type === 'CHOICE') return this.matchTextPattern(pattern.left, text, path) || this.matchTextPattern(pattern.right, text, path);
    return false;
};

Validator.prototype.validateAttributes = function(pattern, node, path) {
    let attrPatterns = extractAttrPatterns(pattern, this);
    let attrs = node.attrs || {};

    // Check each attribute definition
    for (let i = 0; i < attrPatterns.length; i++) {
        let ap = attrPatterns[i].pattern;
        let isOptional = attrPatterns[i].optional;
        let attrLocal = ap.name.local;
        let attrNs = ap.name.ns ? this.grammar.namespaces[ap.name.ns] || ap.name.ns : '';
        // Find the attribute in the node's attributes
        let foundKey = null;
        for (let key in attrs) {
            let keyLocal = key;
            let keyNs = '';
            if (key.includes(':')) {
                let parts = key.split(':');
                keyNs = parts[0];
                keyLocal = parts[1];
                if (this.grammar.namespaces[keyNs]) keyNs = this.grammar.namespaces[keyNs];
            }
            if (keyLocal === attrLocal && (!attrNs || keyNs === attrNs)) {
                foundKey = key;
                break;
            }
        }
        if (foundKey) {
            // Validate attribute value
            let val = attrs[foundKey];
            if (!this.validateAttrValue(ap.child, val, path, attrLocal)) {
                this.errors.push(path.join('/') + ': Invalid value "' + val + '" for attribute @' + attrLocal);
            }
        } else if (!isOptional) {
            this.errors.push(path.join('/') + ': Missing required attribute @' + attrLocal);
        }
    }
};

Validator.prototype.validateAttrValue = function(pattern, value, path, attrName) {
    if (!pattern) return true;
    let ptype = pattern.type;

    if (ptype === 'REF') {
        let def = this.resolve(pattern.name);
        if (!def) return true;
        return this.validateAttrValue(def, value, path, attrName);
    }
    if (ptype === 'CHOICE') {
        return this.validateAttrValue(pattern.left, value, path, attrName) || this.validateAttrValue(pattern.right, value, path, attrName);
    }
    if (ptype === 'STRING') {
        return value === pattern.value;
    }
    if (ptype === 'TEXT') {
        return true;
    }
    if (ptype === 'SEQ') {
        // For sequences of text/strings, check each part
        for (let i = 0; i < pattern.children.length; i++) {
            if (!this.validateAttrValue(pattern.children[i], value, path, attrName)) return false;
        }
        return true;
    }
    // Pattern references resolve to text/string types for attributes
    if (ptype === 'LIST') {
        // CSL list attributes: whitespace-separated values
        let vals = value.trim().split(/\s+/);
        for (let i = 0; i < vals.length; i++) {
            if (!this.validateAttrValue(pattern.child, vals[i], path, attrName)) return false;
        }
        return true;
    }
    // XSD types: xsd:boolean, xsd:integer, xsd:language, xsd:anyURI, xsd:NMTOKEN, xsd:string, xsd:nonNegativeInteger, xsd:dateTime
    let m = attrName.match(/^xsd:(.+)$/);
    if (m) {
        return validateXsdType(m[1], value);
    }
    // For named references like "terms", "variables.names", etc. - accept any string
    return true;
};

// Check if a pattern is nullable (can match empty)
function isNullablePattern(pattern, validator) {
    if (!pattern) return true;
    let ptype = pattern.type;
    if (ptype === 'OPTIONAL' || ptype === 'STAR' || ptype === 'EMPTY' || ptype === 'XSD') return true;
    if (ptype === 'REF') return isNullablePattern(validator.resolve(pattern.name), validator);
    if (ptype === 'CHOICE') return isNullablePattern(pattern.left, validator) || isNullablePattern(pattern.right, validator);
    if (ptype === 'SEQ' && pattern.children) return pattern.children.every(function(c) { return isNullablePattern(c, validator); });
    return false;
}

function extractAttrPatterns(pattern, validator) {
    let attrs = [];
    function walk(p, optional) {
        if (!p) return;
        if (p.type === 'ATTRIBUTE') { attrs.push({ pattern: p, optional: optional }); return; }
        if (p.type === 'REF') { walk(validator.resolve(p.name), optional); return; }
        if (p.type === 'SEQ') { if (p.children) p.children.forEach(function(c) { walk(c, optional); }); return; }
        if (p.type === 'CHOICE') { walk(p.left, optional); walk(p.right, optional); return; }
        if (p.type === 'INTERLEAVE') { walk(p.left, optional); walk(p.right, optional); return; }
        if (p.type === 'OPTIONAL') { walk(p.child, true); return; }
        if (p.type === 'STAR' || p.type === 'PLUS') { walk(p.child, true); return; }
    }
    walk(pattern, false);
    return attrs;
}

function matchSubPatterns(validator, pattern, remaining, path) {
    if (!pattern) return true;
    if (pattern.type === 'REF') return matchSubPatterns(validator, validator.resolve(pattern.name), remaining, path);
    if (pattern.type === 'STAR' || pattern.type === 'OPTIONAL' || pattern.type === 'XSD') return true;
    if (pattern.type === 'ELEMENT') {
        // Find and remove a matching element from remaining
        for (let i = 0; i < remaining.length; i++) {
            let r = remaining[i];
            if (validator.matchPattern(pattern, r, path)) {
                remaining.splice(i, 1);
                return true;
            }
        }
        return isNullablePattern(pattern, validator);
    }
    if (pattern.type === 'CHOICE') {
        let copy = remaining.slice();
        if (matchSubPatterns(validator, pattern.left, remaining, path)) return true;
        // Restore and try right
        remaining.length = 0;
        Array.prototype.push.apply(remaining, copy);
        return matchSubPatterns(validator, pattern.right, remaining, path);
    }
    if (pattern.type === 'SEQ') {
        for (let i = 0; i < pattern.children.length; i++) {
            if (!matchSubPatterns(validator, pattern.children[i], remaining, path)) return false;
        }
        return true;
    }
    return true;
}

function validateXsdType(type, value) {
    switch (type) {
        case 'boolean': return value === 'true' || value === 'false';
        case 'integer': return /^-?\d+$/.test(value);
        case 'nonNegativeInteger': return /^\d+$/.test(value) && parseInt(value, 10) >= 0;
        case 'language': return /^[a-zA-Z]{1,8}(-[a-zA-Z0-9]{1,8})*$/.test(value);
        case 'anyURI': return true; // accept anything for URIs
        case 'NMTOKEN': return /^[a-zA-Z0-9_\-\.]+$/.test(value);
        case 'string': return true;
        case 'dateTime': return true; // accept anything for dates
        case 'pattern': return true; // regex patterns embedded in xsd:string
        default: return true;
    }
}

// ---------------------------------------------------------------------------
// Simple XML Parser
// ---------------------------------------------------------------------------
function parseXmlSimple(xmlStr) {
    // Remove XML declarations and processing instructions
    xmlStr = xmlStr.replace(/<\?[^>]*\?>/g, '').trim();
    if (!xmlStr) return null;

    let pos = 0;
    let nsStack = []; // Stack of namespace mappings [{ prefix: uri, ... }]

    function skipWs() {
        while (pos < xmlStr.length && /\s/.test(xmlStr[pos])) pos++;
    }

    function addNs(attrs) {
        let nsMap = {};
        for (let key in attrs) {
            if (key === 'xmlns') {
                nsMap[''] = attrs[key];
            } else if (key.startsWith('xmlns:')) {
                nsMap[key.slice(6)] = attrs[key];
            }
        }
        if (nsStack.length > 0) {
            let parentNs = nsStack[nsStack.length - 1];
            for (let k in parentNs) {
                if (!(k in nsMap)) nsMap[k] = parentNs[k];
            }
        }
        nsStack.push(nsMap);
        return nsMap;
    }

    function resolveNs(prefix, nsMap) {
        if (!prefix) return '';
        return nsMap[prefix] || '';
    }

    function parseNode() {
        skipWs();
        if (pos >= xmlStr.length || xmlStr[pos] !== '<') return null;
        if (xmlStr.slice(pos, pos + 2) === '</') return null;
        if (xmlStr.slice(pos, pos + 4) === '<!--') {
            let end = xmlStr.indexOf('-->', pos);
            if (end === -1) end = xmlStr.length;
            pos = end + 3;
            return parseNode();
        }
        pos++; // skip <
        skipWs();
        let nameEnd = pos;
        while (nameEnd < xmlStr.length && !/\s|\/|>/.test(xmlStr[nameEnd])) nameEnd++;
        let tagName = xmlStr.slice(pos, nameEnd);
        pos = nameEnd;
        let ns = '', local = tagName;
        let colonIdx = tagName.indexOf(':');
        if (colonIdx > -1) {
            ns = tagName.slice(0, colonIdx);
            local = tagName.slice(colonIdx + 1);
        }
        let attrs = {};
        while (pos < xmlStr.length) {
            skipWs();
            if (xmlStr[pos] === '/' || xmlStr[pos] === '>') break;
            let attrStart = pos;
            while (pos < xmlStr.length && !/\s|=|>/.test(xmlStr[pos])) pos++;
            let attrName = xmlStr.slice(attrStart, pos);
            skipWs();
            if (xmlStr[pos] !== '=') break;
            pos++;
            skipWs();
            let quote = xmlStr[pos];
            if (quote !== '"' && quote !== "'") break;
            pos++;
            let valStart = pos;
            while (pos < xmlStr.length && xmlStr[pos] !== quote) pos++;
            let attrVal = xmlStr.slice(valStart, pos);
            pos++;
            attrs[attrName] = attrVal;
        }
        skipWs();
        let selfClosing = false;
        if (xmlStr[pos] === '/') { selfClosing = true; pos++; }
        if (xmlStr[pos] === '>') pos++;

        // Push namespace context
        let nsMap = addNs(attrs);
        // Resolve element namespace
        if (!ns && nsMap['']) ns = nsMap[''];
        else if (ns && nsMap[ns]) ns = nsMap[ns];

        let children = [];
        if (!selfClosing) {
            while (pos < xmlStr.length) {
                skipWs();
                let textStart = pos;
                while (pos < xmlStr.length && xmlStr[pos] !== '<') pos++;
                if (pos > textStart) {
                    let text = xmlStr.slice(textStart, pos).replace(/\s+/g, ' ').trim();
                    if (text) children.push({ type: 'text', text: text });
                }
                if (pos >= xmlStr.length) break;
                if (xmlStr.slice(pos, pos + 2 + tagName.length) === '</' + tagName) {
                    pos += 2 + tagName.length;
                    skipWs();
                    if (xmlStr[pos] === '>') pos++;
                    break;
                }
                let child = parseNode();
                if (child) children.push(child);
                else break;
            }
        }
        // Pop namespace context
        nsStack.pop();
        return { type: 'element', ns: ns, local: local, attrs: attrs, children: children };
    }

    let root = parseNode();
    return { root: root };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
function loadSchema(schemaPath) {
    let absPath = path.resolve(schemaPath);
    let src = fs.readFileSync(absPath, 'utf8');
    let tokens = tokenize(src);
    let parser = new Parser(tokens);
    let grammar = parser.parseGrammar();
    grammar = resolveIncludes(grammar, path.dirname(absPath));
    grammar = sanitizeGrammar(grammar);
    return grammar;
}

function validateCSL(cslXml, schemaPath) {
    let grammar = loadSchema(schemaPath);
    let validator = new Validator(grammar);
    let valid = validator.validate(cslXml);
    return { valid: valid, errors: validator.errors };
}

export { validateCSL, loadSchema, tokenize, Parser, Validator, parseXmlSimple };

// CLI mode
if (process.argv[1] && import.meta.url.endsWith(process.argv[1])) {
    let args = process.argv.slice(2);
    let schemaPath = args[0];
    let xmlPath = args[1];
    if (!schemaPath || !xmlPath) {
        console.log('Usage: node tools/rnc-validator.js <schema.rnc> <file.xml>');
        process.exit(1);
    }
    let xml = fs.readFileSync(xmlPath, 'utf8');
    let result = validateCSL(xml, schemaPath);
    if (result.valid) {
        console.log('XML is valid.');
        process.exit(0);
    } else {
        for (let e of result.errors) console.log('ERROR: ' + e);
        process.exit(1);
    }
}
