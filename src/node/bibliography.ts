import { CSL } from '../csl';
/*global CSL: true */

CSL.Node = {};

CSL.Node.bibliography = {
    build: function (this: CslNode, state: CslState, target: any[]): void {
        if (this.tokentype === CSL.START) {

            state.build.area = "bibliography";
            state.build.root = "bibliography";
            state.build.extension = "";

            let func = function (state: CslState): void {
                state.tmp.area = "bibliography";
                state.tmp.root = "bibliography";
                state.tmp.extension = "";
            };
            this.execs.push(func);

        }
        target.push(this);
    }
};
