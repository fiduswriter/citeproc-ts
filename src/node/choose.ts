import { CSL } from '../csl';
/*global CSL: true */

CSL.Node.choose = {
    build: function (this: CslNode, state: CslState, target: any[]): void {
        let func: (state: CslState) => void;
        if (this.tokentype === CSL.START) {
            func = function (state: CslState): void {
                state.tmp.jump.push(undefined, CSL.LITERAL);
            };
        }
        if (this.tokentype === CSL.END) {
            func = function (state: CslState): void {
                state.tmp.jump.pop();
            };
        }
        this.execs.push(func);
        target.push(this);
    },

    configure: function (this: CslNode, state: CslState, pos: number): void {
        if (this.tokentype === CSL.END) {
            state.configure.fail.push((pos));
            state.configure.succeed.push((pos));
        } else {
            state.configure.fail.pop();
            state.configure.succeed.pop();
        }
    }
};
