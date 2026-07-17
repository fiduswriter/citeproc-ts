import { CSL } from '../csl';

import { Token } from '../obj/token';

import { Attributes } from '../attributes/attributes';
import { Node_choose } from './choose';
import { Node_if } from './if';

import { END, START } from '../constants/core';
export const Node_alternative = {
    build: function (this: CslNode, state: CslState, target: any[]): void {
        if (this.tokentype === START) {

            const choose_tok = new Token("choose", START);
            Node_choose.build.call(choose_tok, state, target);

            const if_tok = new Token("if", START);
            Attributes["@alternative-node-internal"].call(if_tok, state);
            Node_if.build.call(if_tok, state, target);

            let func = function (this: CslNode, state: CslState, Item: CslItem): void {

                state.tmp.oldItem = Item;
                state.tmp.oldLang = state.opt.lang;
                state.tmp.abort_alternative = true;

                let newItem: any;
                if (Item["language-name"] && Item["language-name-original"]) {

                    newItem = JSON.parse(JSON.stringify(Item));

                    newItem.language = newItem["language-name"];
                    const langspec = CSL.localeResolve(newItem.language, state.opt["default-locale"][0]);

                    if (state.opt.multi_layout) {
                        for (let i in state.opt.multi_layout) {
                            const locale_list = state.opt.multi_layout[i];
                            let gotlang: string = "";
                            for (let j in locale_list) {
                                const tryspec = locale_list[j];
                                if (langspec.best === tryspec.best || langspec.base === tryspec.base || langspec.bare === tryspec.bare) {
                                    gotlang = locale_list[0].best;
                                    break;
                                }
                            }
                            if (!gotlang) {
                                gotlang = state.opt["default-locale"][0];
                            }
                            state.opt.lang = gotlang;
                        }
                    }

                    for (let key in newItem) {
                        if (["id", "type", "language", "multi"].indexOf(key) === -1 && key.slice(0, 4) !== "alt-") {
                            if (newItem.multi && newItem.multi._keys[key]) {
                                let deleteme = true;
                                for (let lang in newItem.multi._keys[key]) {
                                    if (langspec.bare === lang.replace(/^([a-zA-Z]+).*/, "$1")) {
                                        deleteme = false;
                                        break;
                                    }
                                }
                                if (deleteme) {
                                    delete newItem[key];
                                }
                            } else {
                                delete newItem[key];
                            }
                        }
                    }
                    for (let key in newItem) {
                        if (key.slice(0, 4) === "alt-") {
                            newItem[key.slice(4)] = newItem[key];
                            state.tmp.abort_alternative = false;
                        } else {
                            if (newItem.multi && newItem.multi._keys) {
                                if (!newItem["alt-" + key] && newItem.multi._keys[key]) {
                                    if (newItem.multi._keys[key][langspec.best]) {
                                        newItem[key] = newItem.multi._keys[key][langspec.best];
                                        state.tmp.abort_alternative = false;
                                    } else if (newItem.multi._keys[key][langspec.base]) {
                                        newItem[key] = newItem.multi._keys[key][langspec.base];
                                        state.tmp.abort_alternative = false;
                                    } else if (newItem.multi._keys[key][langspec.bare]) {
                                        newItem[key] = newItem.multi._keys[key][langspec.bare];
                                        state.tmp.abort_alternative = false;
                                    }
                                }
                            }
                        }
                    }
                }

                state.output.openLevel(this);
                state.registry.refhash[Item.id] = newItem;
                state.nameOutput = new CSL.NameOutput(state, newItem);
            };
            this.execs.push(func);
            target.push(this);

            const choose_tok2 = new Token("choose", START);
            Node_choose.build.call(choose_tok2, state, target);

            const if_tok2 = new Token("if", START);
            Attributes["@alternative-node-internal"].call(if_tok2, state);
            const func2 = function (this: CslNode, state: CslState): void {
                state.tmp.abort_alternative = true;
            };
            if_tok2.execs.push(func2);
            Node_if.build.call(if_tok2, state, target);

        } else if (this.tokentype === END) {

            const if_tok3 = new Token("if", END);
            Node_if.build.call(if_tok3, state, target);

            const choose_tok3 = new Token("choose", END);
            Node_choose.build.call(choose_tok3, state, target);

            const func3 = function (this: CslNode, state: CslState, Item: CslItem): void {
                state.output.closeLevel();
                state.registry.refhash[Item.id] = state.tmp.oldItem;
                state.opt.lang = state.tmp.oldLang;
                state.nameOutput = new CSL.NameOutput(state, state.tmp.oldItem);
                state.tmp.abort_alternative = false;
            };
            this.execs.push(func3);
            target.push(this);

            const if_tok4 = new Token("if", END);
            Node_if.build.call(if_tok4, state, target);

            const choose_tok4 = new Token("choose", END);
            Node_choose.build.call(choose_tok4, state, target);

        }
    }
};
