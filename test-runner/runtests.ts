#!/usr/bin/env node

/// <reference path="./lib/types.d.ts" />

import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import clear from "cross-clear";
import chokidar from "chokidar";
import normalizeNewline from "normalize-newline";
import fetchURL from "fetch-promise";
import zoteroToCSLM from 'zotero2jurismcsl';
import zoteroToCSL from 'zotero-to-csl';
import { getAbbrevPath } from "citeproc-abbrevs";
import { fileURLToPath } from 'url';

import { getConfig } from "./lib/configs.js";
import { getReporters } from "./lib/reporters.js";
import { parseFixture } from "./lib/fixture-parser.js";
import sources from "./lib/sources.js";
import { options, formatUsage } from "./lib/options.js";
import * as errors from "./lib/errors.js";
import { styleCapabilities } from "./lib/style-capabilities.js";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const config = getConfig(scriptDir);

const { createSys } = await import(path.join(config.path.scriptdir, "lib", "sys.js"));
const Sys = await createSys(config);
const reporters = getReporters(config);
const { version } = JSON.parse(fs.readFileSync(path.join(scriptDir, "package.json"), "utf8"));

let rncValidator = null;
async function getRNCValidator() {
    if (!rncValidator) {
        let projectRoot = config.path.src ? path.join(config.path.src, "..") : config.path.cwd;
        const mod = await import(path.join(projectRoot, "tools", "rnc-validator.js"));
        rncValidator = mod.validateCSL;
    }
    return rncValidator;
}

let ksTimeout;
let cdTimeout;
let skipNames = {};

const groupIdMap = {
    final: 2319948,
    draft: 2339078
}

/*
 * Console
 */
if (process.stdin.setRawMode) {
  process.stdin.setRawMode(true);
}
process.stdin.resume();
process.stdin.on('data', function( key ){
    if ( key.toString("hex") === "03" ) {
        console.log("\n");
        process.exit();
    }
});

/*
 * Functions
 */
function Stripper(fn, noStrip) {
    this.fn = fn;
    this.noStrip = noStrip;
    this.arr = [];
    this.area = "code";
    this.state = "reading";
    this.skipStarRex = new RegExp("^\\s*(\\/\\*.*?\\*\\/)\\r?$", "m");
    this.skipSlashRex = new RegExp("^\\s*(\\/\\/.*)\\r?$");
    this.openRex = new RegExp("^\\s*(\\/\\*|\\/\\/SNIP-START)");
    this.closeRex = new RegExp("^\\s*(\\*\\/|\\/\\/SNIP-END)\\s*\\r?$");
    this.checkRex = new RegExp("");
    this.dumpArr = function() {
        return this.arr.join("\n");
    };
    this.checkLine = function (line) {
        if (line.match(/^.use strict.;?\r?$/)) {
            return;
        }
        if (this.noStrip) {
            this.arr.push(line);
        } else {
            let m = null;
            if (this.skipStarRex.test(line)) {
                return;
            } else if (this.openRex.test(line)) {
                m = this.openRex.exec(line);
                this.area = "comment";
                this.state = "opening";
            } else if (this.closeRex.test(line)) {
                m = this.closeRex.exec(line);
                this.state = "closing";
            } else if (this.skipSlashRex.test(line)) {
                return;
            } else {
                if (this.state === "opening") {
                    this.state = "skipping";
                } else if (this.state === "closing") {
                    this.state = "reading";
                    this.area = "code";
                }
            }
            if (this.state === "reading") {
                if (line.trim()) {
                    this.arr.push(line);
                }
            }
        }
    };
}

