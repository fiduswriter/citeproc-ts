import { CSL } from '../csl';
CSL.Node["condition"] = {
    build: function (this: CslNode, state: CslState): void {
        if (this.tokentype === CSL.SINGLETON) {
            var test = state.fun.match[this.match](this, state, this.tests);
            state.tmp.conditions.addTest(test);
        }
    }
};
