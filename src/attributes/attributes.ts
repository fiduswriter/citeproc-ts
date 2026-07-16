import { CSL } from '../csl';

import { DATE_VARIABLES, DESCENDING, GIVENNAME_DISAMBIGUATION_RULES, LITERAL, NUMERIC_VARIABLES, POSITION, POSITION_CONTAINER_SUBSEQUENT, POSITION_FIRST, POSITION_IBID, POSITION_IBID_WITH_LOCATOR, POSITION_MAP, POSITION_SUBSEQUENT, START } from '../constants/core';
export const Attributes: { [key: string]: Function } = {};

Attributes["@disambiguate"] = function (state: CslState, arg: string) {
    if (!this.tests) {this.tests = []; };
    if (arg === "true") {
        state.opt.has_disambiguate = true;
        let func = function (Item: CslItem) {
            if (state.tmp.area === "bibliography") {
                if (state.tmp.disambiguate_count < state.registry.registry[Item.id].disambig.disambiguate) {
                    state.tmp.disambiguate_count += 1;
                    return true;
                }
            } else {
                state.tmp.disambiguate_maxMax += 1;
                if (state.tmp.disambig_settings.disambiguate
                    && state.tmp.disambiguate_count < state.tmp.disambig_settings.disambiguate) {
                    state.tmp.disambiguate_count += 1;
                    return true;
                }
            }
            return false;
        };
        this.tests.push(func);
    } else if (arg === "check-ambiguity-and-backreference") {
        let func = function (Item: CslItem) {
            if (state.registry.registry[Item.id].disambig.disambiguate && state.registry.registry[Item.id]["citation-count"] > 1) {
                return true;
            }
            return false;
        };
        this.tests.push(func);
    }
};

Attributes["@is-numeric"] = function (state: CslState, arg: string) {
    if (!this.tests) {this.tests = []; };
    const variables = arg.split(/\s+/);
    const maketest = function(variable: string) {
        return function (Item: CslItem, item: any) {
            let myitem: any = Item;
            if (item && ["locator","locator-extra"].indexOf(variable) > -1) {
                myitem = item;
            }
            if (!myitem[variable]) {
                return false;
            }
            if (NUMERIC_VARIABLES.indexOf(variable) > -1) {
                if (!state.tmp.shadow_numbers[variable]) {
                    state.processNumber(false, myitem, variable, Item.type);
                }
                if (state.tmp.shadow_numbers[variable].numeric) {
                    return true;
                }
            } else if (["title","version"].indexOf(variable) > -1) {
                if (myitem[variable].slice(-1) === "" + parseInt(myitem[variable].slice(-1), 10)) {
                    return true;
                }
            }
            return false;
        };
    };
    for (let i=0; i<variables.length; i+=1) {
        this.tests.push(maketest(variables[i]));
    }
};


Attributes["@is-uncertain-date"] = function (state: CslState, arg: string) {
    if (!this.tests) {this.tests = []; };
    const variables = arg.split(/\s+/);
    const maketest = function (myvariable: string) {
        return function(Item: CslItem) {
            if (Item[myvariable] && Item[myvariable].circa) {
                return true;
            } else {
                return false;
            }
        };
    };
    for (let i=0,ilen=variables.length;i<ilen;i+=1) {
        this.tests.push(maketest(variables[i]));
    }
};


Attributes["@locator"] = function (state: CslState, arg: string) {
    if (!this.tests) {this.tests = []; };
    let trylabels: string | string[] = arg.replace("sub verbo", "sub-verbo");
    trylabels = trylabels.split(/\s+/);
    const maketest = function (trylabel: string) {
        if (trylabel === "article") {
            trylabel = "article-locator";
        } else if (trylabel === "title") {
            trylabel = "title-locator";
        }
        return function(Item: CslItem, item: any) {
            let label;
            state.processNumber(false, item, "locator");
            label = state.tmp.shadow_numbers.locator.label;
            if (!label) {
                label = item && item.label ? item.label : "page";
            }
            if (label && trylabel === label) {
                return true;
            } else {
                return false;
            }
        };
    };
    for (let i=0,ilen=trylabels.length;i<ilen;i+=1) {
        this.tests.push(maketest(trylabels[i]));
    }
};


Attributes["@position"] = function (state: CslState, arg: string) {
    if (!this.tests) {this.tests = []; };
    let tryposition;
    state.opt.update_mode = POSITION;
    const trypositions = arg.split(/\s+/);
    const testSubsequentNear = function (Item: CslItem, item: any) {
        if (item && POSITION_MAP[item.position] >= POSITION_MAP[POSITION_SUBSEQUENT] && item["near-note"]) {
            return true;
        }
        return false;
    };
    const testSubsequentNotNear = function (Item: CslItem, item: any) {
        if (item && POSITION_MAP[item.position] == POSITION_MAP[POSITION_SUBSEQUENT] && !item["near-note"]) {
            return true;
        }
        return false;
    };
    const maketest = function(tryposition: number) {
        return function (Item: CslItem, item: any) {
            if (state.tmp.area === "bibliography") {
                return false;
            }
            if (item && "undefined" === typeof item.position) {
                item.position = 0;
            }
            if (item && typeof item.position === "number") {
                if (item.position === 0 && tryposition === 0) {
                    return true;
                } else if (tryposition > 0 && POSITION_MAP[item.position] >= POSITION_MAP[tryposition]) {
                    return true;
                }
            } else if (tryposition === 0) {
                return true;
            }
            return false;
        };
    };
    for (let i=0,ilen=trypositions.length;i<ilen;i+=1) {
        let tryposition: string | number = trypositions[i];
        if (tryposition === "first") {
            tryposition = POSITION_FIRST;
        } else if (tryposition === "container-subsequent") {
            tryposition = POSITION_CONTAINER_SUBSEQUENT;
        } else if (tryposition === "subsequent") {
            tryposition = POSITION_SUBSEQUENT;
        } else if (tryposition === "ibid") {
            tryposition = POSITION_IBID;
        } else if (tryposition === "ibid-with-locator") {
            tryposition = POSITION_IBID_WITH_LOCATOR;
        }
        if ("near-note" === tryposition) {
            this.tests.push(testSubsequentNear);
        } else if ("far-note" === tryposition) {
            this.tests.push(testSubsequentNotNear);
        } else {
            this.tests.push(maketest(tryposition as number));
        }
    }
};

