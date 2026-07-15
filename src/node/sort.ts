import { CSL } from '../csl';
/*global CSL: true */

CSL.Node.sort = {
    build: function (this: CslNode, state: CslState, target: any[]): void {
        target = state[state.build.root + "_sort"].tokens;
        if (this.tokentype === CSL.START) {
            if (state.build.area === "citation") {
                state.opt.sort_citations = true;
            }
            state.build.area = state.build.root + "_sort";
            state.build.extension = "_sort";

            let func = function (this: CslNode, state: CslState, Item: CslItem): void {
                if (state.opt.has_layout_locale) {
                    const langspec = CSL.localeResolve(Item.language, state.opt["default-locale"][0]);
                    const sort_locales = state[state.tmp.area.slice(0, -5)].opt.sort_locales;
                    let langForItem;
                    for (let i = 0, ilen = sort_locales.length; i < ilen; i += 1) {
                        langForItem = sort_locales[i][langspec.bare];
                        if (!langForItem) {
                            langForItem = sort_locales[i][langspec.best];
                        }
                        if (langForItem) {
                            break;
                        }
                    }
                    if (!langForItem) {
                        langForItem = state.opt["default-locale"][0];
                    }
                    state.tmp.lang_sort_hold = state.opt.lang;
                    state.opt.lang = langForItem;
                }
            };
            this.execs.push(func);

        }
        if (this.tokentype === CSL.END) {
            state.build.area = state.build.root;
            state.build.extension = "";
            const funcEnd = function (this: CslNode, state: CslState): void {
                if (state.opt.has_layout_locale) {
                    state.opt.lang = state.tmp.lang_sort_hold;
                    delete state.tmp.lang_sort_hold;
                }
            };
            this.execs.push(funcEnd);
        }
        target.push(this);
    }
};
