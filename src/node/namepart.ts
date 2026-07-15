import { CSL } from '../csl';
/*global CSL: true */

CSL.Node["name-part"] = {
    build: function (this: CslNode, state: CslState): void {
        state.build[this.strings.name] = this;
    }
};
