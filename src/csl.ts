'use strict';

import * as Core from './constants/core';
import * as Regex from './constants/regex';
import * as Statute from './constants/statute';

import { checkPrefixSpaceAppend, checkSuffixSpacePrepend, checkIgnorePredecessor } from './util/affix';
import { TITLE_FIELD_SPLITS, TITLE_SPLIT, demoteNoiseWords, extractTitleAndSubtitle, titlecaseSentenceOrNormal } from './util/title';
import { normalizeLocaleStr, toLocaleUpperCase, toLocaleLowerCase, getAbbrevsDomain, AbbreviationSegments } from './util/locale_shared';
import { error, debug } from './logger';
import { Conditions } from './util/conditions';

import { NOTE_FIELDS_REGEXP, NOTE_FIELD_REGEXP } from './constants/regex';


export const CSL: CSLNamespace = {
    ...Core,
    ...Regex,
    ...Statute,

    error,
    debug,
    normalizeLocaleStr,
    toLocaleUpperCase,
    toLocaleLowerCase,
    getAbbrevsDomain,
    AbbreviationSegments,
    Conditions,

    checkPrefixSpaceAppend,
    checkSuffixSpacePrepend,
    checkIgnorePredecessor,

    TITLE_FIELD_SPLITS,
    TITLE_SPLIT,
    demoteNoiseWords,
    extractTitleAndSubtitle,
    titlecaseSentenceOrNormal: function (this: any, state: any, Item: any, seg: string, lang: string | false, sentenceCase: boolean): string {
        return titlecaseSentenceOrNormal(state, Item, seg, lang, sentenceCase, CSL.Output.Formatters);
    },

    checkNestedBrace: function(state: CslState): void {
        if (state.opt.xclass === "note") {
            this.depth = 0;
            this.update = function(str: string): string {
                str = str ? str : "";
                let lst = str.split(/([\(\)])/);
                for (let i=1,ilen=lst.length;i<ilen;i += 2) {
                    if (lst[i] === "(") {
                        if (1 === (this.depth % 2)) {
                            lst[i] = "[";
                        }
                        this.depth += 1;
                    } else if (lst[i] === ")") {
                        if (0 === (this.depth % 2)) {
                            lst[i] = "]";
                        }
                        this.depth -= 1;
                    }
                }
                let ret = lst.join("");
                return ret;
            };
        } else {
            this.update = function(str: string): string {
                return str;
            };
        }
    },

    parseLocator: function(item: any): any {
        if (this.opt.development_extensions.locator_date_and_revision) {
            if (item.locator) {
                item.locator = "" + item.locator;
                const idx = item.locator.indexOf("|");
                if (idx > -1) {
                    let raw_locator = item.locator;
                    item.locator = raw_locator.slice(0, idx);
                    raw_locator = raw_locator.slice(idx + 1);
                    let m = raw_locator.match(/^([0-9]{4}-[0-9]{2}-[0-9]{2}).*/);
                    if (m) {
                        item["locator-date"] = this.fun.dateparser.parseDateToObject(m[1]);
                        raw_locator = raw_locator.slice(m[1].length);
                    }
                    item["locator-extra"] = raw_locator.replace(/^\s+/, "").replace(/\s+$/, "");
                }
            }
        }
        if (item.locator) {
            item.locator = ("" + item.locator).replace(/\s+$/, '');
        }
        return item;
    },

    parseNoteFieldHacks: function(Item: any, validFieldsForType: any, allowDateOverride: boolean): void {
        if ("string" !== typeof Item.note) {
            return;
        }
        const elems: any[] = [];
        let lines = Item.note.split('\n');
        for (let i=0, ilen=lines.length; i<ilen; i++) {
            const line = lines[i];
            const elems: any[] = [];
            let m = line.match(NOTE_FIELDS_REGEXP);
            if (m) {
                const splt = line.split(NOTE_FIELDS_REGEXP);
                for (let j=0,jlen=(splt.length-1);j<jlen;j++) {
                    elems.push(splt[j]);
                    elems.push(m[j]);
                }
                elems.push(splt[splt.length-1]);
                for (let j=1,jlen=elems.length;j<jlen;j += 2) {
                    if (elems[j-1].trim() && (i>0 || j>1) && !elems[j-1].match(NOTE_FIELD_REGEXP)) {
                        break;
                    } else {
                        elems[j] = '\n' + elems[j].slice(2,-1).trim() + '\n';
                    }
                }
                lines[i] = elems.join('');
            }
        }
        lines = lines.join('\n').split('\n');
        let offset = 0;
        const names: Record<string, any> = {};
        for (let i=0,ilen=lines.length;i<ilen;i++) {
            const line = lines[i];
            const mm = line.match(NOTE_FIELD_REGEXP);
            if (!line.trim()) {
                continue;
            } else if (!mm) {
                if (i === 0) {
                    continue;
                } else {
                    offset = i;
                    break;
                }
            }
            let key = mm[1];
            const val = mm[2].replace(/^\s+/, "").replace(/\s+$/, "");
            if (key === "type") {
                Item.type = val;
                lines[i] = "";
            } else if (Core.DATE_VARIABLES.indexOf(key.replace(/^alt-/, "")) > -1) {
                if (!Item[key] || allowDateOverride) {
                    Item[key] = CSL.DateParser.parseDateToArray(val);
                    if (!validFieldsForType || (validFieldsForType[key] && this.isDateString(val))) {
                        lines[i] = "";
                    }
                }
            } else if (!Item[key]) {
                if (Core.NAME_VARIABLES.indexOf(key.replace(/^alt-/, "")) > -1) {
                    if (!names[key]) {
                        names[key] = [];
                    }
                    let lst = val.split(/\s*\|\|\s*/);
                    if (lst.length === 1) {
                        names[key].push({literal:lst[0]});
                    } else if (lst.length === 2) {
                        const name = {family:lst[0],given:lst[1]};
                        CSL.parseParticles(name);
                        names[key].push(name);
                    }
                } else {
                    Item[key] = val;
                }
                if (!validFieldsForType || validFieldsForType[key]) {
                    lines[i] = "";
                }
            }
        }
        for (let key in names) {
            Item[key] = names[key];
        }
        if (validFieldsForType) {
            if (lines[offset].trim()) {
                lines[offset] = '\n' + lines[offset];
            }
            for (let i=offset-1;i>-1;i--) {
                if (!lines[i].trim()) {
                    lines = lines.slice(0, i).concat(lines.slice(i + 1));
                }
            }
        }
        Item.note = lines.join("\n").trim();
    },

    getSafeEscape: function(state: CslState): (txt: string) => string {
        if (["bibliography", "citation"].indexOf(state.tmp.area) > -1) {
            const callbacks: Array<(txt: string) => string> = [];
            if (state.opt.development_extensions.thin_non_breaking_space_html_hack && state.opt.mode === "html") {
                callbacks.push(function (txt: string): string {
                    return txt.replace(/\u202f/g, '<span style="white-space:nowrap">&thinsp;</span>');
                });
            }
            if (callbacks.length) {
                return function (txt: string): string {
                    for (let i = 0, ilen = callbacks.length; i < ilen; i += 1) {
                        txt = callbacks[i](txt);
                    }
                    return CSL.Output.Formats[state.opt.mode].text_escape(txt);
                };
            } else {
                return CSL.Output.Formats[state.opt.mode].text_escape;
            }
        } else {
            return function (txt: string): string { return txt; };
        }
    },

    UPDATE_GROUP_CONTEXT_CONDITION: function (state: CslState, str: string, valueTerm: any, token: any, value: any): void {
        if (!state.opt.use_context_condition) return;
        const flags = state.tmp.group_context.tip;
        if (flags.condition) {
            if (!flags.condition.termtxt) {
                flags.condition.termtxt = str;
                flags.condition.valueTerm = valueTerm;
            }
            if (!flags.value_seen && flags.condition.test === "comma-safe-numbers-only") {
                if (value) {
                    flags.value_seen = true;
                    if (!value.match(/^[0-9]/)) {
                        state.tmp.just_did_number = false;
                    }
                }
            }
        } else {
            if (token && token.decorations.filter((o: any) => o[0] === "@vertical-align").length > 0) {
                state.tmp.just_did_number = false;
            } else if (token && token.strings.suffix) {
                state.tmp.just_did_number = false;
            } else if (str) {
                if (str.match(/[0-9]$/)) {
                    state.tmp.just_did_number = true;
                } else {
                    state.tmp.just_did_number = false;
                }
            }
        }
    },

    EVALUATE_GROUP_CONDITION: function(state: CslState, flags: any): boolean {
        if (!state.opt.use_context_condition) return false;
        let testres: boolean | undefined;
        const numbersOnly = flags.condition.test === "comma-safe-numbers-only";
        if (flags.condition.test === "empty-label") {
            testres = !flags.condition.termtxt;
        } else if (flags.condition.test === "empty-label-no-decor") {
            testres = !flags.condition.termtxt || flags.condition.termtxt.indexOf("%s") > -1;
        } else if (["comma-safe", "comma-safe-numbers-only"].indexOf(flags.condition.test) > -1) {
            const locale_term = flags.condition.termtxt;
            let termStartAlpha = false;
            if (flags.condition.termtxt) {
                termStartAlpha = flags.condition.termtxt.slice(0,1).match(Regex.ALL_ROMANESQUE_REGEXP);
            }
            const num = state.tmp.just_did_number;
            if (num) {
                if (flags.condition.valueTerm) {
                    testres = numbersOnly ? false : true;
                } else if (!locale_term) {
                    testres = true;
                } else if (termStartAlpha) {
                    testres = numbersOnly ? false : true;
                } else if (["always", "after-number"].indexOf(state.opt.require_comma_on_symbol) > -1) {
                    testres = true;
                } else {
                    testres = false;
                }
            } else {
                if (flags.condition.valueTerm) {
                    testres = false;
                } else if (!locale_term) {
                    testres = false;
                } else if (termStartAlpha) {
                    testres = numbersOnly ? false : true;
                } else if (state.opt.require_comma_on_symbol === "always") {
                    testres = true;
                } else {
                    testres = false;
                }
            }
        }
        let force_suppress: boolean;
        if (testres) {
            force_suppress = false;
        } else {
            force_suppress = true;
        }
        if (flags.condition.not) {
            force_suppress = !force_suppress;
        }
        return force_suppress;
    },

    GET_COURT_CLASS: function(state: CslState, Item: any, sortKey: any): string {
        let cls = "";
        let authority = null;
        const country = Item.jurisdiction ? Item.jurisdiction.split(":")[0] : null;
        let classType = "court_condition_classes";
        if (sortKey) {
            classType = "court_key_classes";
        }
        if (country && Item.authority) {
            if ("string" === typeof Item.authority) {
                authority = Item.authority;
            } else {
                if (Item.authority[0] && Item.authority[0].literal) {
                    authority = Item.authority[0].literal;
                }
            }
        }
        if (authority) {
            if (this.lang && state.locale[this.lang].opts[classType] && state.locale[this.lang].opts[classType][country] && state.locale[this.lang].opts[classType][country][authority]) {
                cls = state.locale[this.lang].opts[classType][country][authority];
            } else if (state.locale[state.opt["default-locale"][0]].opts[classType] && state.locale[state.opt["default-locale"][0]].opts[classType][country] && state.locale[state.opt["default-locale"][0]].opts[classType][country][authority]) {
                cls = state.locale[state.opt["default-locale"][0]].opts[classType][country][authority]
            }
        }
        return cls;
    },

    SET_COURT_CLASSES: function(state: CslState, lang: string, myxml: any, dataObj: any): void {
        const nodes = myxml.getNodesByName(dataObj, 'court-class');
        for (let pos = 0, len = myxml.numberofnodes(nodes); pos < len; pos += 1) {
            const courtclass = nodes[pos];
            const attributes = myxml.attributes(courtclass);
            let cls = attributes["@name"];
            const country = attributes["@country"];
            let courts = attributes["@courts"];
            let classType = "court_key_classes";
            if (state.registry) {
                classType = "court_condition_classes";
            }
            if (cls && country && courts) {
                courts = courts.trim().split(/\s+/);
                if (!state.locale[lang].opts[classType]) {
                    state.locale[lang].opts[classType] = {};
                }
                if (!state.locale[lang].opts[classType][country]) {
                    state.locale[lang].opts[classType][country] = {};
                }
                for (let i=0,ilen=courts.length;i<ilen;i++) {
                    state.locale[lang].opts[classType][country][courts[i]] = cls;
                }
            }
        }
    },

    INIT_JURISDICTION_MACROS: function (state: CslState, Item: any, item: any, macroName: string): boolean {
        if (Item["best-jurisdiction"]) {
            return true;
        }
        if (!state.sys.retrieveStyleModule || !Core.MODULE_MACROS[macroName] || !Item.jurisdiction) {
            return false;
        }
        const jurisdictionList = state.getJurisdictionList(Item.jurisdiction);
        if (!state.opt.jurisdictions_seen[jurisdictionList[0]]) {
            const res = state.retrieveAllStyleModules(jurisdictionList);
            for (const jurisdiction in res) {
                const fallback = state.loadStyleModule(jurisdiction, res[jurisdiction]);
                if (fallback) {
                    if (!res[fallback]) {
                        Object.assign(res, state.retrieveAllStyleModules([fallback]));
                        state.loadStyleModule(fallback, res[fallback], true);
                    }
                }
            }
        }
        if (state.opt.parallel.enable) {
            if (!state.parallel) {
                state.parallel = new CSL.Parallel(state);
            }
        }
        for (let i=0,ilen=jurisdictionList.length;i<ilen;i++) {
            const jurisdiction = jurisdictionList[i];
            if (item) {
                if (state.juris[jurisdiction] && !item["best-jurisdiction"] && state.juris[jurisdiction].types.locator) {
                    Item["best-jurisdiction"] = jurisdiction;
                }
            }
            if(state.juris[jurisdiction] && state.juris[jurisdiction].types[Item.type]) {
                Item["best-jurisdiction"] = jurisdiction;
                return true;
            }
        }
        return false;
    }
};
