import { CSL } from '../csl';

import { Token } from '../obj/token';

import { END, SINGLETON, START } from '../constants/core';
import { checkPrefixSpaceAppend, checkSuffixSpacePrepend, checkIgnorePredecessor } from '../util/affix';
import { debug } from '../logger';
export const Node_layout = {
    build: function (this: CslNode, state: CslState, target: any[]): void {
        let func, prefix_token, suffix_token, tok;

        function setSuffix() {
            if (state.build.area === "bibliography") {
                suffix_token = new Token("text", SINGLETON);
                func = function(state: CslState): void {
                    // Suppress suffix on all but the last item in bibliography parallels
                    if (!state.tmp.parallel_and_not_last) {
                        let suffix;
                        if (state.tmp.cite_affixes[state.tmp.area][state.tmp.last_cite_locale]) {
                            suffix = state.tmp.cite_affixes[state.tmp.area][state.tmp.last_cite_locale].suffix;
                        } else {
                            suffix = state.bibliography.opt.layout_suffix;
                        }

                        // If @display is used, layout suffix is placed on the last
                        // immediate child of the layout, which we assume will be a
                        // @display group node.
                        const topblob = state.output.current.value();
                        if (state.opt.using_display) {
                            topblob.blobs[topblob.blobs.length-1].strings.suffix = suffix;
                        } else {
                            topblob.strings.suffix = suffix;
                        }
                    }
                    if (state.bibliography.opt["second-field-align"]) {
                        // closes bib_other
                        state.output.endTag("bib_other");
                    }
                };
                suffix_token.execs.push(func);
                target.push(suffix_token);
            }
        }

        if (this.tokentype === START) {

            if (this.locale_raw) {
                state.build.current_default_locale = this.locale_raw;
            } else {
                state.build.current_default_locale = state.opt["default-locale"];
            }

            func = function (state: CslState, Item: CslItem, item: any): void {
                if (state.opt.development_extensions.apply_citation_wrapper
                    && state.sys.wrapCitationEntry
                    && !state.tmp.just_looking
                    && Item.system_id 
                    && state.tmp.area === "citation") { 

                    const cite_entry = new Token("group", START);
                    cite_entry.decorations = [["@cite", "entry"]];
                    state.output.startTag("cite_entry", cite_entry);
                    state.output.current.value().item_id = Item.system_id;
                    if (item) {
                        state.output.current.value().locator_txt = item.locator_txt;
                        state.output.current.value().suffix_txt = item.suffix_txt;
                    }
                }
            };
            this.execs.push(func);
        }

        // XXX Works, but using state.tmp looks wrong here? We're in the build layer ...
        if (this.tokentype === START && !state.tmp.cite_affixes[state.build.area]) {
            //
            // done_vars is used to prevent the repeated
            // rendering of variables
            //
            // initalize done vars
            func = function (state: CslState, Item: CslItem, item: any): void {

                state.tmp.done_vars = [];
                if (item && item["author-only"]) {
                    state.tmp.done_vars.push("locator");
                }
                if (state.opt.suppressedJurisdictions[Item["country"]]
                    && Item["country"]
                    && ["treaty", "patent"].indexOf(Item.type) === -1) {
                    
                    state.tmp.done_vars.push("country");
                }
                if (!state.tmp.just_looking && state.registry.registry[Item.id] && state.registry.registry[Item.id].parallel) {
                    state.tmp.done_vars.push("first-reference-note-number");
                }
                // trimmer is not available in getAmbiguousCite
                if (!state.tmp.just_looking && state.tmp.abbrev_trimmer && Item.jurisdiction) {
                    for (let field in state.tmp.abbrev_trimmer.QUASHES[Item.jurisdiction]) {
                        state.tmp.done_vars.push(field);
                    }
                }

                //debug(" === init rendered_name === ");
                state.tmp.rendered_name = false;
            };
            this.execs.push(func);
            // set opt delimiter
            func = function (state: CslState): void {
                // just in case
                state.tmp.sort_key_flag = false;
            };
            this.execs.push(func);
            
            // reset nameset counter [all nodes]
            func = function (state: CslState): void {
                state.tmp.nameset_counter = 0;
            };
            this.execs.push(func);

            func = function (state: CslState, Item: CslItem): void {
                let tok = new Token();
                state.output.openLevel(tok);
            };
            this.execs.push(func);
            target.push(this);

            if (state.build.area === "citation") {
                prefix_token = new Token("text", SINGLETON);
                func = function (state: CslState, Item: CslItem, item: any): void {
                    if (item && item.prefix) {
                        let prefix = checkPrefixSpaceAppend(state, item.prefix);
                        if (!state.tmp.just_looking) {
                            prefix = state.output.checkNestedBrace.update(prefix);
                        }
                        const ignorePredecessor = checkIgnorePredecessor(state, prefix);
                        state.output.append(prefix, this, false, ignorePredecessor);
                    }
                };
                prefix_token.execs.push(func);
                target.push(prefix_token);
            }
        }

        // Cast token to be used in one of the configurations below.
        let my_tok;
        if (this.locale_raw) {
            my_tok = new Token("dummy", START);
            my_tok.locale = this.locale_raw;
            my_tok.strings.delimiter = this.strings.delimiter;
            my_tok.strings.suffix = this.strings.suffix;
            if (!state.tmp.cite_affixes[state.build.area]) {
                state.tmp.cite_affixes[state.build.area] = {};
            }
        }

        if (this.tokentype === START) {
            state.build.layout_flag = true;
                            
            // Only run the following once, to set up the final layout node ...
            if (!this.locale_raw) {
                //
                // save out decorations for flipflop processing [final node only]
                //
                state[state.tmp.area].opt.topdecor = [this.decorations];
                state[(state.tmp.area + "_sort")].opt.topdecor = [this.decorations];

                state[state.build.area].opt.layout_prefix = this.strings.prefix;
                state[state.build.area].opt.layout_suffix = this.strings.suffix;
                state[state.build.area].opt.layout_delimiter = this.strings.delimiter;

                state[state.build.area].opt.layout_decorations = this.decorations;
                
                // Only do this if we're running conditionals
                if (state.tmp.cite_affixes[state.build.area]) {
                    // if build_layout_locale_flag is true,
                    // write cs:else START to the token list.
                    tok = new Token("else", START);
                    CSL.Node["else"].build.call(tok, state, target);
                }

            } // !this.locale_raw

            // Conditionals
            if (this.locale_raw) {
                if (!state.build.layout_locale_flag) {
                    // if layout_locale_flag is untrue,
                    // write cs:choose START and cs:if START
                    // to the token list.
                    const choose_tok = new Token("choose", START);
                    CSL.Node.choose.build.call(choose_tok, state, target);
                    my_tok.name = "if";
                    CSL.Attributes["@locale-internal"].call(my_tok, state, this.locale_raw);
                    CSL.Node["if"].build.call(my_tok, state, target);
                } else {
                    // if build_layout_locale_flag is true,
                    // write cs:else-if START to the token list.
                    my_tok.name = "else-if";
                    CSL.Attributes["@locale-internal"].call(my_tok, state, this.locale_raw);
                    CSL.Node["else-if"].build.call(my_tok, state, target);
                }
                // cite_affixes for this node
                state.tmp.cite_affixes[state.build.area][my_tok.locale] = {};
                state.tmp.cite_affixes[state.build.area][my_tok.locale].delimiter = this.strings.delimiter;
                state.tmp.cite_affixes[state.build.area][my_tok.locale].suffix = this.strings.suffix;
            }
        }
        if (this.tokentype === END) {
            if (this.locale_raw) {
                setSuffix();
                if (!state.build.layout_locale_flag) {
                    // If layout_locale_flag is untrue, write cs:if END
                    // to the token list.
                    my_tok.name = "if";
                    my_tok.tokentype = END;
                    CSL.Attributes["@locale-internal"].call(my_tok, state, this.locale_raw);
                    CSL.Node["if"].build.call(my_tok, state, target);
                    state.build.layout_locale_flag = true;
                } else {
                    // If layout_locale_flag is true, write cs:else-if END
                    // to the token list.
                    my_tok.name = "else-if";
                    my_tok.tokentype = END;
                    CSL.Attributes["@locale-internal"].call(my_tok, state, this.locale_raw);
                    CSL.Node["else-if"].build.call(my_tok, state, target);
                }
            }
            if (!this.locale_raw) {
                setSuffix();
                // Only add this if we're running conditionals
                if (state.tmp.cite_affixes[state.build.area]) {
                    // If layout_locale_flag is true, write cs:else END
                    // and cs:choose END to the token list.
                    if (state.build.layout_locale_flag) {
                        tok = new Token("else", END);
                        CSL.Node["else"].build.call(tok, state, target);
                        tok = new Token("choose", END);
                        CSL.Node.choose.build.call(tok, state, target);
                    }
                }
                state.build_layout_locale_flag = true;
                if (state.build.area === "citation") {
                    suffix_token = new Token("text", SINGLETON);
                    func = function (state: CslState, Item: CslItem, item: any): void {
                        if (item && item.suffix) {
                            let suffix = checkSuffixSpacePrepend(state, item.suffix);
                            if (!state.tmp.just_looking) {
                                suffix = state.output.checkNestedBrace.update(suffix);
                            }
                            state.output.append((suffix), this);
                        }
                    };
                    suffix_token.execs.push(func);
                    target.push(suffix_token);
                }

                // Closes wrapper token
                func = function (state: CslState): void {
                    state.output.closeLevel();
                };
                this.execs.push(func);
                func = function (state: CslState, Item: CslItem): void {
                    if (state.opt.development_extensions.apply_citation_wrapper
                        && state.sys.wrapCitationEntry
                        && !state.tmp.just_looking
                        && Item.system_id 
                        && state.tmp.area === "citation") { 
                        
                        state.output.endTag(); // closes citation link wrapper
                    }
                };
                this.execs.push(func);
                target.push(this);
                state.build.layout_flag = false;
                state.build.layout_locale_flag = false;
            } // !this.layout_raw
        }
    }
};
