import { CSL } from '../csl';

import { END, NUMERIC, POSITION, START } from '../constants/core';
export const Node_citation = {
    build: function (this: CslNode, state: CslState, target: any[]): void {
        if (this.tokentype === START) {

            state.build.area = "citation";
            state.build.root = "citation";
            state.build.extension = "";

            let func = function (state: CslState): void {
                state.tmp.area = "citation";
                state.tmp.root = "citation";
                state.tmp.extension = "";
            };
            this.execs.push(func);

        }
        if (this.tokentype === END) {

            // Open an extra key at first position for use in
            // grouped sorts.
            state.opt.grouped_sort = state.opt.xclass === "in-text"
                && (state.citation.opt.collapse
                    && state.citation.opt.collapse.length)
                || (state.citation.opt.cite_group_delimiter
                    && state.citation.opt.cite_group_delimiter.length)
                && state.opt.update_mode !== POSITION
                && state.opt.update_mode !== NUMERIC;

            if (state.opt.grouped_sort
                && state.citation_sort.opt.sort_directions.length) {

                const firstkey = state.citation_sort.opt.sort_directions[0].slice();
                state.citation_sort.opt.sort_directions = [firstkey].concat(state.citation_sort.opt.sort_directions);
            }
            state.citation.srt = new CSL.Registry.Comparifier(state, "citation_sort");
        }
        target.push(this);
    }
};