Attributes["@type"] = function (state: CslState, arg: string) {
    if (!this.tests) {this.tests = []; };
    const types = arg.split(/\s+/);
    const maketest = function (mytype: string) {
        return function(Item: CslItem) {
            let ret = (Item.type === mytype);
            if (ret) {
                return true;
            } else {
                return false;
            }
        };
    };
    const tests = [];
    for (let i=0,ilen=types.length;i<ilen;i+=1) {
        tests.push(maketest(types[i]));
    }
    this.tests.push(state.fun.match.any(this, state, tests));
};

Attributes["@variable"] = function (state: CslState, arg: string) {
    if (!this.tests) {this.tests = []; };
    let func;
    this.variables = arg.split(/\s+/);
    this.variables_real = this.variables.slice();

    if ("label" === this.name && this.variables[0]) {
        this.strings.term = this.variables[0];
    } else if (["names", "date", "text", "number"].indexOf(this.name) > -1) {
        func = function (state: CslState, Item: CslItem, item: any) {
            for (let i = this.variables.length - 1; i > -1; i += -1) {
                this.variables.pop();
            }
            for (let i=0,ilen=this.variables_real.length;i<ilen;i++) {
                if (state.tmp.done_vars.indexOf(this.variables_real[i]) === -1
                   ) {
                    this.variables.push(this.variables_real[i]);
                }
                if (state.tmp.can_block_substitute) {
                    state.tmp.done_vars.push(this.variables_real[i]);
                }
            }
        };
        this.execs.push(func);

        func = function (state: CslState, Item: CslItem, item: any) {
            let output = false;
            for (let i=0,ilen=this.variables.length;i<ilen;i++) {
                let variable = this.variables[i];
                if (["authority", "committee"].indexOf(variable) > -1
                    && "string" === typeof Item[variable]
                    && "names" === this.name) {

                    let isValid = true;
                    let rawNames = Item[variable].split(/\s*;\s*/);
                    let rawMultiNames = {};
                    if (Item.multi && Item.multi._keys[variable]) {
                        for (let langTag in Item.multi._keys[variable]) {
                            rawMultiNames[langTag] = Item.multi._keys[variable][langTag].split(/\s*;\s*/);
                            if (rawMultiNames[langTag].length !== rawNames.length) {
                                isValid = false;
                                break;
                            }
                        }
                    }
                    if (!isValid) {
                        rawNames = [Item[variable]];
                        rawMultiNames = Item.multi._keys[variable];
                    }
                    for (let j = 0, jlen = rawNames.length; j < jlen; j++) {
                        const creatorParent = {
                            literal:rawNames[j],
                            multi:{
                                _key:{}
                            }
                        };
                        for (let langTag in rawMultiNames) {
                            const creatorChild = {
                                literal:rawMultiNames[langTag][j]
                            };
                            creatorParent.multi._key[langTag] = creatorChild;
                        }
                        rawNames[j] = creatorParent;
                    }
                    Item[variable] = rawNames;
                }
                if (this.strings.form === "short" && !Item[variable]) {
                    if (variable === "title") {
                        variable = "title-short";
                    } else if (variable === "container-title") {
                        variable = "container-title-short";
                    }
                }
                if (variable === "year-suffix") {
                    output = true;
                    break;
                } else if (DATE_VARIABLES.indexOf(variable) > -1) {
                    if (state.opt.development_extensions.locator_date_and_revision && "locator-date" === variable) {
                        output = true;
                        break;
                    }
                    if (Item[variable]) {
                        for (let key in Item[variable]) {
                            if (this.dateparts.indexOf(key) === -1 && "literal" !== key) {
                                continue;
                            }
                            if (Item[variable][key]) {
                                output = true;
                                break;
                            }
                        }
                        if (output) {
                            break;
                        }
                    }
                } else if ("locator" === variable) {
                    if (item && item.locator) {
                        output = true;
                    }
                    break;
                } else if ("locator-extra" === variable) {
                    if (item && item["locator-extra"]) {
                        output = true;
                    }
                    break;
                } else if (["citation-number","citation-label"].indexOf(variable) > -1) {
                    output = true;
                    break;
                } else if ("first-reference-note-number" === variable) {
                    if (item && item["first-reference-note-number"]) {
                        output = true;
                    }
                    break;
                } else if ("first-container-reference-note-number" === variable) {
                    if (item && item["first-container-reference-note-number"]) {
                        output = true;
                    }
                    break;
                } else if ("hereinafter" === variable) {
                    if (state.transform.abbrevs["default"].hereinafter[Item.id]
                        && state.sys.getAbbreviation
                        && Item.id) {
						
                        output = true;
                    }
                    break;
                } else if ("object" === typeof Item[variable]) {
                    break;
                } else if ("string" === typeof Item[variable] && Item[variable]) {
                    output = true;
                    break;
                } else if ("number" === typeof Item[variable]) {
                    output = true;
                    break;
                }
                if (output) {
                    break;
                }
            }
            if (output) {
                for (let i=0,ilen=this.variables_real.length;i<ilen;i++) {
                    let variable = this.variables_real[i];
                    if (variable !== "citation-number" || state.tmp.area !== "bibliography") {
                        state.tmp.cite_renders_content = true;
                    }
                    state.tmp.group_context.tip.variable_success = true;
                    if (state.tmp.can_substitute.value() 
                        && state.tmp.area === "bibliography"
                        && "string" === typeof Item[variable]) {

                        state.tmp.name_node.top = state.output.current.value();
                        state.tmp.rendered_name.push(Item[variable]);
                    }
                }
                state.tmp.can_substitute.replace(false,  LITERAL);
            } else {
                state.tmp.group_context.tip.variable_attempt = true;
            }
        };
        this.execs.push(func);
    } else if (["if",  "else-if", "condition"].indexOf(this.name) > -1) {
        const maketest = function (variable: string) {
            return function(Item: CslItem, item: any){
                let myitem = Item;
                if (item && ["locator", "locator-extra", "first-reference-note-number", "first-container-reference-note-number", "locator-date"].indexOf(variable) > -1) {
                    myitem = item;
                }
                if (variable === "hereinafter" && state.sys.getAbbreviation && myitem.id) {
                    if (state.transform.abbrevs["default"].hereinafter[myitem.id]) {
                        return true;
                    }
                } else if (myitem[variable]) {
                    if ("number" === typeof myitem[variable] || "string" === typeof myitem[variable]) {
                        return true;
                    } else if ("object" === typeof myitem[variable]) {
                        for (let key in myitem[variable]) {
                            if (myitem[variable][key]) {
                                return true;
                            }
                        }
                    }
                }
                return false;
            };
        };
        for (let i=0,ilen=this.variables.length;i<ilen;i+=1) {
            this.tests.push(maketest(this.variables[i]));
        }
    }
};


