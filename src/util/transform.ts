import { UPDATE_GROUP_CONTEXT_CONDITION } from './csl-shared';
import { Token, Util_cloneToken } from '../obj/token';
import { titlecaseSentenceOrNormal, demoteNoiseWords } from './title';
import { getAbbrevsDomain } from './locale_shared';
import { Output_formatters } from '../output/formatters';

import { FIELD_CATEGORY_REMAP, LangPrefsMap, VARIABLES_WITH_SHORT_FORM } from '../constants/core';
/*
 * Fields can be transformed by translation/transliteration, or by
 * abbreviation.  Transformations are performed in that order.
 *
 * Renderings of original, translated or transliterated content
 * (followed by abbreviation if requested) are placed in the primary
 * output slot or the (implicitly punctuated) secondary and tertiary
 * output slots according to the settings registered in the
 * state.opt['cite-lang-prefs'] arrays. The array has six segments:
 * 'persons', 'institutions', 'titles', 'journals', 'publishers', and
 * 'places'. Each segment always contains at least one item, and may
 * hold values 'orig', 'translit' or 'translat'. The array defaults to
 * a single item 'orig'.
 *
 * All multilingual variables are associated with segments,
 * with the exception of 'edition' and 'genre'. These two
 * exceptions are always rendered with the first matching
 * language form found in state.opt['locale-translit'] or, if
 * composing a sort key, state.opt['locale-sort']. No secondary
 * slot rendering is performed for this two variables.
 *
 * The balance of multilingual variables are rendered with
 * the first matching value in the transform locales spec
 * (no transform, state.opt['locale-translit'], or
 * state.opt['locale-translat']) mapped to the target
 * slot.
 *
 * Full primary+secondary+tertiary rendering is performed only in
 * note-style citations and the bibliography.  In-text citations are
 * rendered in the primary output slot only, following the same spec
 * parameters.
 *
 *   Optional setters:
 *     .setAbbreviationFallback(); fallback flag
 *       (if true, a failed abbreviation will fallback to long)
 *
 *     .setAlternativeVariableName(): alternative variable name in Item,
 *       for use as a fallback abbreviation source
 *
 * Translation/transliteration
 *
 *   Optional setter:
 *     .setTransformFallback():
 *       default flag (if true, the original field value will be used as a fallback)
 *
 * The getTextSubField() method may be used to obtain a string transform
 * of a field, without abbreviation, as needed for setting sort keys
 * (for example).
 *
 */

export class Transform {
    abbrevs: Record<string, any>;
    getTextSubField: (this: any, Item: CslItem, field: string, locale_type: string, use_default: boolean, stopOrig: any, family_var?: string) => any;
    loadAbbreviation: (jurisdiction: string, category: string, orig: string, lang: string) => string;
    quashCheck: (jurisdiction: string, value: string) => string;
    getOutputFunction: (variables: string[], family_var?: string, abbreviation_fallback?: any, alternative_varname?: string) => Function;

