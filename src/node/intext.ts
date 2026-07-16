import { END, START } from '../constants/core';
export const Node_intext = {
    build: function (this: CslNode, state: CslState, target: any[]): void {
        if (this.tokentype === START) {

            state.build.area = "intext";
            state.build.root = "intext";
            state.build.extension = "";

            let func = function (this: CslNode, state: CslState, Item: CslItem): void {
                state.tmp.area = "intext";
                state.tmp.root = "intext";
                state.tmp.extension = "";
            };
            this.execs.push(func);
        }
        if (this.tokentype === END) {

            state.intext_sort = {
                opt: {
                    sort_directions: state.citation_sort.opt.sort_directions
                }
            };
            state.intext.srt = state.citation.srt;
        }
        target.push(this);
    }
};
