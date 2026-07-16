import fs from "fs";
import path from "path";
import os from "os";
import { errorHandler, setupGuidance } from "./errors.js";
import yaml from "yaml";
import citeprocCslSchemata from "citeproc-csl-schemata";
import citeprocLocalesPkg from "citeproc-locales";
import citeprocJurisModules from "citeproc-juris-modules";
import citeprocAbbrevs from "citeproc-abbrevs";
import { createRequire } from "module";

const _require = createRequire(import.meta.url);

const homeDir = os.homedir();
const cwd = process.cwd();
const sourceRepoPaths = [ "local", "std", "src", "locale", "modules", "cslschema", "cslmschema" ];
const defaultConfig =
      "path:\n"
      + "    styletests: false\n"
      + "    local: false\n"
      + "    std: false\n"
      + "    src: false\n"
      + "    locale: false\n"
      + "    abbrevs: false\n"
      + "    modules: false\n"
      + "    cslschema: false\n"
      + "    cslmschema: false";

function makeAbsolute(basePath, config) {
    if (config && "object" === typeof config.path && "undefined" === typeof config.path.length) {
        for (var key in config.path) {
            if (config.path[key]) {
                if (!path.isAbsolute(config.path[key])) {
                    config.path[key] = path.join(basePath, config.path[key]);
                }
            }
        }
    } else {
        var error = new Error("Corrupt file (fix, remove, or revert): " + path.join(basePath, "cslrun.yaml"));
        throw error;
    }
}

function readConfig(dirName, hiddenFile?: boolean) {
    var prefix = "";
    if (hiddenFile) {
        prefix = ".";
    }
    try {
        var yamlSrc = fs.readFileSync(path.join(dirName, prefix + "cslrun.yaml")).toString();
        var cfg = yaml.parse(yamlSrc);
    } catch (err) {
        throw new Error("Unable to parse config file: " + path.join(dirName, prefix + "cslrun.yaml"));
    }
    makeAbsolute(dirName, cfg);
    return cfg;
}

export function getConfig(scriptDir: string) {
    let config: any;
    try {
        if (!fs.existsSync(path.join(homeDir, ".cslrun.yaml"))) {
            fs.writeFileSync(path.join(homeDir, ".cslrun.yaml"), defaultConfig);
        }
        config = readConfig(homeDir, true);
        config.path.configdir = homeDir;
        var pth = cwd;
        while (path.basename(pth)) {
            if (fs.existsSync(path.join(pth, "cslrun.yaml"))) {
                if (pth === homeDir) {
                    throw new Error("Found cslrun.yaml configuration file (without a dot) in home directory " + homeDir + "\n\nIn the home directory ONLY, use .cslrun.yaml instead (with a dot---and it should already exist).\n");
                    break;
                }
                var extraConfig = readConfig(pth);
                makeAbsolute(pth, extraConfig);
                for (var key in extraConfig.path) {
                    config.path[key] = extraConfig.path[key];
                }
                config.path.configdir = pth;
                break;
            }
            pth = path.dirname(pth);
        }
    } catch (err) {
        errorHandler(err);
    }
    if (!config.path.styletests) {
        setupGuidance("Some setup required.");
    }

    if (!config.path.cslschema || !fs.existsSync(config.path.cslschema)
        || !config.path.cslmschema || !fs.existsSync(config.path.cslmschema)) {
        config.path.cslschema = citeprocCslSchemata.csl;
        config.path.cslmschema = citeprocCslSchemata.cslm;
    }

    if (!config.path.locale || !fs.existsSync(config.path.locale)
        || !fs.readdirSync(config.path.locale).length) {
        config.path.locale = citeprocLocalesPkg;
    }

    if (!config.path.modules || !fs.existsSync(config.path.modules)
        || !fs.readdirSync(config.path.modules).length) {
        config.path.modules = citeprocJurisModules;
    }

    if (!config.path.abbrevs || !fs.existsSync(config.path.abbrevs)
        || !fs.readdirSync(config.path.modules).length) {
        config.path.abbrevs = citeprocAbbrevs;
    }

    if (sourceRepoPaths.filter(k => config.path[k]).length < sourceRepoPaths.length) {
        config.mode = "styleMode";
    } else {
        config.mode = "fullMode"
    }
    config.path.cwd = cwd;
    config.path.scriptdir = scriptDir;
    config.path.fixturedir = path.join(config.path.configdir, ".cslTestFixtures");
    try {
        config.path.chai = _require.resolve("chai");
    } catch (e) {
        config.path.chai = path.join(scriptDir, "node_modules", "chai", "index.js");
    }
    try {
        config.path.mocha = _require.resolve("mocha/bin/mocha");
    } catch (e) {
        config.path.mocha = "mocha";
    }
    config.path.projectRoot = cwd;
    return config;
}
