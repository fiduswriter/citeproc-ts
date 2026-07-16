import { SINGLETON } from '../constants/core';
export const Node_condition = {
    build: function (this: CslNode, state: CslState): void {
        if (this.tokentype === SINGLETON) {
            const test = state.fun.match[this.match](this, state, this.tests);
            state.tmp.conditions.addTest(test);
        }
    }
};