function checkSanity() {
    if (options.h) {
        console.log(formatUsage(config.mode));
        process.exit();
    }
    if (options.version) {
        console.log(`cslrun version: ${version}`);
        process.exit();
    }
    if (!options.r) {
        options.r = "landing";
    }
    if (config.mode === "styleMode") {
        if (!options.watch) {
            throw new Error("Running in styleMode. The -w option is required. Add -h for help.");
        }
    }
    if (options.C) {
        throw new Error("The -C option has been discontinued. See cslrun --help for details.");
    }
    if (!options.U && !options.V) {
        if (["s", "g", "a", "l"].filter(o => options[o]).length > 1) {
            throw new Error("Only one of -s, -g, -a, or -l may be invoked.");
        }
        if (["s", "g", "a", "l"].filter(o => options[o]).length === 0) {
            console.log(formatUsage(config.mode));
            throw new Error("Use one of -s, -g, -a, or -l.");
        }
    }
    if (options.U && !options.watch) {
        throw new Error("The -U option requires -w.");
    }
    if (options.U) {
        if (["final", "draft"].indexOf(options.U) === -1) {
            if (!options.U.toString().match(/^[0-9]+$/)) {
                throw new Error("Option 'update' [U] must be 'final', 'draft' or a valid Zotero group ID");
            }
        }
    }
    if (options.k && !options.watch) {
        throw new Error("The -k option requires -w.");
    }
}

function setLocalPathToStyleTestPath() {
    let styleTestsPth = null;
    if (!config.path.styletests || !fs.existsSync(config.path.styletests)) {
        throw new Error("The configured style tests directory must exist: " + config.path.styletests);
    }
    try {
        styleTestsPth = path.join(config.path.styletests, options.S);
        if (!fs.existsSync(styleTestsPth)) {
            fs.mkdirSync(styleTestsPth);
        }
        config.path.local = path.join(config.path.styletests, options.S);
    } catch (err) {
        throw err;
        throw new Error("Unable to create style tests directory: " + styleTestsPth);
    }
}

function setWatchFiles(options) {
    let arr = options.watch;
    if ("string" === typeof arr) {
        arr = [arr];
    }
    for (let i in arr) {
        if (!path.isAbsolute(arr[i])) {
            arr[i] = path.join(config.path.cwd, arr[i]);
        }
        if (!fs.existsSync(arr[i])) {
            throw new Error("CSL file or directory to be watched does not exist: " + arr[i]);
        }
    }
    options.watch = arr;
    options.w = arr;
}

function checkOverlap(tn) {
    if (config.testData[tn]) {
        throw new Error("Fixture name exists in local and std: " + tn);
    }
}

function checkSingle() {
    let tn = options.single.replace(/.txt~?\r?$/, "");
    let fn = tn + ".txt";
    if (fn.split("_").length !== 2) {
        throw new Error("Single test fixture must be specified as [group]_[name]");
    }
    let lpth = path.join(config.path.local, fn);
    let spth: string | undefined;
    if (config.path.std) {
        spth = path.join(config.path.std, fn);
    }
    if (!fs.existsSync(lpth) && (options.style || (spth && !fs.existsSync(spth)))) {
        console.log("Looked for " + lpth);
        console.log("Looked for " + spth);
        throw new Error("Test fixture \"" + options.single + "\" not found.");
    }
    if (fs.existsSync(lpth)) {
        config.testData[tn] = parseFixture(options, tn, lpth);
    }
    if (!options.style && spth) {
        if (fs.existsSync(spth)) {
            checkOverlap(tn);
            config.testData[tn] = parseFixture(options, tn, spth);
        }
    }
}

function checkGroup() {
    let fail = true;
    let rex = new RegExp("^" + options.group + "_.*\.txt\\r?$");
    for (let line of fs.readdirSync(config.path.local)) {
        if (rex.test(line)) {
            fail = false;
            let lpth = path.join(config.path.local, line);
            let tn = line.replace(/.txt\r?$/, "");
            if (!skipNames[tn]) {
                config.testData[tn] = parseFixture(options, tn, lpth);
            }
        }
    }
    if (!options.style) {
        for (let line of fs.readdirSync(config.path.std)) {
            if (rex.test(line)) {
                fail = false;
                let spth = path.join(config.path.std, line);
                let tn = line.replace(/.txt\r?$/, "");
                if (!skipNames[tn]) {
                    if (fs.existsSync(spth)) {
                        checkOverlap(tn);
                        config.testData[tn] = parseFixture(options, tn, spth);
                    }
                }
            }
        }
    }
    if (fail) {
        throw new Error("No fixtures found for group \"" + options.group + "\".");
    }

}