    constructor(state: CslState) {
        this.abbrevs = {};
        this.abbrevs["default"] = new state.sys.AbbreviationSegments();

        function getCountryOrJurisdiction(variable: string, normalizedKey: string, quashCountry: boolean): string {
            let value = "";
            if (state.sys.getHumanForm) {
                if (variable === "country") {
                    value = state.sys.getHumanForm(normalizedKey.toLowerCase(), false, true);
                    value = value.split("|")[0];
                } else if (variable === "jurisdiction") {
                    value = state.sys.getHumanForm(normalizedKey.toLowerCase(), false, true);
                    if (!quashCountry) {
                        value = value.split("|").slice(1).join(", ");
                    } else {
                        value = "";
                    }
                }
            }
            return value;
        }

        function abbreviate(state: CslState, tok: Token, Item: CslItem, altvar: any, basevalue: string, family_var: string, use_field: boolean): string {
            let value = "";
            const myabbrev_family = FIELD_CATEGORY_REMAP[family_var];
            let preferredJurisdiction;
            if (!myabbrev_family) {
                return basevalue;
            }

            const variable = family_var;
            let normalizedKey = basevalue;

            if (state.sys.normalizeAbbrevsKey) {
                normalizedKey = state.sys.normalizeAbbrevsKey(family_var, basevalue);
            }
            let quashCountry = false;
            if (variable === "jurisdiction" && normalizedKey) {
                quashCountry = normalizedKey.indexOf(":") === -1;
            }
            if (["jurisdiction", "country"].indexOf(family_var) > -1 && basevalue === basevalue.toLowerCase()) {
                normalizedKey = basevalue.toUpperCase();
            }

            if (state.sys.getAbbreviation) {
                if (["jurisdiction", "country", "language-name", "language-name-original"].indexOf(variable) > -1) {
                    preferredJurisdiction = "default";
                } else if (Item.jurisdiction) {
                    preferredJurisdiction = Item.jurisdiction;
                } else {
                    preferredJurisdiction = "default";
                }
                let jurisdiction = state.transform.loadAbbreviation(preferredJurisdiction, myabbrev_family, normalizedKey, Item.language);

                if (state.transform.abbrevs[jurisdiction][myabbrev_family] && normalizedKey) {
                    const abbrev = state.transform.abbrevs[jurisdiction][myabbrev_family][normalizedKey];
                    if (tok.strings.form === "short" && abbrev) {
                        if (quashCountry) {
                            value = "";
                        } else {
                            value = abbrev;
                        }
                    } else {
                        value = getCountryOrJurisdiction(variable, normalizedKey, quashCountry);
                    }
                }
            }

            if (!value
                && (!state.opt.development_extensions.require_explicit_legal_case_title_short || Item.type !== 'legal_case')
                && altvar && Item[altvar] && use_field) {
                value = Item[altvar];
            }
            if (!value && !state.sys.getAbbreviation && state.sys.getHumanForm) {
                value = getCountryOrJurisdiction(variable, normalizedKey, quashCountry);
            }
            if (!value && !quashCountry && (!state.sys.getHumanForm || variable !== "jurisdiction")) {
                value = basevalue;
            }
            if (state.opt.development_extensions.force_title_abbrev_fallback) {
                if (variable === "title" && value === basevalue && Item["title-short"]) {
                    value = Item["title-short"];
                }
            }
            return value;
        }

        function getFieldLocale(Item: CslItem, field: string): string {
            let ret = state.opt["default-locale"][0].slice(0, 2);
            let localeRex;
            if (state.opt.development_extensions.strict_text_case_locales) {
                localeRex = new RegExp("^([a-zA-Z]{2})(?:$|-.*| .*)");
            } else {
                localeRex = new RegExp("^([a-zA-Z]{2})(?:$|-.*|.*)");
            }
            if (Item.language) {
                let m = ("" + Item.language).match(localeRex);
                if (m) {
                    ret = m[1];
                } else {
                    ret = "tlh";
                }
            }
            if (Item.multi && (Item.multi as any).main && (Item.multi as any).main[field]) {
                ret = (Item.multi as any).main[field];
            }
            if (!state.opt.development_extensions.strict_text_case_locales
                || state.opt.development_extensions.normalize_lang_keys_to_lowercase) {
                ret = ret.toLowerCase();
            }
            return ret;
        }

        function getTextSubField(this: any, Item: CslItem, field: string, locale_type: string, use_default: boolean, stopOrig: any, family_var?: string): any {
            let opt: any, o: any, ret: any, opts: any;
            const usedOrig = stopOrig;
            let usingOrig = false;

            if (!Item[field]) {
                return {
                    name: "",
                    usedOrig: stopOrig,
                    token: Util_cloneToken(this)
                };
            }
            let stickyLongForm = false;
            if (VARIABLES_WITH_SHORT_FORM.indexOf(field) > -1
                && family_var) {
                field = field + "-short";
                stickyLongForm = true;
            }
            let breakMe = false;
            let firstValue = null;
            const fieldsToTry: string[] = [];
            if (field.slice(-6) === "-short") {
                fieldsToTry.push(field);
                fieldsToTry.push(field.slice(0, -6))
            } else {
                fieldsToTry.push(field);
            }

            for (let h = 0, hlen = fieldsToTry.length; h < hlen; h++) {
                let variantMatch = false;
                let field = fieldsToTry[h];

                ret = { name: "", usedOrig: stopOrig, locale: getFieldLocale(Item, field) };

                opts = state.opt[locale_type] ? state.opt[locale_type].slice() : [];
                let hasVal = false;

                if (locale_type === 'locale-orig') {
                    if (!stopOrig) {
                        ret.name = Item[field];
                        ret.usedOrig = false;
                    }
                    hasVal = true;
                    usingOrig = true;
                } else if (use_default && ("undefined" === typeof opts || opts.length === 0)) {
                    ret.name = Item[field];
                    ret.usedOrig = true;
                    hasVal = true;
                    usingOrig = true;
                }

                if (!hasVal) {
                    for (let i = 0, ilen = opts.length; i < ilen; i += 1) {
                        opt = opts[i];
                        o = opt.split(/[\-_]/)[0];
                        if (opt && Item.multi && Item.multi._keys[field] && Item.multi._keys[field][opt]) {
                            ret.name = Item.multi._keys[field][opt];
                            ret.locale = opt;
                            hasVal = true;
                            variantMatch = true;
                            usingOrig = false;
                            break;
                        } else if (o && Item.multi && Item.multi._keys[field] && Item.multi._keys[field][o]) {
                            ret.name = Item.multi._keys[field][o];
                            ret.locale = o;
                            hasVal = true;
                            variantMatch = true;
                            usingOrig = false;
                            break;
                        }
                    }
                    if (!ret.name && use_default) {
                        ret = { name: Item[field], usedOrig: true, locale: getFieldLocale(Item, field) };
                        usingOrig = true;
                    }
                }
                ret.token = Util_cloneToken(this);
                if (h === 0) {
                    if (variantMatch) {
                        ret.found_variant_ok = true;
                    }
                    firstValue = ret;
                    if (!stickyLongForm && ("undefined" === typeof opts || opts.length === 0)) {
                        breakMe = true;
                    }
                    if (variantMatch) {
                        breakMe = true;
                    }
                } else {
                    if (!stickyLongForm && !variantMatch && firstValue) {
                        ret = firstValue;
                        field = fieldsToTry[0];
                    } else if (variantMatch) {
                        ret.found_variant_ok = true;
                    }
                }
                if (["title", "container-title"].indexOf(field) > -1) {
                    if (!usedOrig
                        && (!ret.token.strings["text-case"]
                            || ret.token.strings["text-case"] === "sentence"
                            || ret.token.strings["text-case"] === "normal")) {
                        const locale = state.opt.lang;
                        let lang;
                        if (usingOrig) {
                            lang = false;
                        } else {
                            lang = ret.locale;
                        }
                        const seg = field.slice(0, -5);
                        const sentenceCase = ret.token.strings["text-case"] === "sentence" ? true : false;
                        ret.name = titlecaseSentenceOrNormal(state, Item, seg, lang, sentenceCase, Output_formatters as any);
                        delete ret.token.strings["text-case"];
                    }
                }
                if (breakMe) {
                    break;
                }
            }
            return ret;
        }
        this.getTextSubField = getTextSubField;

        function loadAbbreviation(jurisdiction: string, category: string, orig: string, lang: string): string {
            if (!jurisdiction) {
                jurisdiction = "default";
            }
            const country = jurisdiction.split(":")[0];
            const domain = getAbbrevsDomain(state, country, lang);
            if (domain) {
                jurisdiction += ("@" + domain);
            }
            if (!orig) {
                if (!state.transform.abbrevs[jurisdiction]) {
                    state.transform.abbrevs[jurisdiction] = new state.sys.AbbreviationSegments();
                }
                if (!state.transform.abbrevs[jurisdiction][category]) {
                    state.transform.abbrevs[jurisdiction][category] = {};
                }
                return jurisdiction;
            }
            if (state.sys.getAbbreviation) {
                jurisdiction = state.sys.getAbbreviation(state.opt.styleID, state.transform.abbrevs, jurisdiction, category, orig);
                if (!jurisdiction) {
                    jurisdiction = "default";
                    if (domain) {
                        jurisdiction += ("@" + domain);
                    }
                }
            }
            return jurisdiction;
        }
        this.loadAbbreviation = loadAbbreviation;

        function publisherCheck(tok: Token, Item: CslItem, primary: any, family_var: string): boolean {
            const varname = tok.variables[0];
            if (state.publisherOutput && primary) {
                if (["publisher", "publisher-place"].indexOf(varname) === -1) {
                    return false;
                } else {
                    state.publisherOutput[varname + "-token"] = tok;
                    state.publisherOutput.varlist.push(varname);
                    const lst = primary.split(/;\s*/);
                    if (lst.length === state.publisherOutput[varname + "-list"].length) {
                        state.publisherOutput[varname + "-list"] = lst;
                    }
                    for (let i = 0, ilen = lst.length; i < ilen; i += 1) {
                        lst[i] = abbreviate(state, tok, Item, false, lst[i], family_var, true);
                    }
                    state.tmp[varname + "-token"] = tok;
                    return true;
                }
            }
            return false;
        }

        function citeFormCheck(Item: CslItem, value: string): void {
            let m = value.match(/^#([0-9]+).*>>>/);
            if (m && m[1]) {
                Item["cite-form"] = m[1];
            }
        }

        function quashCheck(jurisdiction: string, value: string): string {
            let m = value.match(/^(?:#[0-9]+)*(?:!((?:[-_a-z]+(?:(?:.*)))(?:,(?:[-_a-z]+(?:(?:.*))))*))*>>>/);
            if (m) {
                value = value.slice(m[0].length);
                if (m[1]) {
                    const fields = m[1].split(",");
                    for (let i = 0, ilen = fields.length; i < ilen; i += 1) {
                        const rawField = fields[i];
                        const mm = rawField.match(/^([-_a-z]+)(?:\:(.*))*$/);
                        let field = mm[1];
                        const trimmer = state.tmp.abbrev_trimmer;
                        if (mm[2]) {
                            if (trimmer && jurisdiction) {
                                if (!trimmer[jurisdiction]) {
                                    trimmer[jurisdiction] = {};
                                }
                                trimmer[jurisdiction][field] = mm[2];
                            }
                        } else if (state.tmp.done_vars.indexOf(field) === -1) {
                            if (trimmer && jurisdiction) {
                                if (!trimmer.QUASHES[jurisdiction]) {
                                    trimmer.QUASHES[jurisdiction] = {};
                                }
                                trimmer.QUASHES[jurisdiction][field] = true;
                            }
                            state.tmp.done_vars.push(field);
                        }
                    }
                }
            }
            return value;
        }
        this.quashCheck = quashCheck;

        function getOutputFunction(variables: string[], family_var?: string, abbreviation_fallback?: any, alternative_varname?: string): Function {
            let localesets;
            const langPrefs = LangPrefsMap[variables[0]];
            if (!langPrefs) {
                localesets = false;
            } else {
                localesets = state.opt['cite-lang-prefs'][langPrefs];
            }

            return function (this: any, state: CslState, Item: CslItem, item: any): any {
                let primary: any, primary_locale: any, secondary: any, secondary_locale: any, tertiary: any, tertiary_locale: any;
                if (!variables[0] || (!Item[variables[0]] && !Item[alternative_varname])) {
                    return null;
                }
                if (!state.tmp.just_looking && item && item["suppress-author"]) {
                    if (!state.tmp.probably_rendered_something && state.tmp.can_substitute.length() > 1) {
                        return null;
                    }
                }
                const slot: any = { primary: false, secondary: false, tertiary: false };
                if (state.tmp.area.slice(-5) === "_sort") {
                    slot.primary = 'locale-sort';
                } else {
                    if (localesets && localesets.length === 1 && localesets[0] === "locale-orig") {
                        slot.primary = "locale-orig";
                        localesets = false;
                    } else if (localesets && !state.tmp.multi_layout) {
                        const slotnames = ["primary", "secondary", "tertiary"];
                        for (let i = 0, ilen = slotnames.length; i < ilen; i += 1) {
                            if (localesets.length - 1 < i) {
                                break;
                            }
                            if (localesets[i]) {
                                slot[slotnames[i]] = 'locale-' + localesets[i];
                            }
                        }
                    } else {
                        slot.primary = 'locale-orig';
                    }
                }

                if (variables[0] === "title-short"
                    || (state.tmp.area !== "bibliography"
                        && !(state.tmp.area === "citation"
                             && state.opt.xclass === "note"
                             && item && !item.position))) {
                    slot.secondary = false;
                    slot.tertiary = false;
                }

                if (state.tmp.multi_layout) {
                    slot.secondary = false;
                    slot.tertiary = false;
                }

                if (state.tmp["publisher-list"]) {
                    if (variables[0] === "publisher") {
                        state.tmp["publisher-token"] = this;
                    } else if (variables[0] === "publisher-place") {
                        state.tmp["publisher-place-token"] = this;
                    }
                    return null;
                }

                const oldLangArray = state.tmp.lang_array.slice();

                let res = getTextSubField.call(this, Item, variables[0], slot.primary, true, null, family_var);
                primary = res.name;
                primary_locale = res.locale;
                const primary_tok = res.token;
                const primaryUsedOrig = res.usedOrig;
                if (family_var && !res.found_variant_ok) {
                    primary = abbreviate(state, primary_tok, Item, alternative_varname, primary, family_var, true);
                    if (primary) {
                        citeFormCheck(Item, primary);
                        if (!state.tmp.just_looking) {
                            primary = quashCheck(Item.jurisdiction, primary);
                        }
                    }
                }
                if (publisherCheck(this, Item, primary, family_var)) {
                    state.tmp.lang_array = oldLangArray;
                    return null;
                }

                secondary = false;
                tertiary = false;
                let secondary_tok;
                let tertiary_tok;
                if (slot.secondary) {
                    res = getTextSubField.call(this, Item, variables[0], slot.secondary, false, res.usedOrig, null, family_var);
                    secondary = res.name;
                    secondary_locale = res.locale;
                    secondary_tok = res.token;
                    if (family_var && !res.found_variant_ok) {
                        if (secondary) {
                            secondary = abbreviate(state, secondary_tok, Item, false, secondary, family_var, true);
                        }
                    }
                }
                if (slot.tertiary) {
                    res = getTextSubField.call(this, Item, variables[0], slot.tertiary, false, res.usedOrig, null, family_var);
                    tertiary = res.name;
                    tertiary_locale = res.locale;
                    tertiary_tok = res.token;
                    if (family_var && !res.found_variant_ok) {
                        if (tertiary) {
                            tertiary = abbreviate(state, tertiary_tok, Item, false, tertiary, family_var, true);
                        }
                    }
                }

                let primaryPrefix;
                if (slot.primary === "locale-translit") {
                    primaryPrefix = state.opt.citeAffixes[langPrefs][slot.primary].prefix;
                }

                if (primaryPrefix === "<i>" && variables[0] === 'title' && !primaryUsedOrig) {
                    let hasItalic = false;
                    for (let i = 0, ilen = primary_tok.decorations.length; i < ilen; i += 1) {
                        if (primary_tok.decorations[i][0] === "@font-style"
                            && primary_tok.decorations[i][1] === "italic") {
                            hasItalic = true;
                        }
                    }
                    if (!hasItalic) {
                        primary_tok.decorations.push(["@font-style", "italic"]);
                    }
                }

                if (primary_locale !== "en" && primary_tok.strings["text-case"] === "title") {
                    primary_tok.strings["text-case"] = "passthrough";
                }

                if ("title" === variables[0]) {
                    primary = demoteNoiseWords(state, primary, this["leading-noise-words"]);
                }
                if (secondary || tertiary) {
                    state.output.openLevel("empty");

                    primary_tok.strings.suffix = primary_tok.strings.suffix.replace(/[ .,]+$/, "");
                    if (primary_locale) {
                        state.tmp.lang_array = [primary_locale].concat(oldLangArray);
                    }
                    UPDATE_GROUP_CONTEXT_CONDITION(state, null, null, primary_tok, primary_tok.strings.prefix + primary);
                    state.output.append(primary, primary_tok);
                    state.tmp.probably_rendered_something = true;

                    if (primary === secondary) {
                        secondary = false;
                    }
                    if (secondary) {
                        secondary_tok.strings.prefix = state.opt.citeAffixes[langPrefs][slot.secondary].prefix;
                        secondary_tok.strings.suffix = state.opt.citeAffixes[langPrefs][slot.secondary].suffix;
                        if (!secondary_tok.strings.prefix) {
                            secondary_tok.strings.prefix = " ";
                        }
                        for (let i = secondary_tok.decorations.length - 1; i > -1; i += -1) {
                            if (['@quotes/true', '@font-style/italic', '@font-style/oblique', '@font-weight/bold'].indexOf(secondary_tok.decorations[i].join('/')) > -1) {
                                secondary_tok.decorations = secondary_tok.decorations.slice(0, i).concat(secondary_tok.decorations.slice(i + 1));
                            }
                        }
                        if (secondary_locale !== "en" && secondary_tok.strings["text-case"] === "title") {
                            secondary_tok.strings["text-case"] = "passthrough";
                        }
                        if (secondary_locale) {
                            state.tmp.lang_array = [secondary_locale].concat(oldLangArray);
                        }
                        const secondary_outer = new Token();
                        secondary_outer.decorations.push(["@font-style", "normal"]);
                        secondary_outer.decorations.push(["@font-weight", "normal"]);
                        state.output.openLevel(secondary_outer);
                        state.output.append(secondary, secondary_tok);
                        state.output.closeLevel();
                    }
                    if (primary === tertiary) {
                        tertiary = false;
                    }

                    if (tertiary) {
                        tertiary_tok.strings.prefix = state.opt.citeAffixes[langPrefs][slot.tertiary].prefix;
                        tertiary_tok.strings.suffix = state.opt.citeAffixes[langPrefs][slot.tertiary].suffix;
                        if (!tertiary_tok.strings.prefix) {
                            tertiary_tok.strings.prefix = " ";
                        }
                        for (let i = tertiary_tok.decorations.length - 1; i > -1; i += -1) {
                            if (['@quotes/true', '@font-style/italic', '@font-style/oblique', '@font-weight/bold'].indexOf(tertiary_tok.decorations[i].join('/')) > -1) {
                                tertiary_tok.decorations = tertiary_tok.decorations.slice(0, i).concat(tertiary_tok.decorations.slice(i + 1));
                            }
                        }
                        if (tertiary_locale !== "en" && tertiary_tok.strings["text-case"] === "title") {
                            tertiary_tok.strings["text-case"] = "passthrough";
                        }
                        if (tertiary_locale) {
                            state.tmp.lang_array = [tertiary_locale].concat(oldLangArray);
                        }
                        const tertiary_outer = new Token();
                        tertiary_outer.decorations.push(["@font-style", "normal"]);
                        tertiary_outer.decorations.push(["@font-weight", "normal"]);
                        state.output.openLevel(tertiary_outer);
                        state.output.append(tertiary, tertiary_tok);
                        state.output.closeLevel();
                    }

                    state.output.closeLevel();
                } else {
                    if (primary_locale) {
                        state.tmp.lang_array = [primary_locale].concat(oldLangArray);
                    }
                    UPDATE_GROUP_CONTEXT_CONDITION(state, null, null, primary_tok, primary_tok.strings.prefix + primary);
                    state.output.append(primary, primary_tok);
                    state.tmp.probably_rendered_something = true;
                }

                state.tmp.lang_array = oldLangArray;

                if (state.tmp.can_block_substitute) {
                    state.tmp.name_node.children.push(state.output.current.value());
                }
                return null;
            };
        }
        this.getOutputFunction = getOutputFunction;
    }
}
