import { START } from '../constants/core';
export const Node_else = {
    build: function (this: CslNode, state: CslState, target: any[]): void {
        target.push(this);
    },
    configure: function (this: CslNode, state: CslState, pos: number): void {
        if (this.tokentype === START) {
            state.configure.fail[(state.configure.fail.length - 1)] = pos;
        }
    }
};
