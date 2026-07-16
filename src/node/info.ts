import { START } from '../constants/core';
export const Node_info = {
    build: function (this: CslNode, state: CslState): void {
        if (this.tokentype === START) {
            state.build.skip = "info";
        } else {
            state.build.skip = false;
        }
    }
};
