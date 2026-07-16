/// <reference path="../../src/types.d.ts" />
/// <reference path="./types.d.ts" />

import fs from "fs";
import path from "path";
import yaml from "yaml";
import normalizeNewline from "normalize-newline";
import { preloadAbbreviations } from "./preload.js";

export async function createSys(config: TestRunnerConfig) {
    let CSL: CSLNamespace;
    if (config.path.src && fs.existsSync(path.join(config.path.src, "..", "citeproc.mjs"))) {
        try {
            const mod = await import(path.join(config.path.src, "..", "citeproc.mjs"));
            CSL = mod.default;
        } catch (err) {
            console.log("ERROR: syntax error in processor code");
            console.log(err);
            process.exit();
        }
    } else {
        const mod = await import("citeproc");
        CSL = mod.default;
    }

    const Sys = function(config, test, logger_queue) {
        this.config = config;
        this.test = test;
        this._acache = {};
        this._acache["default"] = new CSL.AbbreviationSegments();
        this._setCache();
        this.logger_queue = logger_queue;
        this._abbrevsLoadedFor = {};
        if (this.test.OPTIONS) {
            for (let option in this.test.OPTIONS) {
                this[option] = this.test.OPTIONS[option];
            }
        }
        this.CSL = CSL;
    }

    Sys.prototype.print = function(txt) {
        let name = this.test.NAME;
        this.logger_queue.push("[" + name + "] " + txt);
    }

    Sys.prototype._setCache = function() {
        this._cache = {};
        this._ids = [];
        for (let item of this.test.INPUT) {
            this._cache[item.id] = item;
            this._ids.push(item.id);
        }
    }

    Sys.prototype.retrieveItem = function(id){
        let ret = this._cache[id];
        return ret;
    };

    Sys.prototype.retrieveLocale = function(lang){
        let ret = null;
        try {
            ret = fs.readFileSync(path.join(this.config.path.locale, "locales-"+lang+".xml")).toString();
            ret = ret.replace(/\s*<\?[^>]*\?>\s*\n/g, "");
        } catch (e) {
            ret = false;
        }
        return ret;
    };

    Sys.prototype.retrieveStyleModule = function(jurisdiction, preference) {
        let ret = null;
        if (this.test.submode.nojuris) {
            return ret;
        }
        let idList = [jurisdiction];
        if (preference) {
            idList.push(preference);
        }
        let id = idList.join("-");
        id = id.replace(/\:/g, "+");
        try {
            ret = fs.readFileSync(path.join(this.config.path.modules, "juris-" + id + ".csl")).toString();
        } catch (e) {}
        return ret;
    };

    Sys.prototype.getAbbreviation = function(dummyListNameVar, obj, jurisdiction, category, key){
        if (!this._acache[jurisdiction]) {
            this._acache[jurisdiction] = new CSL.AbbreviationSegments();
        }
        let jurisdictions = ["default"];
        if (jurisdiction !== "default") {
            let lst = jurisdiction.split(":");
            for (let i=1,ilen=lst.length+1; i<ilen; i++) {
                jurisdiction = lst.slice(0,i).join(":");
                jurisdictions.push(jurisdiction);
            }
        }
        jurisdictions.reverse();
        let haveHit = false;
        let myjurisdiction: string;
        for (let i = 0, ilen = jurisdictions.length; i < ilen; i += 1) {
            myjurisdiction = jurisdictions[i];
            if (!obj[myjurisdiction]) {
                obj[myjurisdiction] = new CSL.AbbreviationSegments();
            }
            if (this._acache[myjurisdiction] && this._acache[myjurisdiction][category] && this._acache[myjurisdiction][category][key]) {
                obj[myjurisdiction][category][key] = this._acache[myjurisdiction][category][key];
                haveHit = true;
                break;
            }
        }
        return myjurisdiction;
    };

    Sys.prototype.preloadAbbreviationSets = function(myconfig) {
        if (!myconfig.path.jurisAbbrevPath) return;
        for (let itemID in this._cache) {
            let item = this._cache[itemID];
            let jurisdiction = item.jurisdiction;
            if (!jurisdiction) continue;

            let country = jurisdiction.replace(/:.*$/, "");
            let language = item.language ? item.language : "default";
            if (!this._abbrevsLoadedFor[country]) {
                this._abbrevsLoadedFor[country] = {};
            }

            if (this._abbrevsLoadedFor[country]) continue;
            let jurisAbbrevFilePath = path.join(myconfig.path.jurisAbbrevPath, "auto-" + country + ".json");
            if (fs.existsSync(jurisAbbrevFilePath)) {
                let abbrevs = JSON.parse(fs.readFileSync(jurisAbbrevFilePath)).xdata;
                this._acache = Object.assign(this._acache, abbrevs);
            }
            this._abbrevsLoadedFor[country] = true;
        }
    }

    Sys.prototype.updateDoc = function() {
        let data, result;
        for (let i=0,ilen=this.test.CITATIONS.length;i<ilen;i++) {
            let citation = this.test.CITATIONS[i];
            [data, result] = this.style.processCitationCluster(citation[0], citation[1], citation[2]);
            for (let j=this.doc.length-1; j>-1; j--) {
                let citationID = this.doc[j].citationID;
                if (!this.style.registry.citationreg.citationById[citationID]) {
                    this.doc = this.doc.slice(0, j).concat(this.doc.slice(j + 1));
                }
            }
            let prePost = citation[1].concat(citation[2]);
            let posMap = {};
            for (let j=0,jlen=prePost.length;j<jlen;j++) {
                posMap[prePost[j][0]] = j;
            }
            this.doc.sort(function(a, b) {
                if (posMap[a.citationID] > posMap[b.citationID]) {
                    return 1;
                } else if (posMap[a.citationID] < posMap[b.citationID]) {
                    return -1;
                } else {
                    return 0;
                }
            });
            for (let j in this.doc) {
                this.doc[j].prefix = "..";
            }
            for (let j in result) {
                let insert = result[j];
                for (let k in this.doc) {
                    let cite = this.doc[k];
                    if (cite.citationID === insert[2]) {
                        this.doc[k] = {
                            prefix: ">>",
                            citationID: cite.citationID,
                            String: insert[1]
                        };
                        result[j] = null;
                        break;
                    }
                }
            }
            for (let j in result) {
                let insert = result[j];
                if (!insert) {
                    continue;
                }
                this.doc = this.doc.slice(0, insert[0]).concat([
                    {
                        prefix: ">>",
                        citationID: insert[2],
                        String: insert[1]
                    }
                ]).concat(this.doc.slice(insert[0]));
            }
        }
    };

    Sys.prototype.normalizeAbbrevsKey = function(variable, key) {
        key = key ? ("" + key).trim() : "";
        if (["jurisdiction", "country"].indexOf(variable) > -1) {
            return key.toUpperCase();
        } else {
            key = key.toString()
                .replace(/(?:\b|^)(?:and|et|y|und|l[ae]|the|[ld]')(?:\b|$)|[\x21-\x2C.\/\x3A-\x40\x5B-\x60\\\x7B\x7D-\x7E]/ig, "")
                .replace(/\s*\x7C\s*/g, "\x7C")
                .replace(/\./g, " ")
                .replace(/\s+/g, " ")
                .trim();
            return key.toLowerCase();
        }
    };

    Sys.prototype.run = function(){
        let len, pos, ret, id_set;
        ret = [];
        function variableWrapper(params, prePunct, str, postPunct) {
            if (params.variableNames[0] === 'title'
                && params.itemData.URL
                && params.context === "citation"
                && params.position === "first") {

                return prePunct + '<a href="' + params.itemData.URL + '">' + str + '</a>' + postPunct;
            } else if (params.variableNames[0] === 'first-reference-note-number'
                       && params.context === "citation"
                       && params.position !== "first") {

                return prePunct + '<b>' + str + '</b>' + postPunct;
            } else {
                return (prePunct + str + postPunct);
            }
        }


        if (this.test.OPTIONS && this.test.OPTIONS.variableWrapper) {
            this.variableWrapper = variableWrapper;
        }
        let lang_bases_needed = {};
        for (let lang in CSL.LANGS) {
            let lang_base = lang.split("-")[0];
            lang_bases_needed[lang_base] = true;
        }
        for (let lang_base in lang_bases_needed) {
            if (!CSL.LANG_BASES[lang_base]) {
                throw "ERROR: missing in CSL.LANG_BASES: " + lang_base;
            }
        }
        let testCSL = this.test.CSL;
        let me = this;
        CSL.debug = function(str) {
            me.print(str);
        }
        this.style = new CSL.Engine(this,testCSL);

        this.style.fun.dateparser.addDateParserMonths(["ocak", "Şubat", "mart", "nisan", "mayıs", "haziran", "temmuz", "ağustos", "eylül", "ekim", "kasım", "aralık", "bahar", "yaz", "sonbahar", "kış"]);

        if (!this.test.MODE) {
            this.test.MODE = "all";
        }
        let mode = this.test.MODE.split("-");
        this.test.submode = {};
        for (let i=1,ilen=mode.length;i<ilen;i++) {
            this.test.submode[mode[i]] = true;
        }
        this.test.MODE = mode[0];

        if (this.test.submode["rtf"]) {
            this.style.setOutputFormat("rtf");
        }
        if (this.test.submode["plain"]) {
            this.style.setOutputFormat("plain");
        }
        if (this.test.submode["asciidoc"]) {
            this.style.setOutputFormat("asciidoc");
        }
        if (this.test.submode["xslfo"]) {
            this.style.setOutputFormat("xslfo");
        }
        if (this.test.submode["suppress_trailing_punctuation"]) {
            this.style.citation.opt.suppressTrailingPunctuation = true;
        }
        for (let opt in this.test.OPTIONS) {
            if (opt === "variableWrapper") {
                continue;
            }
            this.style.opt.development_extensions[opt] = this.test.OPTIONS[opt];
        }
        let langParams = {
            persons:["translit"],
            institutions:["translit"],
            titles:["translit", "translat"],
            journals:['translit'],
            publishers:["translat"],
            places:["translat"]
        };
        let langs = {};
        if (this.test.LANGPARAMS) {
            for (let key in this.test.LANGPARAMS) {
                if (key === "langs") {
                    const langsToUse = this.test.LANGPARAMS[key];
                    if (langsToUse.translat) {
                        this.style.setLangTagsForCslTranslation(langsToUse.translat);
                    }
                    if (langsToUse.translit) {
                        this.style.setLangTagsForCslTransliteration(langsToUse.translat);
                    }
                    continue;
                } else {
                    langParams[key] = this.test.LANGPARAMS[key];
                }
            }
        }
        this.style.setLangPrefsForCites(langParams);
        if (this.test.MULTIAFFIX) {
            this.style.setLangPrefsForCiteAffixes(this.test.MULTIAFFIX);
        }
        if (this.test.ABBREVIATIONS) {
            let abbrevs = {};
            for (let jurisd in this.test.ABBREVIATIONS) {
                abbrevs[jurisd] = {};
                for (let segment in this.test.ABBREVIATIONS[jurisd]) {
                    abbrevs[jurisd][segment] = {};
                    for (let key in this.test.ABBREVIATIONS[jurisd][segment]) {
                        let isJurisdiction = jurisd === "default" && segment === "place" && key.toUpperCase() === key;
                        let isCourt = ["institution-entire", "institution-part"].indexOf(segment) > -1 && segment.toLowerCase() === segment;
                        let normkey: string;
                        if (!isJurisdiction && !isCourt) {
                            normkey = this.normalizeAbbrevsKey("title", key);
                        } else {
                            normkey = key;
                        }
                        abbrevs[jurisd][segment][normkey] = this.test.ABBREVIATIONS[jurisd][segment][key];
                    }
                }
            }
            this._acache = Object.assign(this._acache, abbrevs);
        }
        if (this.test.BIBENTRIES){
            for (let i=0,ilen=this.test.BIBENTRIES.length;i<ilen;i++) {
                let id_set = this.test.BIBENTRIES[i];
                this.style.updateItems(id_set, this.test.submode["nosort"]);
            }
        } else if (!this.test.CITATIONS) {
            this.style.updateItems(this._ids, this.test.submode["nosort"]);
        }
        let citation: Record<string, any>[] = [];
        if (!this.test["CITATION-ITEMS"] && !this.test.CITATIONS){
            for (let i=0,ilen=this.style.registry.reflist.length;i<ilen;i++) {
                let item = this.style.registry.reflist[i];
                citation.push({"id":item.id});
            }
            this.test["CITATION-ITEMS"] = [citation];
        }
        if (!this.test.ABBREVIATIONS) {
            if (this.test.MODE === "all") {
                const mycitation = {
                    citationItems: citation
                };
                preloadAbbreviations(CSL, this.style, mycitation, this._acache);
            } else {
                if (this.test["CITATION-ITEMS"]) {
                    for (let citationItems of this.test["CITATION-ITEMS"]) {
                        const mycitation = {
                            citationItems: citationItems
                        };
                        preloadAbbreviations(CSL, this.style, mycitation, this._acache);
                    }
                } else if (this.test["CITATIONS"]) {
                    for (let mycitation of this.test["CITATIONS"]) {
                        preloadAbbreviations(CSL, this.style, mycitation[0], this._acache);
                    }
                }
            }
        }

        if (this.test.MODE === "all") {
            let res = [];
            let item = citation[0];
            res.push("FIRST\n  " + this.style.makeCitationCluster(citation));
            item.locator = "123";
            res.push("FIRST w/LOCATOR\n  " + this.style.makeCitationCluster(citation));
            item.label = "paragraph";
            res.push("FIRST w/LABEL\n  " + this.style.makeCitationCluster(citation));
            delete item.locator;
            delete item.label;
            if (this.config.styleCapabilities.ibid) {
                item.position = CSL.POSITION_IBID;
                res.push("IBID\n  " + this.style.makeCitationCluster(citation));
                item.position = CSL.POSITION_IBID_WITH_LOCATOR;
                item.locator = "123";
                res.push("IBID w/LOCATOR\n  " + this.style.makeCitationCluster(citation));
                delete item.locator;
            }
            if (this.config.styleCapabilities.position) {
                item.position = CSL.POSITION_SUBSEQUENT;
                item["near-note"] = true;
                res.push("SUBSEQUENT\n  " + this.style.makeCitationCluster(citation));
                item.locator = "123";
                res.push("SUBSEQUENT w/LOCATOR\n  " + this.style.makeCitationCluster(citation));
                delete item.locator;
            }
            if (this.config.styleCapabilities.backref) {
                item["first-reference-note-number"] = "1";
                res.push("SUBSEQUENT w/BACKREF\n  " + this.style.makeCitationCluster(citation));
                item.locator = "123";
                res.push("SUBSEQUENT w/BACKREF+LOCATOR\n  " + this.style.makeCitationCluster(citation));
                delete item.locator;
                delete item["first-reference-note-number"];
                delete item.position;
            }
            delete this.test["CITATION-ITEMS"];
            if (this.config.styleCapabilities.bibliography) {
                let bibres = this.style.makeBibliography();
                res.push("BIBLIOGRAPHY")
                res.push(bibres[0]["bibstart"] + bibres[1].join("") + bibres[0]["bibend"]);
            }
            ret = res.join("\n");
        } else {
            let citations = [];
            if (this.test["CITATION-ITEMS"]){
                for (let i=0,ilen=this.test["CITATION-ITEMS"].length;i<ilen;i++) {
                    citation = this.test["CITATION-ITEMS"][i];
                    citations.push(this.style.makeCitationCluster(citation));
                }
            } else if (this.test.CITATIONS){
                this.doc = [];
                this.updateDoc();
                if (this.test.INPUT2) {
                    this.test.INPUT = this.test.INPUT2;
                    this._setCache();
                    this.updateDoc();
                }
                citations = this.doc.map(function(elem, idx) {
                    return elem.prefix + "[" + idx + "] " + elem.String;
                });
            }
            ret = citations.join("\n");
            if (this.test.MODE == "bibliography" && !this.test.submode["header"]){
                if (this.test.BIBSECTION){
                    ret = this.style.makeBibliography(this.test.BIBSECTION);
                } else {
                    ret = this.style.makeBibliography();
                }
                ret = ret[0]["bibstart"] + ret[1].join("") + ret[0]["bibend"];
            } else if (this.test.MODE == "bibliography" && this.test.submode["header"]){
                let obj = this.style.makeBibliography()[0];
                let lst = [];
                for (let key in obj) {
                    let keyval = [];
                    keyval.push(key);
                    keyval.push(obj[key]);
                    lst.push(keyval);
                }
                lst.sort(
                    function (a, b) {
                        if (a > b) {
                            return 1;
                        } else if (a < b) {
                            return -1;
                        } else {
                            return 0;
                        }
                    }
                );
                ret = "";
                for (pos = 0, len = lst.length; pos < len; pos += 1) {
                    ret += lst[pos][0] + ": " + lst[pos][1] + "\n";
                }
                ret = ret.replace(/^\s+/,"").replace(/\s+$/,"");
            }
        }
        if (["citation", "bibliography", "all"].indexOf(this.test.MODE) === -1) {
            throw "Invalid mode in test file " + this.NAME + ": " + this.test.MODE;
        }
        ret = normalizeNewline(ret);
        return ret;
    };

    return Sys;
}