function checkAll() {
    let rex = new RegExp("^.*_.*\.txt\\r?$");
    for (let line of fs.readdirSync(config.path.local)) {
        if (rex.test(line)) {
            let lpth = path.join(config.path.local, line);
            let tn = line.replace(/.txt\r?$/, "");
            if (!skipNames[tn]) {
                config.testData[tn] = parseFixture(options, tn, lpth);
            }
        }
    }
    if (!options.style) {
        for (let line of fs.readdirSync(config.path.std)) {
            if (rex.test(line)) {
                let spth = path.join(config.path.std, line);
                let tn = line.replace(/.txt\r?$/, "");
                if (!skipNames[tn]) {
                    if (fs.existsSync(spth)) {
                        checkOverlap(tn);
                        config.testData[tn] = parseFixture(options, tn, spth);
                    }
                }
            }
        }
    }
}

function setGroupList() {
    let rex = new RegExp("^([^_]+)_.*\.txt\\r?$");
    for (let line of fs.readdirSync(config.path.local)) {
        if (rex.test(line)) {
            let m = rex.exec(line);
            if (!config.testData[m[1]]) {
                config.testData[m[1]] = [];
            }
            config.testData[m[1]].push(line);
        }
    }
    for (let line of fs.readdirSync(config.path.std)) {
        if (rex.test(line)) {
            let m = rex.exec(line);
            if (!config.testData[m[1]]) {
                config.testData[m[1]] = [];
            }
            config.testData[m[1]].push(line);
        }
    }
}

config.testData = {};

function fetchTestData() {
    try {
        config.testData = {};
        if (options.single) {
            checkSingle();
        }
        if (options.group) {
            checkGroup();
        }
        if (options.all) {
            checkAll();
        }
    } catch (err) {
        errors.errorHandler(err);
    }
}

function Bundle(noStrip?) {
    if (!config.path.src) {
        console.log("Using processor from package");
        return;
    }
    let bundlePath = path.join(config.path.src, "..", "citeproc.mjs");
    // If the prebuilt bundle already exists (built by esbuild), skip the old-style concatenation
    if (fs.existsSync(bundlePath)) {
        return;
    }
    console.log("Rebundling processor");
    let ret = "";
    for (let fn of sources) {
        let txt = fs.readFileSync(path.join(config.path.src, fn + ".js")).toString();
        ret += txt + "\n";
    }
    let license = fs.readFileSync(path.join(config.path.src, "..", "LICENSE")).toString().trim();
    license = "/*\n" + license + "\n*/\n";

    fs.writeFileSync(path.join(config.path.src, "..", "citeproc.js"), license + ret);
    fs.writeFileSync(path.join(config.path.src, "..", "citeproc.mjs"), license + ret + "\nexport default CSL");
}

async function validateCSLWithSchema(schema, test) {
    let validator = await getRNCValidator();
    return validator(test.CSL, schema);
}

function runValidationAsync(validationCount, validationGoal, schema, test) {
    let jingPromise = new Promise<void>(async (resolve, reject) => {
        let result;
        try {
            result = await validateCSLWithSchema(schema, test);
        } catch (e) {
            reject('Validation error: ' + e.message);
            return;
        }
        validationCount++;
        if (!result.valid) {
            let txt = result.errors.join('\n');
            let lines = txt.split(/(?:\r\n|\n)/);
            for (let line of lines) {
                console.log(line);
            }
            console.log('\nValidation failure for ' + test.NAME);
            if (options.watch && options.c) {
                process.exit();
            } else if (!options.watch) {
                validationCount--;
                fs.writeFileSync(path.join(config.path.configdir, '.cslValidationPos'), '' + validationCount);
                process.exit(0);
            }
        } else if (options.watch) {
            if (options.c) {
                process.exit();
            } else {
                runFixturesAsync();
            }
        } else {
            if (!options.validate || options.validate === 'all') {
                process.stdout.write('+');
            }
            if (validationCount === validationGoal) {
                console.log('\nDone.');
                process.exit(0);
            }
        }
        resolve();
    });
    return jingPromise;
}


