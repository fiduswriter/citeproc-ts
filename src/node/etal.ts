import { CSL } from '../csl';
/*global CSL: true */

CSL.Node["et-al"] = {
    build: function (this: CslNode, state: CslState, target: any[]): void {
        if (state.build.area === "citation" || state.build.area === "bibliography") {
            let func = function (this: CslNode, state: CslState): void {
                state.tmp.etal_node = this;
                if ("string" === typeof this.strings.term) {
                    state.tmp.etal_term = this.strings.term;
                }
            };
            this.execs.push(func);
        }
        target.push(this);
    }
};