Attributes["@page"] = function (state: CslState, arg: string) {
    if (!this.tests) {this.tests = []; };
    let trylabels: string | string[] = arg.replace("sub verbo", "sub-verbo");
    trylabels = trylabels.split(/\s+/);
    const maketest = function (trylabel: string) {
        return function(Item: CslItem) {
            let label;
            state.processNumber(false, Item, "page", Item.type);
            if (!state.tmp.shadow_numbers.page.label) {
                label = "page";
            } else if (state.tmp.shadow_numbers.page.label === "sub verbo") {
                label = "sub-verbo";
            } else {
                label = state.tmp.shadow_numbers.page.label;
            }
            if (state.tmp.shadow_numbers.page.values.length > 0) {
                if (state.tmp.shadow_numbers.page.values[0].gotosleepability) {
                    state.tmp.shadow_numbers.page.values[0].labelVisibility = false;
                }
            }
            if (trylabel === label) {
                return true;
            } else {
                return false;
            }
        };
    };
    for (let i=0,ilen=trylabels.length;i<ilen;i+=1) {
        this.tests.push(maketest(trylabels[i]));
    }
};


Attributes["@number"] = function (state: CslState, arg: string) {
    if (!this.tests) {this.tests = []; };
    let trylabels = arg.split(/\s+/);
    const maketest = function(trylabel) {
        return function (Item: CslItem) {
            let label;
            state.processNumber(false, Item, "number", Item.type);
            if (!state.tmp.shadow_numbers.number.label) {
                label = "number";
            } else {
                label = state.tmp.shadow_numbers.number.label;
            }
            if (trylabel === label) {
                return true;
            } else {
                return false;
            }
        };
    };
    for (let i=0,ilen=trylabels.length;i<ilen;i+=1) {
        this.tests.push(maketest(trylabels[i]));
    }
};

Attributes["@jurisdiction"] = function (state: CslState, arg: string) {
    if (!this.tests) {this.tests = []; };
    const tryjurisdictions = arg.split(/\s+/);
    
    const maketests = function (tryjurisdictions: string[]) {
        return function(Item: CslItem) {
            if (!Item.jurisdiction) {
                return false;
            }
            const jurisdiction = Item.jurisdiction;
            for (let i=0,ilen=tryjurisdictions.length;i<ilen;i++) {
                if (jurisdiction === tryjurisdictions[i]) {
                    return true;
                }
            }
            return false;
        };
    };
    this.tests.push(maketests(tryjurisdictions));
};

Attributes["@country"] = function (state: CslState, arg: string) {
    if (!this.tests) {this.tests = []; };
    const trycountries = arg.split(/\s+/);
    
    const maketests = function (trycountries: string[]) {
        return function(Item: CslItem) {
            if (!Item.country) {
                return false;
            }
            const country = Item.country;
            for (let i=0,ilen=trycountries.length;i<ilen;i++) {
                if (country === trycountries[i]) {
                    return true;
                }
            }
            return false;
        };
    };
    this.tests.push(maketests(trycountries));
};

Attributes["@context"] = function (state: CslState, arg: string) {
    if (!this.tests) {this.tests = []; };
    let func = function (): boolean {
        if (["bibliography", "citation"].indexOf(arg) > -1) {
		    const area = state.tmp.area.slice(0, arg.length);
		    if (area === arg) {
			    return true;
		    }
		    return false;
        } else if ("alternative" === arg) {
            return !!state.tmp.abort_alternative;
        }
    };
    this.tests.push(func);
};

Attributes["@has-year-only"] = function (state: CslState, arg: string) {
    if (!this.tests) {this.tests = []; };
    const trydates = arg.split(/\s+/);
    const maketest = function (trydate: string) {
        return function(Item: CslItem) {
            const date = Item[trydate];
            if (!date || date.month || date.season) {
                return false;
            } else {
                return true;
            }
        };
    };
    for (let i=0,ilen=trydates.length;i<ilen;i+=1) {
        this.tests.push(maketest(trydates[i]));
    }
};

