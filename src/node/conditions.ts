import { CSL } from '../csl';
CSL.Node["conditions"] = {
    build: function (this: CslNode, state: CslState): void {
        if (this.tokentype === CSL.START) {
            state.tmp.conditions.addMatch(this.match);
        }
        if (this.tokentype === CSL.END) {
            state.tmp.conditions.matchCombine();
        }
    }
};
