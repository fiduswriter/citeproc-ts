import { CSL } from '../csl';
CSL.Engine.prototype.getJurisdictionList = function (this: any, jurisdiction: any): any[] {
    var jurisdictionList: any[] = [];
    var jurisdictionElems = jurisdiction.split(":");
    for (let j = jurisdictionElems.length; j > 0; j -= 1) {
        var composedID = jurisdictionElems.slice(0, j).join(":");
        jurisdictionList.push(composedID);
        if (this.opt.jurisdiction_fallbacks[composedID]) {
            var fallback = this.opt.jurisdiction_fallbacks[composedID];
            jurisdictionList.push(fallback);
        }
    }
    if (jurisdictionList.indexOf("us") === -1) {
        jurisdictionList.push("us");
    }
    return jurisdictionList;
};

CSL.Engine.prototype.loadStyleModule = function (this: any, jurisdiction: any, xmlSource: any, skipFallback?: any): any {
    var myFallback = null;
    var macroCount = 0;
    this.juris[jurisdiction] = {};
    var myXml = CSL.setupXml(xmlSource);
    myXml.addMissingNameNodes(myXml.dataObj);
    myXml.addInstitutionNodes(myXml.dataObj);
    myXml.insertPublisherAndPlace(myXml.dataObj);
    myXml.flagDateMacros(myXml.dataObj);
    var myNodes = myXml.getNodesByName(myXml.dataObj, "law-module");
    for (let i = 0, ilen = myNodes.length; i < ilen; i += 1) {
        var myTypes = myXml.getAttributeValue(myNodes[i], "types");
        if (myTypes) {
            this.juris[jurisdiction].types = {};
            myTypes = myTypes.split(/\s+/);
            for (let j = 0, jlen = myTypes.length; j < jlen; j += 1) {
                this.juris[jurisdiction].types[myTypes[j]] = true;
            }
        }
        if (!skipFallback) {
            myFallback = myXml.getAttributeValue(myNodes[i], "fallback");
            if (myFallback) {
                if (jurisdiction !== "us") {
                    this.opt.jurisdiction_fallbacks[jurisdiction] = myFallback;
                }
            }
        }
    }
    var lang = this.opt.lang ? this.opt.lang : this.opt["default-locale"][0];
    CSL.SET_COURT_CLASSES(this, lang, myXml, myXml.dataObj);

    if (!this.juris[jurisdiction].types) {
        this.juris[jurisdiction].types = CSL.MODULE_TYPES;
    }
    var myNodes = myXml.getNodesByName(myXml.dataObj, "macro");
    for (let i2 = 0, ilen2 = myNodes.length; i2 < ilen2; i2 += 1) {
        var myName = myXml.getAttributeValue(myNodes[i2], "name");
        if (!CSL.MODULE_MACROS[myName]) {
            CSL.debug("CSL: skipping non-modular macro name \"" + myName + "\" in module context");
            continue;
        }
        macroCount += 1;
        this.juris[jurisdiction][myName] = [];
        this.buildTokenLists(myNodes[i2], this.juris[jurisdiction][myName]);
        this.configureTokenList(this.juris[jurisdiction][myName]);
    }
    return myFallback;
};

CSL.Engine.prototype.retrieveAllStyleModules = function (this: any, jurisdictionList: any): any {
    let ret: any = {};
    var preferences = this.locale[this.opt.lang].opts["jurisdiction-preference"];
    preferences = preferences ? preferences : [];
    preferences = [""].concat(preferences);
    for (let i = preferences.length - 1; i > -1; i -= 1) {
        var preference = preferences[i];
        for (let j = 0, jlen = jurisdictionList.length; j < jlen; j += 1) {
            var jurisdiction = jurisdictionList[j];
            if (this.opt.jurisdictions_seen[jurisdiction]) {
                continue;
            }
            var res = this.sys.retrieveStyleModule(jurisdiction, preference);
            if ((!res && !preference) || res) {
                this.opt.jurisdictions_seen[jurisdiction] = true;
            }
            if (!res) {
                continue;
            }
            ret[jurisdiction] = res;
        }
    }
    return ret;
};
