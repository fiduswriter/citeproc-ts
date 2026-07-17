import { INIT_JURISDICTION_MACROS, GET_COURT_CLASS } from '../util/csl-shared';
import { padding } from '../util/number';
import { dateAsSortKey } from '../util/date';
import { expandMacro } from '../util/nodes';
import { Token } from '../obj/token';

import { Node_institution } from './institution';
import { Node_name } from './name';
import { Node_names } from './names';

import { ASCENDING, DATE_VARIABLES, DESCENDING, END, NAME_VARIABLES, NUMERIC_VARIABLES, SINGLETON, START } from '../constants/core';
export const Node_key = {
    build: function (this: CslNode, state: CslState, target: any[]): void {
        
        target = state[state.build.root + "_sort"].tokens;

        let func;
        const debug = false;
        const start_key = new Token("key", START);

        state.tmp.root = state.build.root;

        // The params object for build and runtime (tmp) really shouldn't have been separated.
        // Oh, well.
        start_key.strings["et-al-min"] = state.inheritOpt(this, "et-al-min");
        start_key.strings["et-al-use-first"] = state.inheritOpt(this, "et-al-use-first");
        start_key.strings["et-al-use-last"] = state.inheritOpt(this, "et-al-use-last");


        // initialize done vars
        func = function (state: CslState): void {
            state.tmp.done_vars = [];
        };
        start_key.execs.push(func);

        // initialize output queue
        func = function (state: CslState): void {
            state.output.openLevel("empty");
        };
        start_key.execs.push(func);

        // sort direction
        const sort_direction = [];
        if (this.strings.sort_direction === DESCENDING) {
            //print("sort: descending on "+state.tmp.area);
            sort_direction.push(1);
            sort_direction.push(-1);
        } else {
            //print("sort: ascending");
            sort_direction.push(-1);
            sort_direction.push(1);
        }
        state[state.build.area].opt.sort_directions.push(sort_direction);

        if (DATE_VARIABLES.indexOf(this.variables[0]) > -1) {
            state.build.date_key = true;
        }

        // et al init
        func = function (this: CslNode, state: CslState): void {
            state.tmp.sort_key_flag = true;
            //print("== key node function ==");
            if (state.inheritOpt(this, "et-al-min")) {
                state.tmp["et-al-min"] = state.inheritOpt(this, "et-al-min");
            }
            if (state.inheritOpt(this, "et-al-use-first")) {
                state.tmp["et-al-use-first"] = state.inheritOpt(this, "et-al-use-first");
            }
            if ("boolean" === typeof state.inheritOpt(this, "et-al-use-last")) {
                state.tmp["et-al-use-last"] = state.inheritOpt(this, "et-al-use-last");
                //print("  set tmp et-al-use-last: "+this.strings["et-al-use-last"])
            }
        };
        start_key.execs.push(func);
        target.push(start_key);
        
        //
        // ops to initialize the key's output structures
        if (this.variables.length) {
            const variable = this.variables[0];
            if (NAME_VARIABLES.indexOf(variable) > -1) {
                //
                // Start tag
                const names_start_token = new Token("names", START);
                names_start_token.tokentype = START;
                names_start_token.variables = this.variables;
                Node_names.build.call(names_start_token, state, target);
                //
                // Name tag
                const name_token = new Token("name", SINGLETON);
                name_token.tokentype = SINGLETON;
                name_token.strings["name-as-sort-order"] = "all";
                name_token.strings["sort-separator"] = " ";
                name_token.strings["et-al-use-last"] = state.inheritOpt(this, "et-al-use-last");
                name_token.strings["et-al-min"] = state.inheritOpt(this, "et-al-min");
                name_token.strings["et-al-use-first"] = state.inheritOpt(this, "et-al-use-first");
                Node_name.build.call(name_token, state, target);
                //
                // Institution tag
                const institution_token = new Token("institution", SINGLETON);
                institution_token.tokentype = SINGLETON;
                Node_institution.build.call(institution_token, state, target);
                //
                // End tag
                const names_end_token = new Token("names", END);
                names_end_token.tokentype = END;
                Node_names.build.call(names_end_token, state, target);
            } else {
                const single_text = new Token("text", SINGLETON);
                single_text.strings.sort_direction = this.strings.sort_direction;
                single_text.dateparts = this.dateparts;
                if (NUMERIC_VARIABLES.indexOf(variable) > -1) {
                    // citation-number is virtualized. As a sort key it has no effect on registry
                    // sort order per se, but if set to DESCENDING, it reverses the sequence of numbers representing
                    // bib entries.
                    if (variable === "citation-number") {
                        func = function (this: CslNode, state: CslState, Item: CslItem): void {
                            if (state.tmp.area === "bibliography_sort") {
                                if (this.strings.sort_direction === DESCENDING) {
                                    state.bibliography_sort.opt.citation_number_sort_direction = DESCENDING;
                                } else {
                                    state.bibliography_sort.opt.citation_number_sort_direction = ASCENDING;
                                }
                            }
                            let num;
                            if (state.tmp.area === "citation_sort" && state.bibliography_sort.tmp.citation_number_map) {
                                num = state.bibliography_sort.tmp.citation_number_map[state.registry.registry[Item.id].seq];
                            } else {
                                num = state.registry.registry[Item.id].seq;
                            }
                            if (num) {
                                // Code currently in util_number.js
                                num = padding("" + num);
                            }
                            state.output.append(num, this);
                        };
                    } else {
                        func = function (this: CslNode, state: CslState, Item: CslItem): void {
                            let num: string | false = false;
                            num = Item[variable];
                            // XXX What if this is NaN?
                            if (num) {
                                // Code currently in util_number.js
                                num = padding("" + num);
                            }
                            state.output.append(num, this);
                        };
                    }
                } else if (variable === "citation-label") {
                    func = function (this: CslNode, state: CslState, Item: CslItem): void {
                        const trigraph = state.getCitationLabel(Item);
                        state.output.append(trigraph, this);
                    };
                } else if (DATE_VARIABLES.indexOf(variable) > -1) {
                    func = dateAsSortKey;
                    single_text.variables = this.variables;
                } else if ("title" === variable) {
                    const abbrevfam = "title";
                    const abbrfall = false;
                    const altvar = false;
                    const transfall = true;
                    func = state.transform.getOutputFunction(this.variables, abbrevfam, abbrfall, altvar, transfall);
                } else if ("court-class" === variable) {
                    func = function(state: CslState, Item: CslItem, item: any): void {
                        INIT_JURISDICTION_MACROS(state, Item, item, "juris-main")
                        // true is for sortKey mode
                        const cls = GET_COURT_CLASS(state, Item, true);
                        state.output.append(cls, "empty");
                    }
                } else {
                    func = function (state: CslState, Item: CslItem): void {
                        const varval = Item[variable];
                        state.output.append(varval, "empty");
                    };
                }
                single_text.execs.push(func);
                target.push(single_text);
            }
        } else { // macro
            //
            // if it's not a variable, it's a macro
            const token = new Token("text", SINGLETON);
            token.strings.sort_direction = this.strings.sort_direction;
            token.postponed_macro = this.postponed_macro;
            expandMacro.call(state, token, target);
        }
        //
        // ops to output the key string result to an array go
        // on the closing "key" tag before it is pushed.
        // Do not close the level.
        const end_key = new Token("key", END);

        // Eliminated at revision 1.0.159.
        // Was causing non-fatal error "wanted empty but found group".
        // Possible contributor to weird "PAGES" bug?
        //func = function (state, Item) {
        //state.output.closeLevel("empty");
        //};
        //end_key.execs.push(func);
        
        // store key for use
        func = function (state: CslState): void {
            let keystring = state.output.string(state, state.output.queue);
            if (state.sys.normalizeUnicode) {
                keystring = state.sys.normalizeUnicode(keystring);
            }
            if (keystring) {
                if (Array.isArray(keystring)) {
                    keystring = keystring.map(function(v) {
                        if (v && typeof v === 'object' && typeof v.blobs === 'string') return v.blobs;
                        return '' + v;
                    }).join('');
                }
                keystring = keystring.split(" ").join(state.opt.sort_sep) + state.opt.sort_sep;
            } else {
                keystring = "";
            }
            if ("" === keystring) {
                keystring = undefined;
            }
            if ("string" !== typeof keystring) {
                keystring = undefined;
            }
            state[state[state.tmp.area].root + "_sort"].keys.push(keystring);
            state.tmp.value = [];
        };
        end_key.execs.push(func);

        // Set year-suffix key on anything that looks like a date
        if (state.build.date_key) {
            if (state.build.area === "citation" && state.build.extension === "_sort") {
                // ascending sort always
                state[state.build.area].opt.sort_directions.push([-1,1]);
                func = function (state: CslState, Item: CslItem): void {
                    // year-suffix Key
                    let year_suffix = state.registry.registry[Item.id].disambig.year_suffix;
                    if (!year_suffix) {
                        year_suffix = 0;
                    }
                    let key = padding("" + year_suffix);
                    state[state.tmp.area].keys.push(key);
                };
                end_key.execs.push(func);
            }
            state.build.date_key = false;
        }

        // reset key params
        func = function (state: CslState): void {
            // state.tmp.name_quash = new Object();

            // XXX This should work, should be necessary, but doesn't and isn't.
            //state.output.closeLevel("empty");

            state.tmp["et-al-min"] = undefined;
            state.tmp["et-al-use-first"] = undefined;
            state.tmp["et-al-use-last"] = undefined;
            state.tmp.sort_key_flag = false;
        };
        end_key.execs.push(func);
        target.push(end_key);
    }
};
