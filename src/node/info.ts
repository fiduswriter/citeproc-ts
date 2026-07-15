import { CSL } from '../csl';

export const Node_info = {
    build: function (this: CslNode, state: CslState): void {
        if (this.tokentype === CSL.START) {
            state.build.skip = "info";
        } else {
            state.build.skip = false;
        }
    }
};