Attributes["@has-to-month-or-season"] = function (state: CslState, arg: string) {
    if (!this.tests) {this.tests = []; };
    const trydates = arg.split(/\s+/);
    const maketest = function (trydate: string) {
        return function(Item: CslItem) {
            const date = Item[trydate];
            if (!date || (!date.month && !date.season) || date.day) {
                return false;
            } else {
                return true;
            }
        };
    };
    for (let i=0,ilen=trydates.length;i<ilen;i+=1) {
        this.tests.push(maketest(trydates[i]));
    }
};

Attributes["@has-day"] = function (state: CslState, arg: string) {
    if (!this.tests) {this.tests = []; };
    const trydates = arg.split(/\s+/);
    const maketest = function (trydate: string) {
        return function(Item: CslItem) {
            const date = Item[trydate];
            if (!date || !date.day) {
                return false;
            } else {
                return true;
            }
        };
    };
    for (let i=0,ilen=trydates.length;i<ilen;i+=1) {
        this.tests.push(maketest(trydates[i]));
    }
};

Attributes["@is-plural"] = function (state: CslState, arg: string) {
    if (!this.tests) {this.tests = []; };
    let func = function (Item: CslItem) {
        const nameList = Item[arg];
        if (nameList && nameList.length) {
            let persons = 0;
            let institutions = 0;
            let last_is_person = false;
            for (let i = 0, ilen = nameList.length; i < ilen; i += 1) {
                if (state.opt.development_extensions.spoof_institutional_affiliations
                    && (nameList[i].literal || (nameList[i].isInstitution && nameList[i].family && !nameList[i].given))) {
                    institutions += 1;
                    last_is_person = false;
                } else {
                    persons += 1;
                    last_is_person = true;
                }
            }
            if (persons > 1) {
                return true;
            } else if (institutions > 1) {
                return true;
            } else if (institutions && last_is_person) {
                return true;
            }
        }
        return false;
    };
    this.tests.push(func);
};

Attributes["@is-multiple"] = function (state: CslState, arg: string) {
    if (!this.tests) {this.tests = []; };
    let func = function (Item: CslItem) {
        const val = ("" + Item[arg]);
        let lst = val.split(/(?:,\s|\s(?:tot\sen\smet|līdz|oraz|and|bis|έως|και|och|až|do|en|et|in|ir|ja|og|sa|to|un|und|és|și|i|u|y|à|e|a|и|-|–)\s|—|\&)/);
        if (lst.length > 1) {
            return true;
        }
        return false;
    };
    this.tests.push(func);
};

Attributes["@locale"] = function (state: CslState, arg: string) {
    if (!this.tests) {this.tests = []; };
    let ret, langspec, lang, lst, i, ilen;
    const locale_default = state.opt["default-locale"][0];

    if (this.name === "layout") {
        this.locale_raw = arg;
        if (this.tokentype === START) {
            if (!state.opt.multi_layout) {
                state.opt.multi_layout = [];
            }
            const locale_data = [];
            const locales = arg.split(/\s+/);
            const sort_locale = {};
            const localeMaster = CSL.localeResolve(locales[0], locale_default);
            locale_data.push(localeMaster);
            if (localeMaster.generic) {
                sort_locale[localeMaster.generic] = localeMaster.best;
            } else {
                sort_locale[localeMaster.best] = localeMaster.best;
            }
            for (let i=1,ilen=locales.length;i<ilen;i+=1) {
                const localeServant = CSL.localeResolve(locales[i], locale_default);
                locale_data.push(localeServant);
                if (localeServant.generic) {
                    sort_locale[localeServant.generic] = localeMaster.best;
                } else {
                    sort_locale[localeServant.best] = localeMaster.best;
                }

            }
            state[state.build.area].opt.sort_locales.push(sort_locale);
            state.opt.multi_layout.push(locale_data);
        }
        state.opt.has_layout_locale = true;
    } else {
        lst = arg.split(/\s+/);

        const locale_bares = [];
        for (let i = 0, ilen = lst.length; i < ilen; i += 1) {
            lang = lst[i];
        
            langspec = CSL.localeResolve(lang, locale_default);
            if (lst[i].length === 2) {
                locale_bares.push(langspec.bare);
            }
            state.localeConfigure(langspec, true);
            
            lst[i] = langspec;
        }
        const locale_list = lst.slice();

        const maketest = function (locale_list: any[], locale_default: string, locale_bares: string[]) {
            return function (Item: CslItem) {
                let res;
                ret = [];
                res = false;
                let langspec: any = false;

                let lang: string;
                if (!Item.language) {
                    lang = locale_default;
                } else {
                    lang = Item.language;
                }
                langspec = CSL.localeResolve(lang, locale_default);
                for (let i = 0, ilen = locale_list.length; i < ilen; i += 1) {
                    if (langspec.best === locale_list[i].best) {
                        state.tmp.condition_lang_counter_arr.push(state.tmp.condition_counter);
                        state.tmp.condition_lang_val_arr.push(state.opt.lang);
                        state.opt.lang = locale_list[0].best;
                        res = true;
                        break;
                    }
                }
                if (!res && locale_bares.indexOf(langspec.bare) > -1) {
                    state.tmp.condition_lang_counter_arr.push(state.tmp.condition_counter);
                    state.tmp.condition_lang_val_arr.push(state.opt.lang);
                    state.opt.lang = locale_list[0].best;
                    res = true;
                }
                return res;
            };
        };
        this.tests.push(maketest(locale_list,locale_default,locale_bares));
    }
};

