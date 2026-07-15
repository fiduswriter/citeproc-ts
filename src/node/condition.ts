import { CSL } from '../csl';

export const Node_condition = {
    build: function (this: CslNode, state: CslState): void {
        if (this.tokentype === CSL.SINGLETON) {
            const test = state.fun.match[this.match](this, state, this.tests);
            state.tmp.conditions.addTest(test);
        }
    }
};
