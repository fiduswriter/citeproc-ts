import { END, START } from '../constants/core';
export const Node_conditions = {
    build: function (this: CslNode, state: CslState): void {
        if (this.tokentype === START) {
            state.tmp.conditions.addMatch(this.match);
        }
        if (this.tokentype === END) {
            state.tmp.conditions.matchCombine();
        }
    }
};