Attributes["@alternative-node-internal"] = function (state: CslState) {
    if (!this.tests) {this.tests = []; };
    const maketest = function (me: any) {
        return function() {
            return !state.tmp.abort_alternative;
        };
    };
    const me = this;
    this.tests.push(maketest(me));
};

Attributes["@locale-internal"] = function (state: CslState, arg: string) {
    if (!this.tests) {this.tests = []; };
    let langspec, lang, lst, i, ilen;
        lst = arg.split(/\s+/);

        this.locale_bares = [];
        for (let i = 0, ilen = lst.length; i < ilen; i += 1) {
            lang = lst[i];
        
            langspec = CSL.localeResolve(lang, state.opt["default-locale"][0]);
            if (lst[i].length === 2) {
                this.locale_bares.push(langspec.bare);
            }
            state.localeConfigure(langspec);
            
            lst[i] = langspec;
        }
        this.locale_default = state.opt["default-locale"][0];
        this.locale = lst[0].best;
        this.locale_list = lst.slice();
        
        const maketest = function (me: any) {
            return function (Item: CslItem) {
                let ret, res;
                ret = [];
                res = false;
                let langspec: any = false;
                if (Item.language) {
                    const lang2 = Item.language;
                    langspec = CSL.localeResolve(lang2, state.opt["default-locale"][0]);
                    if (langspec.best === state.opt["default-locale"][0]) {
                        langspec = false;
                    }
                }
                if (langspec) {
                    for (let i = 0, ilen = me.locale_list.length; i < ilen; i += 1) {
                        if (langspec.best === me.locale_list[i].best) {
                            state.opt.lang = me.locale;
                            state.tmp.last_cite_locale = me.locale;
                            state.output.openLevel("empty");
                            state.output.current.value().new_locale = me.locale;
                            res = true;
                            break;
                        }
                    }
                    if (!res && me.locale_bares.indexOf(langspec.bare) > -1) {
                        state.opt.lang = me.locale;
                        state.tmp.last_cite_locale = me.locale;
                        state.output.openLevel("empty");
                        state.output.current.value().new_locale = me.locale;
                        res = true;
                    }
                }
                return res;
            };
        };
        const me = this;
        this.tests.push(maketest(me));
};


Attributes["@court-class"] = function (state: CslState, arg: string) {
    if (!this.tests) {this.tests = []; };
	const tryclasses = arg.split(/\s+/);
    const maketest = function (tryclass: string) {
        return function(Item: CslItem) {
            const cls = CSL.GET_COURT_CLASS(state, Item);
            if (cls === tryclass) {
                return true;
            } else {
                return false;
            }
        };
    };
    for (let i=0,ilen=tryclasses.length; i<ilen; i++) {
        this.tests.push(maketest(tryclasses[i]));
    }
};

Attributes["@container-multiple"] = function (state: CslState, arg: string) {
    if (!this.tests) {this.tests = []; };
	const retval = "true" === arg ? true : false;
    const maketest = function (retval: boolean) {
        return function(Item: CslItem) {
            if (!state.tmp.container_item_count[Item.container_id]) {
                return !retval;
            } else if (state.tmp.container_item_count[Item.container_id] > 1) {
                return retval;
            }
            return !retval;
        };
    };
    this.tests.push(maketest(retval));
};

Attributes["@container-subsequent"] = function (state: CslState, arg: string) {
    if (!this.tests) {this.tests = []; };
	const retval = "true" === arg ? true : false;
    const maketest = function (retval: boolean) {
        return function(Item: CslItem) {
            if (state.tmp.container_item_pos[Item.container_id] > 1) {
                return retval;
            }
            return !retval;
        };
    };
    this.tests.push(maketest(retval));
};

Attributes["@has-subunit"] = function (state: CslState, arg: string) {
    if (!this.tests) {this.tests = []; };
    const maketest = function(namevar: string) {
        return function (Item: CslItem) {
            let subunit_count = 0;
            for (let i in Item[namevar]) {
                const name = Item[namevar][i];
                if (!name.given) {
                    const institution = name.literal ? name.literal : name.family;
                    const length = institution.split("|").length;
                    if (subunit_count === 0 || length < subunit_count) {
                        subunit_count = length;
                    }
                }
            }
            return (subunit_count > 1);
        };
    };
    this.tests.push(maketest(arg));
}

Attributes["@cite-form"] = function (state: CslState, arg: string) {
    if (!this.tests) {this.tests = []; };
    const maketest = function(citeForm: string) {
        return function (Item: CslItem) {
            if (Item["cite-form"] === citeForm) {
                return true;
            }
            return false;
        };
    };
    this.tests.push(maketest(arg));
}

Attributes["@disable-duplicate-year-suppression"] = function (state: CslState, arg: string) {
	state.opt.disable_duplicate_year_suppression = arg.split(/\s+/);
}

Attributes["@consolidate-containers"] = function (state: CslState, arg: string) {
    Attributes["@track-containers"](state, arg);
    const args = arg.split(/\s+/);
    state.bibliography.opt.consolidate_containers = args;
}

Attributes["@track-containers"] = function (state: CslState, arg: string) {
    const args = arg.split(/\s+/);
    if (!state.bibliography.opt.track_container_items) {
        state.bibliography.opt.track_container_items = [];
    }
    if (!state.bibliography.opt.consolidate_containers) {
        state.bibliography.opt.consolidate_containers = [];
    }
    state.bibliography.opt.track_container_items = state.bibliography.opt.track_container_items.concat(args);
}

