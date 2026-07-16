import fs from "fs";
import path from "path";
import { getAbbrevPath } from "citeproc-abbrevs";

export function preloadAbbreviations(CSL, styleEngine, citation, acache) {
    var styleID = styleEngine.opt.styleID;
    var obj = styleEngine.transform.abbrevs;
    var suppressedJurisdictions = styleEngine.opt.suppressedJurisdictions;
    var jurisdiction, category, rawvals;
    var isMlzStyle = styleEngine.opt.version.slice(0, 4) === '1.1m';

    var abbrevPath = null;
    if (styleEngine.sys && styleEngine.sys.config && styleEngine.sys.config.path && styleEngine.sys.config.path.abbrevs && fs.existsSync(styleEngine.sys.config.path.abbrevs)) {
        abbrevPath = styleEngine.sys.config.path.abbrevs;
    } else {
        try {
            abbrevPath = getAbbrevPath();
        } catch (e) {
            abbrevPath = null;
        }
    }

    let rawFieldFunction: any = {
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

    let rawItemFunction: any = {
        "nickname": (item) => {
            var ret = [];
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

    var _registerEntries = (val, jurisdictions, category, passed_field?, domain?) => {
        var humanVal = null;
        if (passed_field) {
            var topCode = jurisdictions.join(":");
            val = styleEngine.sys.normalizeAbbrevsKey(passed_field, val);
        }
        for (let i=jurisdictions.length;i>0;i--) {
            let jurisdiction = jurisdictions.slice(0,i).join(":");
            _setCacheEntry(styleID, obj, jurisdiction, category, val, false, domain);
        }
        if (category === "hereinafter") {
            var item = styleEngine.sys.retrieveItem(val);
        }
        _setCacheEntry(styleID, obj, "default", category, val, false, domain);
    };

    let _checkAbbrevsForJurisdiction = (styleID, country) => {
        var ret = {};
        for (var i=0,ilen=citation.citationItems.length;i<ilen;i++) {
            var id = citation.citationItems[i].id;
            var item = styleEngine.sys.retrieveItem(id);
            for (var fn of fs.readdirSync(abbrevPath)) {
                var rex = new RegExp(`^auto-${country}(?:-([^.]+))*.json$`);
                var m = rex.exec(fn);
                if (!m) continue;
                var domain = m[1];
                var obj = JSON.parse(fs.readFileSync(path.join(abbrevPath, fn)).toString());
                var jurisd;
                var abbrevs: any;
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
                        for (var seg in obj.xdata[jurisd]) {
                            abbrevs[jurisd][seg] = {};
                            for (var key in obj.xdata[jurisd][seg]) {
                                var newkey = key;
                                var isJurisdiction = jurisd === "default" && seg === "place" && key.toUpperCase() === key;
                                var isCourt = ["institution-entire", "institution-part"].indexOf(seg) > -1 && seg.toLowerCase() === seg;
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

    var _setCacheEntry = (styleID, obj, jurisdiction, category, rawval, humanRawVal, domain) => {
        if (!rawval) return;

        rawval = "" + rawval;
        var ids = [rawval];

        for (var i=0,ilen=ids.length; i<ilen; i++) {
            var id = ids[i];
            if (id) {
                var jurisd = jurisdiction;
                var itemJurisd = domain ? jurisd + "@" + domain : jurisd;

                if (!obj[itemJurisd]) {
                    obj[itemJurisd] = new CSL.AbbreviationSegments();
                }
                if (!obj[itemJurisd][category]) {
                    obj[itemJurisd][category] = {};
                }

                var abbrev = false;
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

    for (var i=0,ilen=citation.citationItems.length;i<ilen;i++) {
        var id = citation.citationItems[i].id;
        var item = styleEngine.sys.retrieveItem(id);
        var jurisdictions: any;
        if (item.jurisdiction) {
            jurisdictions = item.jurisdiction.split(":");
            if (!styleEngine.opt.availableAbbrevDomains) {
                styleEngine.opt.availableAbbrevDomains = {};
            }
            var jurs = item.jurisdiction.split(":");
            if (!styleEngine.opt.availableAbbrevDomains[jurs[0]]) {
                if (abbrevPath) {
                    styleEngine.opt.availableAbbrevDomains[jurs[0]] = _checkAbbrevsForJurisdiction(styleID, jurs[0]);
                }
            }
        } else {
            jurisdictions = [];
        }
        if (item.language) {
            var lst = item.language.toLowerCase().split("<");
            if (lst.length > 0) {
                item["language-name"] = lst[0];
            }
            if (lst.length === 2) {
                item["language-name-original"] = lst[1];
            }
        }

        var domain = CSL.getAbbrevsDomain(styleEngine, jurisdictions[0], item.language);

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
                var spoofItem: any;
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
            for (var j=0,jlen=rawvals.length;j<jlen;j++) {
                var val = rawvals[j][0];
                var cat = rawvals[j][1];
                var passed_field = rawvals[j][2];
                _registerEntries(val, jurisdictions, cat, passed_field, domain);
            }
        }

        for (let functionType in rawItemFunction) {
            rawvals = rawItemFunction[functionType](item);
            if (!rawvals) continue;
            for (let i=0,ilen=rawvals.length;i<ilen;i++) {
                var val = rawvals[i];
                _registerEntries(val, [], functionType);
            }
        }
    }
}
