import { SET_COURT_CLASSES } from './csl-shared';
import { setupXml } from '../system';
import { MODULE_MACROS, MODULE_TYPES } from '../constants/core';
import { debug } from '../logger';
export function getJurisdictionList(this: CslState, jurisdiction: string): string[] {
    const jurisdictionList: any[] = [];
    const jurisdictionElems = jurisdiction.split(":");
    for (let j = jurisdictionElems.length; j > 0; j -= 1) {
        const composedID = jurisdictionElems.slice(0, j).join(":");
        jurisdictionList.push(composedID);
        if (this.opt.jurisdiction_fallbacks[composedID]) {
            const fallback = this.opt.jurisdiction_fallbacks[composedID];
            jurisdictionList.push(fallback);
        }
    }
    if (jurisdictionList.indexOf("us") === -1) {
        jurisdictionList.push("us");
    }
    return jurisdictionList;
};

export function loadStyleModule(this: CslState, jurisdiction: string, xmlSource: any, skipFallback?: boolean): any {
    let myFallback = null;
    let macroCount = 0;
    this.juris[jurisdiction] = {};
    const myXml = setupXml(xmlSource);
    myXml.addMissingNameNodes(myXml.dataObj);
    myXml.addInstitutionNodes(myXml.dataObj);
    myXml.insertPublisherAndPlace(myXml.dataObj);
    myXml.flagDateMacros(myXml.dataObj);
    let myNodes = myXml.getNodesByName(myXml.dataObj, "law-module");
    for (let i = 0, ilen = myNodes.length; i < ilen; i += 1) {
        let myTypes = myXml.getAttributeValue(myNodes[i], "types");
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
    const lang = this.opt.lang ? this.opt.lang : this.opt["default-locale"][0];
    SET_COURT_CLASSES(this, lang, myXml, myXml.dataObj);

    if (!this.juris[jurisdiction].types) {
        this.juris[jurisdiction].types = MODULE_TYPES;
    }
    myNodes = myXml.getNodesByName(myXml.dataObj, "macro");
    for (let i2 = 0, ilen2 = myNodes.length; i2 < ilen2; i2 += 1) {
        const myName = myXml.getAttributeValue(myNodes[i2], "name");
        if (!MODULE_MACROS[myName]) {
            debug("CSL: skipping non-modular macro name \"" + myName + "\" in module context");
            continue;
        }
        macroCount += 1;
        this.juris[jurisdiction][myName] = [];
        this.buildTokenLists(myNodes[i2], this.juris[jurisdiction][myName]);
        this.configureTokenList(this.juris[jurisdiction][myName]);
    }
    return myFallback;
};

export function retrieveAllStyleModules(this: CslState, jurisdictionList: string[]): Record<string, any> {
    let ret: any = {};
    let preferences = this.locale[this.opt.lang].opts["jurisdiction-preference"];
    preferences = preferences ? preferences : [];
    preferences = [""].concat(preferences);
    for (let i = preferences.length - 1; i > -1; i -= 1) {
        const preference = preferences[i];
        for (let j = 0, jlen = jurisdictionList.length; j < jlen; j += 1) {
            const jurisdiction = jurisdictionList[j];
            if (this.opt.jurisdictions_seen[jurisdiction]) {
                continue;
            }
            const res = (this.sys as any).retrieveStyleModule(jurisdiction, preference);
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