Attributes["@parallel-first"] = function (state: CslState, arg: string) {
    state.opt.parallel.enable = true;
    const vars = arg.split(/\s+/);
    if (!state.opt.track_repeat) {
        state.opt.track_repeat = {};
    }
    this.parallel_first = {};
    for (let i in vars) {
        const v = vars[i];
        this.parallel_first[v] = true;
        state.opt.track_repeat[v] = true;
    }
};
Attributes["@parallel-last"] = function (state: CslState, arg: string) {
    state.opt.parallel.enable = true;
    const vars = arg.split(/\s+/);
    if (!state.opt.track_repeat) {
        state.opt.track_repeat = {};
    }
    this.parallel_last = {};
    for (let i in vars) {
        const v = vars[i];
        this.parallel_last[v] = true;
        state.opt.track_repeat[v] = true;
    }
};
Attributes["@parallel-last-to-first"] = function (state: CslState, arg: string) {
    state.opt.parallel.enable = true;
    const vars = arg.split(/\s+/);
    this.parallel_last_to_first = {};
    for (let i=0,ilen=vars.length;i<ilen;i++) {
        this.parallel_last_to_first[vars[i]] = true;
    }
};
Attributes["@parallel-delimiter-override"] = function (state: CslState, arg: string) {
    state.opt.parallel.enable = true;
    this.strings.set_parallel_delimiter_override = arg;
};
Attributes["@parallel-delimiter-override-on-suppress"] = function (state: CslState, arg: string) {
    state.opt.parallel.enable = true;
    this.strings.set_parallel_delimiter_override_on_suppress = arg;
};
Attributes["@no-repeat"] = function (state: CslState, arg: string) {
    state.opt.parallel.enable = true;
    const vars = arg.split(/\s+/);
    if (!state.opt.track_repeat) {
        state.opt.track_repeat = {};
    }
    this.non_parallel = {};
    for (let i in vars) {
        const v = vars[i];
        this.non_parallel[v] = true;
        state.opt.track_repeat[v] = true;
    }
};

Attributes["@require"] = function (state: CslState, arg: string) {
    state.opt.use_context_condition = true;
    this.strings.require = arg;
};

Attributes["@reject"] = function (state: CslState, arg: string) {
    state.opt.use_context_condition = true;
    this.strings.reject = arg;
};

Attributes["@require-comma-on-symbol"] = function (state: CslState, arg: string) {
    state.opt.require_comma_on_symbol = arg;
}

Attributes["@gender"] = function (state: CslState, arg: string) {
    this.gender = arg;
};

Attributes["@cslid"] = function (state: CslState, arg: string) {
    this.cslid = parseInt(arg, 10);
};

Attributes["@capitalize-if-first"] = function (state: CslState, arg: string) {
    this.strings.capitalize_if_first_override = arg;
};

Attributes["@label-capitalize-if-first"] = function (state: CslState, arg: string) {
    this.strings.label_capitalize_if_first_override = arg;
};

Attributes["@label-form"] = function (state: CslState, arg: string) {
    this.strings.label_form_override = arg;
};

Attributes["@part-separator"] = function (state: CslState, arg: string) {
    this.strings["part-separator"] = arg;
};

Attributes["@leading-noise-words"] = function (state: CslState, arg: string) {
    this["leading-noise-words"] = arg;
};

Attributes["@name-never-short"] = function (state: CslState, arg: string) {
    this["name-never-short"] = arg;
};

Attributes["@class"] = function (state: CslState, arg: string) {
    state.opt["class"] = arg;
};

Attributes["@version"] = function (state: CslState, arg: string) {
    state.opt.version = arg;
};

Attributes["@value"] = function (state: CslState, arg: string) {
    this.strings.value = arg;
};

Attributes["@name"] = function (state: CslState, arg: string) {
    this.strings.name = arg;
};

Attributes["@form"] = function (state: CslState, arg: string) {
    this.strings.form = arg;
};

Attributes["@date-parts"] = function (state: CslState, arg: string) {
    this.strings["date-parts"] = arg;
};

Attributes["@range-delimiter"] = function (state: CslState, arg: string) {
    this.strings["range-delimiter"] = arg;
};

Attributes["@macro"] = function (state: CslState, arg: string) {
    this.postponed_macro = arg;
};

Attributes["@term"] = function (state: CslState, arg: string) {
    if (arg === "sub verbo") {
        this.strings.term = "sub-verbo";
    } else {
        this.strings.term = arg;
    }
};

Attributes["@xmlns"] = function () {};

Attributes["@lang"] = function (state: CslState, arg: string) {
    if (arg) {
        state.build.lang = arg;
    }
};

Attributes["@lingo"] = function () {};

Attributes["@macro-has-date"] = function () {
    this["macro-has-date"] = true;
};

Attributes["@suffix"] = function (state: CslState, arg: string) {
    this.strings.suffix = arg;
};

Attributes["@prefix"] = function (state: CslState, arg: string) {
    this.strings.prefix = arg;
};

Attributes["@delimiter"] = function (state: CslState, arg: string) {
    this.strings.delimiter = arg;
};

Attributes["@match"] = function (state: CslState, arg: string) {
    this.match = arg;
};

Attributes["@names-min"] = function (state: CslState, arg: string) {
    const val = parseInt(arg, 10);
    if (state[state.build.area].opt.max_number_of_names < val) {
        state[state.build.area].opt.max_number_of_names = val;
    }
    this.strings["et-al-min"] = val;
};

Attributes["@names-use-first"] = function (state: CslState, arg: string) {
    this.strings["et-al-use-first"] = parseInt(arg, 10);
};

Attributes["@names-use-last"] = function (state: CslState, arg: string) {
    if (arg === "true") {
        this.strings["et-al-use-last"] = true;
    } else {
        this.strings["et-al-use-last"] = false;
    }
};

Attributes["@sort"] = function (state: CslState, arg: string) {
    if (arg === "descending") {
        this.strings.sort_direction = DESCENDING;
    }
};

