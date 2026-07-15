import { CSL } from '../csl';
/*global CSL: true */

CSL.Node.info = {
    build: function (this: CslNode, state: CslState): void {
        if (this.tokentype === CSL.START) {
            state.build.skip = "info";
        } else {
            state.build.skip = false;
        }
    }
};
