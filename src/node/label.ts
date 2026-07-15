import { CSL } from '../csl';
/*global CSL: true */

CSL.Node.label = {
    build: function (this: CslNode, state: CslState, target: any[]): void {

        if (this.strings.term) {
            // Non-names labels
            let func = function (this: CslNode, state: CslState, Item: CslItem, item: any): void {
                var termtxt = CSL.evaluateLabel(this, state, Item, item);
                if (item && this.strings.term === "locator") {

                    item.section_form_override = this.strings.form;

                }
                if (termtxt) {
                    state.tmp.group_context.tip.term_intended = true;
                }
                CSL.UPDATE_GROUP_CONTEXT_CONDITION(state, termtxt, null, this);
                if (termtxt.indexOf("%s") === -1) {
                    // ^ Suppress output here if we have an embedded term
                    if (this.strings.capitalize_if_first) {
                        if (!state.tmp.term_predecessor && !(state.opt["class"] === "in-text" && state.tmp.area === "citation")) {
                            termtxt = CSL.Output.Formatters["capitalize-first"](state, termtxt);
                        }
                    }
                    state.output.append(termtxt, this);
                }
            };
            this.execs.push(func);
        } else {
            if (!this.strings.form) {
                this.strings.form = "long";
            }
            // Names labels
            // Picked up in names END
            var namevars = state.build.names_variables[state.build.names_variables.length - 1];
            var namelabels = state.build.name_label[state.build.name_label.length - 1];
            for (let i = 0, ilen = namevars.length; i < ilen; i += 1) {
                if (!namelabels[namevars[i]]) {
                    namelabels[namevars[i]] = {};
                }
            }
            if (!state.build.name_flag) {
                for (let i = 0, ilen = namevars.length; i < ilen; i += 1) {
                    namelabels[namevars[i]].before = this;
                }
            } else {
                for (let i = 0, ilen = namevars.length; i < ilen; i += 1) {
                    namelabels[namevars[i]].after = this;
                }
            }
        }
        target.push(this);
    }
};