Attributes["@plural"] = function (state: CslState, arg: string) {
    if ("always" === arg || "true" === arg) {
        this.strings.plural = 1;
    } else if ("never" === arg || "false" === arg) {
        this.strings.plural = 0;
    } else if ("contextual" === arg) {
        this.strings.plural = false;
    }
};

Attributes["@has-publisher-and-publisher-place"] = function () {
    this.strings["has-publisher-and-publisher-place"] = true;
};

Attributes["@publisher-delimiter-precedes-last"] = function (state: CslState, arg: string) {
    this.strings["publisher-delimiter-precedes-last"] = arg;
};

Attributes["@publisher-delimiter"] = function (state: CslState, arg: string) {
    this.strings["publisher-delimiter"] = arg;
};

Attributes["@publisher-and"] = function (state: CslState, arg: string) {
    this.strings["publisher-and"] = arg;
};

Attributes["@givenname-disambiguation-rule"] = function (state: CslState, arg: string) {
    if (GIVENNAME_DISAMBIGUATION_RULES.indexOf(arg) > -1) {
        state.citation.opt["givenname-disambiguation-rule"] = arg;
    }
};

Attributes["@collapse"] = function (state: CslState, arg: string) {
    if (arg) {
        state[this.name].opt.collapse = arg;
    }
};

Attributes["@cite-group-delimiter"] = function (state: CslState, arg: string) {
    if (arg) {
        state[state.tmp.area].opt.cite_group_delimiter = arg;
    }
};

Attributes["@names-delimiter"] = function (state: CslState, arg: string) {
    state.setOpt(this, "names-delimiter", arg);
};

Attributes["@name-form"] = function (state: CslState, arg: string) {
    state.setOpt(this, "name-form", arg);
};

Attributes["@subgroup-delimiter"] = function (state: CslState, arg: string) {
    this.strings["subgroup-delimiter"] = arg;
};

Attributes["@subgroup-delimiter-precedes-last"] = function (state: CslState, arg: string) {
    this.strings["subgroup-delimiter-precedes-last"] = arg;
};

Attributes["@name-delimiter"] = function (state: CslState, arg: string) {
    state.setOpt(this, "name-delimiter", arg);
};

Attributes["@et-al-min"] = function (state: CslState, arg: string) {
    const val = parseInt(arg, 10);
    if (state[state.build.area].opt.max_number_of_names < val) {
        state[state.build.area].opt.max_number_of_names = val;
    }
    state.setOpt(this, "et-al-min", val);
};

Attributes["@et-al-use-first"] = function (state: CslState, arg: string) {
    state.setOpt(this, "et-al-use-first", parseInt(arg, 10));
};

Attributes["@et-al-use-last"] = function (state: CslState, arg: string) {
    if (arg === "true") {
        state.setOpt(this, "et-al-use-last", true);
    } else {
        state.setOpt(this, "et-al-use-last", false);
    }
};

Attributes["@et-al-subsequent-min"] = function (state: CslState, arg: string) {
    const val = parseInt(arg, 10);
    if (state[state.build.area].opt.max_number_of_names < val) {
        state[state.build.area].opt.max_number_of_names = val;
    }
    state.setOpt(this, "et-al-subsequent-min", val);
};

Attributes["@et-al-subsequent-use-first"] = function (state: CslState, arg: string) {
    state.setOpt(this, "et-al-subsequent-use-first", parseInt(arg, 10));
};

Attributes["@suppress-min"] = function (state: CslState, arg: string) {
    this.strings["suppress-min"] = parseInt(arg, 10);
};

Attributes["@suppress-max"] = function (state: CslState, arg: string) {
    this.strings["suppress-max"] = parseInt(arg, 10);
};

Attributes["@and"] = function (state: CslState, arg: string) {
    state.setOpt(this, "and", arg);
};

Attributes["@delimiter-precedes-last"] = function (state: CslState, arg: string) {
    state.setOpt(this, "delimiter-precedes-last", arg);
};

Attributes["@delimiter-precedes-et-al"] = function (state: CslState, arg: string) {
    state.setOpt(this, "delimiter-precedes-et-al", arg);
};

Attributes["@initialize-with"] = function (state: CslState, arg: string) {
    state.setOpt(this, "initialize-with", arg);
};

Attributes["@initialize"] = function (state: CslState, arg: string) {
    if (arg === "false") {
        state.setOpt(this, "initialize", false);
    }
};

Attributes["@name-as-reverse-order"] = function (state: CslState, arg: string) {
    this["name-as-reverse-order"] = arg;
};

Attributes["@name-as-sort-order"] = function (state: CslState, arg: string) {
    if (this.name === "style-options") {
        this["name-as-sort-order"] = arg;
    } else {
        state.setOpt(this, "name-as-sort-order", arg);
    }
};

Attributes["@sort-separator"] = function (state: CslState, arg: string) {
    state.setOpt(this, "sort-separator", arg);
};

Attributes["@require-match"] = function (state: CslState, arg: string) {
    if (arg === "true") {
        this.requireMatch = true;
    }
};

Attributes["@exclude-types"] = function (state: CslState, arg: string) {
    state.bibliography.opt.exclude_types = arg.split(/\s+/);
};

Attributes["@exclude-with-fields"] = function (state: CslState, arg: string) {
    state.bibliography.opt.exclude_with_fields = arg.split(/\s+/);
};

Attributes["@year-suffix-delimiter"] = function (state: CslState, arg: string) {
    state[this.name].opt["year-suffix-delimiter"] = arg;
};

Attributes["@after-collapse-delimiter"] = function (state: CslState, arg: string) {
    state[this.name].opt["after-collapse-delimiter"] = arg;
};

