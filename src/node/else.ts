import { CSL } from '../csl';

export const Node_else = {
    build: function (this: CslNode, state: CslState, target: any[]): void {
        target.push(this);
    },
    configure: function (this: CslNode, state: CslState, pos: number): void {
        if (this.tokentype === CSL.START) {
            state.configure.fail[(state.configure.fail.length - 1)] = pos;
        }
    }
};
