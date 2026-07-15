import { CSL } from '../csl';
/*global CSL: true */

CSL.Node["institution-part"] = {
    build: function (this: CslNode, state: CslState, target: any[]): void {
        let func: ((this: CslNode, state: CslState) => void) | undefined;
        if ("long" === this.strings.name) {
            if (this.strings["if-short"]) {
                func = function (this: CslNode, state: CslState): void {
                    state.nameOutput.institutionpart["long-with-short"] = this;
                };
            } else {
                func = function (this: CslNode, state: CslState): void {
                    state.nameOutput.institutionpart["long"] = this;
                };
            }
        } else if ("short" === this.strings.name) {
            func = function (this: CslNode, state: CslState): void {
                state.nameOutput.institutionpart["short"] = this;
            };
        }
        this.execs.push(func);
        target.push(this);
    }
};