Attributes["@subsequent-author-substitute"] = function (state: CslState, arg: string) {
    state[this.name].opt["subsequent-author-substitute"] = arg;
};

Attributes["@subsequent-author-substitute-rule"] = function (state: CslState, arg: string) {
    state[this.name].opt["subsequent-author-substitute-rule"] = arg;
};

Attributes["@disambiguate-add-names"] = function (state: CslState, arg: string) {
    if (arg === "true") {
        state.opt["disambiguate-add-names"] = true;
    }
};

Attributes["@disambiguate-add-givenname"] = function (state: CslState, arg: string) {
    if (arg === "true") {
        state.opt["disambiguate-add-givenname"] = true;
    }
};

Attributes["@disambiguate-add-year-suffix"] = function (state: CslState, arg: string) {
    if (arg === "true" && state.opt.xclass !== "numeric") {
        state.opt["disambiguate-add-year-suffix"] = true;
    }
};

Attributes["@second-field-align"] = function (state: CslState, arg: string) {
    if (arg === "flush" || arg === "margin") {
        state[this.name].opt["second-field-align"] = arg;
    }
};

Attributes["@hanging-indent"] = function (state: CslState, arg: string) {
    if (arg === "true") {
        if (state.opt.development_extensions.hanging_indent_legacy_number) {
            state[this.name].opt.hangingindent = 2;
	    } else {
            state[this.name].opt.hangingindent = true;
	    }
    }
};

Attributes["@line-spacing"] = function (state: CslState, arg: string) {
    if (arg && arg.match(/^[.0-9]+$/)) {
        state[this.name].opt["line-spacing"] = parseFloat(arg);
    }
};

Attributes["@default-locale"] = function (state: CslState, arg: string) {
    if (this.name === "style") {
        let lst: string[], len: number, ret: string[];
        const m = arg.match(/-x-(sort|translit|translat)-/g);
        if (m) {
            for (let pos2 = 0, len2 = m.length; pos2 < len2; pos2 += 1) {
                m[pos2] = m[pos2].replace(/^-x-/, "").replace(/-$/, "");
            }
        }
        lst = arg.split(/-x-(?:sort|translit|translat)-/);
        ret = [lst[0]];
        for (let pos2 = 1, len2 = lst.length; pos2 < len2; pos2 += 1) {
            ret.push(m[pos2 - 1]);
            ret.push(lst[pos2]);
        }
        lst = ret.slice();
        len = lst.length;
        for (let pos2 = 1; pos2 < len; pos2 += 2) {
            state.opt["locale-" + lst[pos2]].push(lst[pos2 + 1].replace(/^\s*/g, "").replace(/\s*$/g, ""));
        }
        if (lst.length) {
            state.opt["default-locale"] = lst.slice(0, 1);
        } else {
            state.opt["default-locale"] = ["en"];
        }
    } else if (arg === "true") {
        this.default_locale = true;
    }
};

Attributes["@default-locale-sort"] = function (state: CslState, arg: string) {
    state.opt["default-locale-sort"] = arg;
};

Attributes["@demote-non-dropping-particle"] = function (state: CslState, arg: string) {
    state.opt["demote-non-dropping-particle"] = arg;
};

Attributes["@initialize-with-hyphen"] = function (state: CslState, arg: string) {
    if (arg === "false") {
        state.opt["initialize-with-hyphen"] = false;
    }
};

Attributes["@katakana-display"] = function (state: CslState, arg: string) {
    state.opt["katakana-display"] = arg;
};

Attributes["@page-range-format"] = function (state: CslState, arg: string) {
    state.opt["page-range-format"] = arg;
};

Attributes["@institution-parts"] = function (state: CslState, arg: string) {
    this.strings["institution-parts"] = arg;
};

Attributes["@if-short"] = function (state: CslState, arg: string) {
    if (arg === "true") {
        this.strings["if-short"] = true;
    }
};

Attributes["@substitute-use-first"] = function (state: CslState, arg: string) {
    this.strings["substitute-use-first"] = parseInt(arg, 10);
};

Attributes["@use-first"] = function (state: CslState, arg: string) {
    this.strings["use-first"] = parseInt(arg, 10);
};

Attributes["@use-last"] = function (state: CslState, arg: string) {
    this.strings["use-last"] = parseInt(arg, 10);
};

Attributes["@stop-first"] = function (state: CslState, arg: string) {
    this.strings["stop-first"] = parseInt(arg, 10);
};

Attributes["@stop-last"] = function (state: CslState, arg: string) {
    this.strings["stop-last"] = parseInt(arg, 10);
};

Attributes["@text-case"] = function (state: CslState, arg: string) {
    this.strings["text-case"] = arg;
};

Attributes["@entry-spacing"] = function (state: CslState, arg: string) {
    if (arg && arg.match(/^[.0-9]+$/)) {
        state[this.name].opt["entry-spacing"] = parseFloat(arg);
    }
};

Attributes["@display"] = function (state: CslState, arg: string) {
    if (state.bibliography.tokens.length === 2) {
        state.opt.using_display = true;
    }
    this.strings.cls = arg;
};

Attributes["@reverse-order"] = function (state: CslState, arg: string) {
    if (arg === "true") {
        this.strings["reverse-order"] = true;
    }
};

Attributes["@near-note-distance"] = function (state: CslState, arg: string) {
    state[this.name].opt["near-note-distance"] = parseInt(arg, 10);
};

Attributes["@substring"] = function (state: CslState, arg: string) {
    if (arg && arg.match(/^[0-9]+$/)) {
        this.strings["substring"] = parseInt(arg, 10);
    }
};

Attributes["@year-range-format"] = function (state: CslState, arg: string) {
    state.opt["year-range-format"] = arg;
};
