import { CSL } from '../csl';
import { Blob } from '../obj/blob';

import { END, LITERAL, SINGLETON, START } from '../constants/core';
import { STARTSWITH_ROMANESQUE_REGEXP } from '../constants/regex';
export const Node_names = {
    build: function (this: CslNode, state: CslState, target: any[]): void {
        let func;
        // debug = print;

        if (this.tokentype === START || this.tokentype === SINGLETON) {
            CSL.Util.substituteStart.call(this, state, target);
            state.build.substitute_level.push(1);
        }
        
        if (this.tokentype === SINGLETON) {
            state.build.names_variables[state.build.names_variables.length-1].concat(this.variables);
            for (let i in this.variables) {
                const variable = this.variables[i];
                const name_labels = state.build.name_label[state.build.name_label.length-1];
                if (Object.keys(name_labels).length) {
                    name_labels[variable] = name_labels[Object.keys(name_labels)[0]];
                }
            }
            func = function (this: CslNode, state: CslState): void {
                state.nameOutput.reinit(this, this.variables_real[0]);
            };
            this.execs.push(func);
        }

        if (this.tokentype === START) {

            state.build.names_flag = true;
            state.build.name_flag = false;
            state.build.names_level += 1;
            state.build.names_variables.push(this.variables);
            state.build.name_label.push({});
            // init can substitute
            // init names
            func = function (this: CslNode, state: CslState): void {
                state.tmp.can_substitute.push(true);
                state.tmp.name_node = {};
                state.tmp.name_node.children = [];
                state.nameOutput.init(this);
            };
            this.execs.push(func);

        }
        
        if (this.tokentype === END) {

            // Set/reset name blobs if they exist, for processing
            // by namesOutput()
            for (let i = 0, ilen = 3; i < ilen; i += 1) {
                let key = ["family", "given", "et-al"][i];
                this[key] = state.build[key];
                if (state.build.names_level === 1) {
                    state.build[key] = undefined;
                }
            }
            // Labels, if any
            this.label = state.build.name_label[state.build.name_label.length-1];
            state.build.names_level += -1;
            state.build.names_variables.pop();
            state.build.name_label.pop();

            // The with term. This isn't the right place
            // for this, but it's all hard-wired at the
            // moment.

            // "and" and "ellipsis" are set in node_name.js
            func = function (this: CslNode, state: CslState): void {
                // Et-al (strings only)
                // Blob production has to happen inside nameOutput()
                // since proper escaping requires access to the output
                // queue.
                if (state.tmp.etal_node) {
                    this.etal_style = state.tmp.etal_node;
                } else {
                    this.etal_style = "empty";
                }

                this.etal_term = state.getTerm(state.tmp.etal_term, "long", 0);
                this.etal_prefix_single = " ";
                // Should be name delimiter, not hard-wired.
                this.etal_prefix_multiple = state.tmp.name_delimiter;
                if (state.tmp["delimiter-precedes-et-al"] === "always") {
                    this.etal_prefix_single = state.tmp.name_delimiter;
                } else if (state.tmp["delimiter-precedes-et-al"] === "never") {
                    this.etal_prefix_multiple = " ";
                } else if (state.tmp["delimiter-precedes-et-al"] === "after-inverted-name") {
                    this.etal_prefix_single = state.tmp.name_delimiter;
                    this.etal_prefix_multiple = " ";
                }
                this.etal_suffix = "";
                if (!STARTSWITH_ROMANESQUE_REGEXP.test(this.etal_term)) {
                    // Not sure what the correct treatment is here, but we should not suppress
                    // a comma-space.
                    // https://forums.zotero.org/discussion/76679/delimiter-precedes-et-al-always-dose-not-work-in-locale-zh-cn
                    if (this.etal_prefix_single === " ") {
                        this.etal_prefix_single = "";
                    }
                    if (this.etal_prefix_multiple === " ") {
                        this.etal_prefix_multiple = "";
                    }
                    if (this.etal_suffix === " ") {
                        this.etal_suffix = "";
                    }
                }
                // et-al affixes are further adjusted in nameOutput(),
                // after the term (possibly changed in cs:et-al) is known.


                for (let i = 0, ilen = 3; i < ilen; i += 1) {
                    let key = ["family", "given"][i];
                    state.nameOutput[key] = this[key];
                }
                state.nameOutput["with"] = this["with"];

                // REMOVE THIS
                const mywith = "with";
                let with_default_prefix = "";
                let with_suffix = "";
                if (STARTSWITH_ROMANESQUE_REGEXP.test(mywith)) {
                    with_default_prefix = " ";
                    with_suffix = " ";
                }
                const thewith: { single: Blob; multiple: Blob } = {
                    single: new Blob(mywith),
                    multiple: new Blob(mywith)
                };
                thewith.single.strings.suffix = with_suffix;
                thewith.multiple = new Blob(mywith);
                thewith.multiple.strings.suffix = with_suffix;
                if (state.inheritOpt(state.nameOutput.name, "delimiter-precedes-last") === "always") {
                    thewith.single.strings.prefix = state.inheritOpt(this, "delimiter", "names-delimiter");
                    thewith.multiple.strings.prefix = state.inheritOpt(this, "delimiter", "names-delimiter");
                } else if (state.inheritOpt(state.nameOutput.name, "delimiter-precedes-last") === "contextual") {
                    thewith.single.strings.prefix = with_default_prefix;
                    thewith.multiple.strings.prefix = state.inheritOpt(this, "delimiter", "names-delimiter");
                } else if (state.inheritOpt(state.nameOutput.name, "delimiter-precedes-last") === "after-inverted-name") {
                    thewith.single.strings.prefix = state.inheritOpt(this, "delimiter", "names-delimiter");
                    thewith.multiple.strings.prefix = with_default_prefix;
                } else {
                    thewith.single.strings.prefix = with_default_prefix;
                    thewith.multiple.strings.prefix = with_default_prefix;
                }
                state.nameOutput["with"] = thewith;


                // XXX label style should be set per variable, since they may differ
                // XXX with full-form nested names constructs
                state.nameOutput.label = this.label;

                state.nameOutput.etal_style = this.etal_style;
                state.nameOutput.etal_term = this.etal_term;
                state.nameOutput.etal_prefix_single = this.etal_prefix_single;
                state.nameOutput.etal_prefix_multiple = this.etal_prefix_multiple;
                state.nameOutput.etal_suffix = this.etal_suffix;
                state.nameOutput.outputNames();
                state.tmp["et-al-use-first"] = undefined;
                state.tmp["et-al-min"] = undefined;
                state.tmp["et-al-use-last"] = undefined;
            };
            this.execs.push(func);

            // unsets
            func = function (state: CslState): void {
                if (!state.tmp.can_substitute.pop()) {
                    state.tmp.can_substitute.replace(false, LITERAL);
                }
                
                // For posterity ...
                //
                // This was enough to fix the issue reported here:
                //
                //   http://forums.zotero.org/discussion/25223/citeproc-bug-substitute-doesnt-work-correctly-for-title-macro/
                //
                // The remainder of the changes applied in the same patch
                // relate to a label assignments, which were found to be
                // buggy while working on the issue. The test covering
                // both problems is here:
                //
                //   https://bitbucket.org/bdarcus/citeproc-test/src/ab136a6aa8f2/processor-tests/humans/substitute_SuppressOrdinaryVariable.txt
                if (state.tmp.can_substitute.mystack.length === 1) {
                    state.tmp.can_block_substitute = false;
                }
            };
            this.execs.push(func);

            state.build.name_flag = false;
        }
        target.push(this);

        if (this.tokentype === END || this.tokentype === SINGLETON) {
            state.build.substitute_level.pop();
            CSL.Util.substituteEnd.call(this, state, target);
        }
    }
};
