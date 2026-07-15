import { CSL } from '../csl';

export const Node_conditions = {
    build: function (this: CslNode, state: CslState): void {
        if (this.tokentype === CSL.START) {
            state.tmp.conditions.addMatch(this.match);
        }
        if (this.tokentype === CSL.END) {
            state.tmp.conditions.matchCombine();
        }
    }
};
