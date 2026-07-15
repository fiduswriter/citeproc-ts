import { CSL } from '../csl';

export const Node_number = {
    build: function (this: CslNode, state: CslState, target: any[]): void {
        let func: (this: CslNode, state: CslState, Item: CslItem, item: any) => void;
        CSL.Util.substituteStart.call(this, state, target);
        //
        // This should push a rangeable object to the queue.
        //
        if (this.strings.form === "roman") {
            this.formatter = state.fun.romanizer;
        } else if (this.strings.form === "ordinal") {
            this.formatter = state.fun.ordinalizer;
        } else if (this.strings.form === "long-ordinal") {
            this.formatter = state.fun.long_ordinalizer;
        }
        if ("undefined" === typeof this.successor_prefix) {
            this.successor_prefix = state[state.build.area].opt.layout_delimiter;
        }
        if ("undefined" === typeof this.splice_prefix) {
            this.splice_prefix = state[state.build.area].opt.layout_delimiter;
        }
        //
        // Whether we actually stick a number object on
        // the output queue depends on whether the field
        // contains a pure number.
        //
        // push number or text
        func = function (this: CslNode, state: CslState, Item: CslItem, item: any): void {
            if (this.variables.length === 0) {
                return;
            }
            let varname;
            varname = this.variables[0];
            if ("undefined" === typeof item) {
                item = {};
            }
            if (["locator", "locator-extra"].indexOf(varname) > -1) {
                if (state.tmp.just_looking) {
                    return;
                }
                if (!item[varname]) {
                    return;
                }
            } else {
                if (!Item[varname]) {
                    return;
                }
            }

            if (varname === "collection-number" && Item.type === "legal_case") {
                state.tmp.renders_collection_number = true;
            }

            const node = this;

            if (state.tmp.group_context.tip.force_suppress) {
                return;
            }

            if (["locator", "locator-extra"].indexOf(varname) > -1) {
                state.processNumber.call(state, node, item, varname, Item.type);
            } else {
                if (!state.tmp.group_context.tip.condition && Item[varname]) {
                    state.tmp.just_did_number = ("" + Item[varname]).match(/[0-9]$/);
                }
                state.processNumber.call(state, node, Item, varname, Item.type);
            }

            if (this.substring) {
                const val = Item[varname].slice(this.substring);
                state.output.append(val, node);
            } else {
                CSL.Util.outputNumericField(state, varname, Item.id);
            }

            if (["locator", "locator-extra"].indexOf(this.variables_real[0]) > -1
                && !state.tmp.just_looking) {
                state.tmp.done_vars.push(this.variables_real[0]);
                state.tmp.group_context.tip.done_vars.push(this.variables_real[0]);
            }
        };
        this.execs.push(func);
        target.push(this);

        CSL.Util.substituteEnd.call(this, state, target);
    }
};
