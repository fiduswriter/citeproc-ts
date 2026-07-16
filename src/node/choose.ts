import { END, LITERAL, START } from '../constants/core';
export const Node_choose = {
    build: function (this: CslNode, state: CslState, target: any[]): void {
        let func: (state: CslState) => void;
        if (this.tokentype === START) {
            func = function (state: CslState): void {
                state.tmp.jump.push(undefined, LITERAL);
            };
        }
        if (this.tokentype === END) {
            func = function (state: CslState): void {
                state.tmp.jump.pop();
            };
        }
        this.execs.push(func);
        target.push(this);
    },

    configure: function (this: CslNode, state: CslState, pos: number): void {
        if (this.tokentype === END) {
            state.configure.fail.push((pos));
            state.configure.succeed.push((pos));
        } else {
            state.configure.fail.pop();
            state.configure.succeed.pop();
        }
    }
};