async function runValidationsAsync() {
    let validationCount = 0;
    let validationGoal = Object.keys(config.testData).length;
    let startPos: number = 0;
    if (options.w) {
        console.log("Watching: " + options.watch[0]);
        console.log("Validating CSL.");
    } else {
        console.log("Validating CSL in " + validationGoal + " fixtures.");
    }
    if (!options.w && !options.l && !options.U) {
        if (options.a && fs.existsSync(path.join(config.path.configdir, ".cslValidationPos"))) {
            startPos = fs.readFileSync(path.join(config.path.configdir, ".cslValidationPos")).toString();
            startPos = parseInt(startPos.toString(), 10);
        } else {
            fs.writeFileSync(path.join(config.path.configdir, ".cslValidationPos"), "0");
        }
    }
    for (let key in config.testData) {
        if (startPos > validationCount) {
            process.stdout.write(".");
            validationCount++;
            continue;
        }
        let test = config.testData[key];
        let schema = config.path.cslschema;
        let lineList = test.CSL.split(/(?:\r\n|\n)/);
        let inStyle = false;
        let m = null;
        for (let line of lineList) {
            if (line.indexOf("<style") > -1) {
                inStyle = true;
            }
            if (inStyle && !m) {
                m = line.match(/version=[\"\']([^\"\']+)[\"\']/);
            }
            if (inStyle && line.indexOf(">") > -1) {
                break;
            }
        }
        if (m) {
            if (m[1].indexOf("mlz") > -1) {
                schema = config.path.cslmschema;
            }
        } else {
            throw new Error("Version not found in CSL for fixture: " + key);
        }
        await runValidationAsync(validationCount, validationGoal, schema, test);
        process.stdout.write("+");
        validationCount++;
        if (options.watch) {
            break;
        }
    }
}


function runFixturesAsync() {
    let fixturesPromise = new Promise<void>((resolve, reject) => {
        console.log("Testing CSL.");
        if (options.r) {
            if (reporters[options.r]) {
                if (reporters[options.r].path) {
                    options.r = reporters[options.r].path;
                } else {
                    console.log("Reporter not found, defaulting to \"landing.\" Install \"" + options.r + "\" with:\n");
                    console.log("    npm install " + reporters[options.r].npmname);
                    console.log("or")
                    console.log("    npm install -g " + reporters[options.r].npmname);
                    options.r = "landing";
                }
            } else {
                console.log("Unknown reporter \"" + options.r + ",\" defaulting to \"landing.\"");
                options.r = "landing";
            }
        }
        let args = [];
        if (options.b) {
            args.push("--no-color");
        } else {
            args.push("--color");
        }
        args.push("-R");
        args.push(options.r);
        if (options.k) {
            args.push("--bail");
        }
        args.push(path.join(config.path.fixturedir, "fixtures.mjs"));
        let mochaPath = config.path.mocha || "mocha";
        let mocha = spawn(mochaPath, args, {
            shell: process.platform == 'win32'
        });
        mocha.on("error", function(err) {
            let error = new Error("Failure running \"mocha.\" If the command \"mocha\" is not found,\ninstall it globally with:\n\n    npm install -g mocha");
            errors.errorHandler(error);
        });
        mocha.stdout.on('data', (data) => {
            let lines = data.toString();
            process.stdout.write(lines);
            if (options.w && options.k) {
                let m = lines.match(/.*AssertionError:\s*([^\n]+)\.txt/m);
                if (m) {
                    console.log("Adopt this output as correct test RESULT? (y/n)");
                    process.stdin.once('data', function (key) {
                        if (!ksTimeout) {
                            ksTimeout = setTimeout(function() { ksTimeout=null }, 100)
                            let fn = path.basename(m[1]);
                            let test = config.testData[fn];
                            if (key == "y" || key == "Y") {
                                let sys = new Sys(config, test, []);
                                sys.preloadAbbreviationSets(config);
                                let result = sys.run();
                                let input = JSON.stringify(test.INPUT, null, 2);
                                let txt = fs.readFileSync(path.join(config.path.scriptdir, "lib", "templateTXT.txt")).toString();
                                let modeArr: string[] = [test.MODE];
                                for (let submode in test.submode) {
                                    modeArr.push(submode);
                                }
                                let mode = modeArr.join("-");
                                txt = txt.replace("%%MODE%%", mode);
                                txt = txt.replace("%%KEYS%%", JSON.stringify(test.KEYS, null, 2));
                                txt = txt.replace("%%DESCRIPTION%%", test.DESCRIPTION);
                                txt = txt.replace("%%INPUT%%", input);
                                txt = txt.replace("%%RESULT%%", result)
                                for (let key in test) {
                                    if (["MODE", "INPUT", "RESULT", "NAME", "PATH", "CSL", "KEYS", "DESCRIPTION"].indexOf(key) > -1) {
                                        continue;
                                    }
                                    if (key.toUpperCase() !== key) {
                                        continue;
                                    }
                                    let testKey = typeof test[key] == "object" ? JSON.stringify(test[key], null, 2) : test[key];
                                    let block = "\n\n>>===== " + key + " =====>>\n" + testKey.trim() + "\n<<===== " + key + " =====<<\n";
                                    txt += block;
                                }
                                fs.writeFileSync(path.join(config.path.styletests, options.S, fn + ".txt"), txt);
                                bundleValidateTest(fn).catch(err => errors.errorHandler(err));
                                resolve();
                            }
                            if (key == "n" || key == "N") {
                                skipNames[test.NAME] = true;
                                bundleValidateTest(fn).catch(err => errors.errorHandler(err));
                                resolve();
                            }
                        }
                    });
                }
            }
        });
        mocha.stderr.on('data', (data) => {
            process.stderr.write(data);
        });
        mocha.on('close', (code) => {
            resolve();
            if (!options.watch) {
                console.log("\n");
                process.exit();
            }
        });
    });
    return fixturesPromise;
}

function buildTests() {
    let fixtures = fs.readFileSync(path.join(config.path.scriptdir, "lib", "templateJS.js")).toString();
    if (Object.keys(config.testData).length === 0) {
        errors.setupGuidance("No tests to run.");
    }
    fixtures = fixtures.replace("%%CONFIG%%", JSON.stringify(config, null, 2));
    fixtures = fixtures.replace("%%CHAI_PATH%%", JSON.stringify(config.path.chai));
    fixtures = fixtures.replace("%%RUNPREP_PATH%%", JSON.stringify(path.join(config.path.scriptdir, "lib", "sys.js")));
    fixtures = normalizeNewline(fixtures);
    if (config.path.fixturedir && !fs.existsSync(config.path.fixturedir)) {
        fs.mkdirSync(config.path.fixturedir);
    }
    fs.writeFileSync(path.join(config.path.fixturedir, "fixtures.mjs"), fixtures);
}

async function bundleValidateTest(continueAfter?) {
    if (continueAfter) {
        for (let key of Object.keys(config.testData)) {
            delete config.testData[key];
            if (key === continueAfter) break;
        }
    }
    if (options.watch && !options.once) {
        clear();
    }
    Bundle();
    if (options.watch) {
        if (!continueAfter) {
            fetchTestData();
        }
        buildTests();
        if (options.novalidation) {
            await runFixturesAsync();
        } else if (!options.validationonly) {
            await runValidationsAsync().catch(err => errors.errorHandlerNonFatal(err));
        }
        if (options.once || options.validationonly) {
            process.exit();
        }
        let watcher = chokidar.watch(options.watch[0]);
        watcher.on("change", (event, filename) => {
            if (!cdTimeout) {
                cdTimeout = setTimeout(function() { cdTimeout=null }, 200)
                clear();
                Bundle();
                fetchTestData();
                buildTests();
                if (options.novalidation) {
                    runFixturesAsync();
                } else {
                    runValidationsAsync().catch(err => errors.errorHandlerNonFatal(err));
                }
            }
        });
        for (let pth of options.watch.slice(1)) {
            watcher.add(pth);
        }
    } else if (options.cranky) {
        fetchTestData();
        buildTests();
        await runValidationsAsync().catch(err => errors.errorHandlerNonFatal(err));
    } else {
        fetchTestData();
        buildTests();
        await runFixturesAsync();
    }
}

/*
 * Do stuff
 */

(async function() {
    try {
        checkSanity();
        if (options.validate) {
            let filenames = null;
            if (options.validate === "all") {
                filenames = fs.readdirSync(config.path.modules).filter(o => o.match(/\.csl$/) ? o : false);
            } else {
                let m = options.validate.match(/^juris-([^-]+)(?:-[^.]+)*\.csl$/);
                let rex: RegExp;
                if (m) {
                    rex = new RegExp(options.validate.replace(/\./g, "\\."));
                } else {
                    let country = options.validate;
                    rex = new RegExp(`^juris-${country}.*\.csl$`);
                }
                filenames = fs.readdirSync(config.path.modules).filter(o => o.match(rex) ? o : false);
            }
            if (filenames.length === 0) {
                console.log(`Oops: nothing found for ${options.validate}`);
                process.exit();
            }
            if (filenames) {
                let goal = filenames.length;
                let count = 0;
                console.log(`Validating modules in ${config.path.modules}`);
                for (let fn of filenames) {
                    if (options.validate !== "all") {
                        console.log(fn);
                    }
                    let filePath = path.join(config.path.modules, fn);
                    let csl = fs.readFileSync(filePath).toString();
                    if (csl.match(/^<\?.*\?>/)) {
                        csl = csl.split("\n").slice(1).join("\n");
                    }
                    let res = await runValidationAsync(count, goal, config.path.cslmschema, {CSL:csl, NAME:fn});
                    count++;
                }
                process.exit();
            }
            console.log("MISSED");
            process.exit();
        }
        if (options.watch) {
            setWatchFiles(options);
            if (options.A) {
                config.path.jurisAbbrevPath = options.A;
            } else {
                config.path.jurisAbbrevPath = getAbbrevPath();
            }
        }
        if (options.list) {
            setGroupList();
        }
        if (options.items && options.submissions) {
            errors.setupGuidance("The -i and -s options cannot be used together");
        }
        if (!options.items && !options.submissions) {
            options.items = true;
        }
        if (options.U === "final") {
            config.groupID = groupIdMap.final;
        } else if (options.U === "draft") {
            config.groupID = groupIdMap.draft;
        } else if (options.U) {
            config.groupID = options.U;
        }
        if (options.watch && !options.style) {
            let txt = fs.readFileSync(options.watch[0]).toString();
            config.styleCapabilities = styleCapabilities(txt);
            options.style = config.styleCapabilities.styleName;
            options.S = config.styleCapabilities.styleName;
        }
        if (options.style) {
            setLocalPathToStyleTestPath();
        }

        if (options.U) {
            console.log(config.groupID)
            let json = await fetchURL("https://api.zotero.org/groups/" + config.groupID + "/collections/top?limit=100");
            let obj = JSON.parse(json.buf.toString());
            let collectionKey = obj.filter(o => (o.data.name === options.S))
                .map(o => o.data.key);
            if (!collectionKey || !collectionKey[0]) {
                errors.setupGuidance("No collection found for style \"" + options.S + "\" in library of test items.");
            }
            collectionKey = collectionKey[0];
            obj = [];
            let url: string | false = "https://api.zotero.org/groups/" + config.groupID + "/collections/" + collectionKey + "/items/top?limit=100";
            while (url) {
                json = await fetchURL(url);
                obj = obj.concat(JSON.parse(json.buf.toString()));
                let m = json.res.responseHeaders.link.match(/<(https:\/\/[^>]+)>;\s+rel=\"next\"/);
                if (m) {
                    url = m[1];
                } else {
                    url = false;
                }
            }
            let styleTestDir = path.join(config.path.styletests, options.S);
            let doneKeys = {};
            let doneNums = {};
            let rex = new RegExp("^.*_.*\.txt\\r?$");
            for (let fileName of fs.readdirSync(styleTestDir)) {
                if (!rex.test(fileName)) continue;
                let fixture = parseFixture(options, fileName, path.join(styleTestDir, fileName));
                for (let key of fixture.KEYS) {
                    doneKeys[key] = true;
                }
                let m = fileName.match(/[^0-9]*([0-9]+)/);
                if (m) {
                    doneNums[parseInt(m[1], 10)] = true;
                }
            }
            let max = 0;
            let doneNumsLst = Object.keys(doneNums);
            if (doneNumsLst.length > 0) {
                let max = Object.keys(doneNums).map(o => parseInt(o)).reduce(function(a, b) {
                    return Math.max(a, b);
                });
            }
            let newNums = [];
            for (let i=1,ilen=(max + obj.length + 1); i<ilen; i++) {
                if (!doneNums[i]) {
                    newNums.push(i);
                    if (newNums.length === obj.length) {
                        break;
                    }
                }
            }
            newNums.reverse();
            let arr = [];

            for (let o of obj) {
                let key = o.data.key;
                if (doneKeys[key]) {
                    continue;
                }
                delete o.data.key;
                let description = o.data.abstractNote;
                if (description) {
                    description = description.slice(0, 50).replace(/\n+/g, " ");
                }
                delete o.data.abstractNote;
                delete o.data.version;
                delete o.data.dateAdded;
                delete o.data.dateModified;
                let cslData = zoteroToCSL(o.data);
                let cslItem = zoteroToCSLM(o, cslData);
                arr.push({
                    key: key,
                    item: cslItem,
                    description: description
                });
            }
            for (let i in arr) {
                arr[i].id = "ITEM-1";
                let item = JSON.stringify([arr[i]], null, 2);
                let txt = fs.readFileSync(path.join(config.path.scriptdir, "lib", "templateTXT.txt")).toString();
                txt = txt.replace("%%MODE%%", "all");
                txt = txt.replace("%%KEYS%%", JSON.stringify([arr[i].key], null, 2));
                txt = txt.replace("%%INPUT%%", JSON.stringify([arr[i].item], null, 2));
                let pos = "" + newNums.pop();
                while (pos.length < 3) {
                    pos = "0" + pos;
                }
                let fileStub = "style_test" + pos;
                if (arr[i].description) {
                    txt = txt.replace("%%DESCRIPTION%%", arr[i].description);
                } else {
                    txt = txt.replace("%%DESCRIPTION%%", "should pass test " + fileStub)
                }
                fs.writeFileSync(path.join(config.path.styletests, options.S, fileStub + ".txt"), txt);
            }
            if (arr.length > 0) {
                console.log("Maybe wrote draft tests to "+path.join(config.path.styletests, options.S));
            } else {
                console.log("No tests to write this time");
            }
            process.exit(0);
        } else if (options.single || options.group || options.all) {
            await bundleValidateTest().catch(err => errors.errorHandler(err));
        } else if (options.l) {
            let ret = Object.keys(config.testData);
            ret.sort();
            for (let key of ret) {
                console.log(key + " (" + config.testData[key].length + ")");
            }
            process.exit(0);
        }
    } catch (err) {
        errors.errorHandler(err);
    }
})();
