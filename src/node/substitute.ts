import { CSL } from '../csl';

import { Token } from '../obj/token';

import { END, LITERAL, SINGLETON, START } from '../constants/core';
export const Node_substitute = {
    build: function (this: CslNode, state: CslState, target: any[]): void {
        let func: (() => boolean) | ((state: CslState) => void);
        if (this.tokentype === START) {
            /* */
            // set conditional
            const choose_start = new Token("choose", START);
            CSL.Node.choose.build.call(choose_start, state, target);
            const if_singleton = new Token("if", SINGLETON);
            func = function (): boolean {
                if (state.tmp.value.length && !state.tmp.common_term_match_fail) {
                    return true;
                }
                return false;
            };
            if_singleton.tests = [func];
            if_singleton.test = state.fun.match.any(if_singleton, state, if_singleton.tests);
            target.push(if_singleton);

            func = function (state: CslState): void {
                state.tmp.can_block_substitute = true;
                if (state.tmp.value.length && !state.tmp.common_term_match_fail) {
                    state.tmp.can_substitute.replace(false, LITERAL);
                }
                state.tmp.common_term_match_fail = false;
            };
            this.execs.push(func);
            target.push(this);
            /* */
        }
        if (this.tokentype === END) {
            target.push(this);
            const choose_end = new Token("choose", END);
            CSL.Node.choose.build.call(choose_end, state, target);
            /* */
        }
    }
};
