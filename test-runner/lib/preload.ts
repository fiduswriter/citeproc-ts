/// <reference path="../../src/types.d.ts" />
/// <reference path="./types.d.ts" />

import fs from "fs";
import path from "path";
import { getAbbrevPath } from "citeproc-abbrevs";

export function preloadAbbreviations(CSL: CSLNamespace, styleEngine: any, citation: Record<string, any>, acache: Record<string, any>) {
    let styleID = styleEngine.opt.styleID;
    let obj = styleEngine.transform.abbrevs;
    let suppressedJurisdictions = styleEngine.opt.suppressedJurisdictions;
    let jurisdiction, category, rawvals;
    let isMlzStyle = styleEngine.opt.version.slice(0, 4) === '1.1m';

    let abbrevPath = null;
    if (styleEngine.sys && styleEngine.sys.config && styleEngine.sys.config.path && styleEngine.sys.config.path.abbrevs && fs.existsSync(styleEngine.sys.config.path.abbrevs)) {
        abbrevPath = styleEngine.sys.config.path.abbrevs;
    } else {
        try {
            abbrevPath = getAbbrevPath();
        } catch (e) {
            abbrevPath = null;
        }
    }

    let rawFieldFunction: Record<string, (item: Record<string, any>, varname: string) => any[]> = {
        "container-title": (item, varname) => {
            return item[varname] ? [item[varname]] : [];
        },
        "collection-title": (item, varname) => {
            return item[varname] ? [item[varname]] : [];
        },
        "institution-entire": (item, varname) => {
            let ret = [];
            let names = item[varname];
            for (let i=0,ilen=names.length;i<ilen;i++) {
                if (names[i].literal) {
                    ret.push(names[i].literal);
                }
            }
            return ret.length ? ret : [];
        },
        "institution-part": (item, varname) => {
            let ret = [];
            let names = item[varname];
            for (let i=0,ilen=names.length;i<ilen;i++) {
                if (names[i].literal) {
                    let nameparts = names[i].literal.split(/\s*\|\s*/);
                    for (let j=0,jlen=nameparts.length;j<jlen;j++) {
                        ret.push(nameparts[j]);
                    }
                }
            }
            return ret.length ? ret : [];
        },
        "number": (item, varname) => {
            return varname === "number" ? [item[varname]] : [];
        },
        "title": (item, varname) => {
            return [
                "title",
                "title-short",
                "genre",
                "event",
                "medium"
            ].indexOf(varname) > -1 ? [item[varname]] : [];
        },
        "place": (item, varname) => {
            return [
                "archive-place",
                "publisher-place",
                "event-place",
                "country",
                "jurisdiction",
                "language-name",
                "language-name-original"
            ].indexOf(varname) > -1 ? [item[varname]] : [];
        }
    };

    let rawItemFunction: Record<string, (item: Record<string, any>) => any> = {
        "nickname": (item) => {
            let ret = [];
            for (let varname in CSL.CREATORS) {
                if (item[varname]) {
                    for (let i=0,ilen=item[varname].length;i<ilen;i++) {
                        let name = item[varname][i];
                        if (!name.literal) {
                            let rawname = CSL.Util.Names.getRawName(item[varname][i]);
                            ret.push(rawname);
                        }
                    }
                }
            }
            return ret.length ? ret : false;
        },
        "hereinafter": (item) => {
            return [item.id];
        },
        "classic": (item) => {
            return [item.id];
        }
    };

    let _registerEntries = (val, jurisdictions, category, passed_field?, domain?) => {
        let humanVal = null;
        if (passed_field) {
            let topCode = jurisdictions.join(":");
            val = styleEngine.sys.normalizeAbbrevsKey(passed_field, val);
        }
        for (let i=jurisdictions.length;i>0;i--) {
            let jurisdiction = jurisdictions.slice(0,i).join(":");
            _setCacheEntry(styleID, obj, jurisdiction, category, val, false, domain);
        }
        if (category === "hereinafter") {
            let item = styleEngine.sys.retrieveItem(val);
        }
        _setCacheEntry(styleID, obj, "default", category, val, false, domain);
    };

    let _checkAbbrevsForJurisdiction = (styleID, country) => {
        let ret = {};
        for (let i=0,ilen=citation.citationItems.length;i<ilen;i++) {
            let id = citation.citationItems[i].id;
            let item = styleEngine.sys.retrieveItem(id);
            for (let fn of fs.readdirSync(abbrevPath)) {
                let rex = new RegExp(`^auto-${country}(?:-([^.]+))*.json$`);
                let m = rex.exec(fn);
                if (!m) continue;
                let domain = m[1];
                let obj = JSON.parse(fs.readFileSync(path.join(abbrevPath, fn)).toString());
                let jurisd;
                let abbrevs: Record<string, any>;
                if (domain) {
                    ret[domain] = true;
                    abbrevs = {};
                    for (let jurisdiction in obj.xdata) {
                        jurisd = jurisdiction + "@" + domain;
                        abbrevs[jurisd] = obj.xdata[jurisdiction];
                    }
                } else {
                    abbrevs = {};
                    for (let jurisd in obj.xdata) {
                        abbrevs[jurisd] = {};
                        for (let seg in obj.xdata[jurisd]) {
                            abbrevs[jurisd][seg] = {};
                            for (let key in obj.xdata[jurisd][seg]) {
                                let newkey = key;
                                let isJurisdiction = jurisd === "default" && seg === "place" && key.toUpperCase() === key;
                                let isCourt = ["institution-entire", "institution-part"].indexOf(seg) > -1 && seg.toLowerCase() === seg;
                                if (!isJurisdiction && !isCourt) {
                                    newkey = styleEngine.sys.normalizeAbbrevsKey("container-title", key);
                                }
                                abbrevs[jurisd][seg][newkey] = obj.xdata[jurisd][seg][key];
                            }
                        }
                    }
                }
                Object.assign(acache, abbrevs);
            }
        }
        return Object.keys(ret);
    };

    let _setCacheEntry = (styleID, obj, jurisdiction, category, rawval, humanRawVal, domain) => {
        if (!rawval) return;

        rawval = "" + rawval;
        let ids = [rawval];

        for (let i=0,ilen=ids.length; i<ilen; i++) {
            let id = ids[i];
            if (id) {
                let jurisd = jurisdiction;
                let itemJurisd = domain ? jurisd + "@" + domain : jurisd;

                if (!obj[itemJurisd]) {
                    obj[itemJurisd] = new CSL.AbbreviationSegments();
                }
                if (!obj[itemJurisd][category]) {
                    obj[itemJurisd][category] = {};
                }

                let abbrev = false;
                if (acache[itemJurisd]) {
                    if (acache[itemJurisd][category]) {
                        if (acache[itemJurisd][category][rawval]) {
                            abbrev = acache[itemJurisd][category][rawval];
                        }
                    }
                }

                if (abbrev) {
                    obj[itemJurisd][category][rawval] = abbrev;
                    break;
                }
            }
        }
    };

    for (let i=0,ilen=citation.citationItems.length;i<ilen;i++) {
        let id = citation.citationItems[i].id;
        let item = styleEngine.sys.retrieveItem(id);
        let jurisdictions: string[];
        if (item.jurisdiction) {
            jurisdictions = item.jurisdiction.split(":");
            if (!styleEngine.opt.availableAbbrevDomains) {
                styleEngine.opt.availableAbbrevDomains = {};
            }
            let jurs = item.jurisdiction.split(":");
            if (!styleEngine.opt.availableAbbrevDomains[jurs[0]]) {
                if (abbrevPath) {
                    styleEngine.opt.availableAbbrevDomains[jurs[0]] = _checkAbbrevsForJurisdiction(styleID, jurs[0]);
                }
            }
        } else {
            jurisdictions = [];
        }
        if (item.language) {
            let lst = item.language.toLowerCase().split("<");
            if (lst.length > 0) {
                item["language-name"] = lst[0];
            }
            if (lst.length === 2) {
                item["language-name-original"] = lst[1];
            }
        }

        let domain = CSL.getAbbrevsDomain(styleEngine, jurisdictions[0], item.language);

        for (let field of Object.keys(item)) {
            category = CSL.FIELD_CATEGORY_REMAP[field];
            rawvals = false;
            if (category) {
                rawvals = rawFieldFunction[category](item, field).map(function(val){
                    return [val, category, field];
                });
                if ("jurisdiction" === field) {
                    rawvals = rawvals.concat(rawFieldFunction[category](item, field).map(function(val){
                        val = val.split(":")[0];
                        return [val, category, "country"];
                    }));
                }
            } else if (CSL.CREATORS.indexOf(field) > -1) {
                rawvals = rawFieldFunction["institution-entire"](item, field).map(function(val){
                    return [val, "institution-entire", field];
                });
                rawvals = rawvals.concat(rawFieldFunction["institution-part"](item, field).map(function(val){
                    return [val, "institution-part", field];
                }));
            } else if (field === "authority") {
                let spoofItem: Record<string, any>;
                if ("string" === typeof item[field]) {
                    spoofItem = { authority: [{ literal: item[field] }] };
                } else {
                    spoofItem = item;
                }
                rawvals = rawFieldFunction["institution-entire"](spoofItem, field).map(function(val){
                    return [val, "institution-entire", field];
                });
                rawvals = rawvals.concat(rawFieldFunction["institution-part"](spoofItem, field).map(function(val){
                    return [val, "institution-part", field];
                }));
            }
            if (!rawvals) continue;
            for (let j=0,jlen=rawvals.length;j<jlen;j++) {
                let val = rawvals[j][0];
                let cat = rawvals[j][1];
                let passed_field = rawvals[j][2];
                _registerEntries(val, jurisdictions, cat, passed_field, domain);
            }
        }

        for (let functionType in rawItemFunction) {
            rawvals = rawItemFunction[functionType](item);
            if (!rawvals) continue;
            for (let i=0,ilen=rawvals.length;i<ilen;i++) {
                let val = rawvals[i];
                _registerEntries(val, [], functionType);
            }
        }
    }
}
