/*global CSL: true */

export function evaluateLabel(node: CslNode, state: CslState, Item: CslItem, item: any): string {
    let myterm: string;
    if ("locator" === node.strings.term) {
        if (item && item.label) {
            if (item.label === "sub verbo") {
                myterm = "sub-verbo";
            } else {
                myterm = item.label;
            }
        }
        if (!myterm) {
            myterm = "page";
        }
    } else {
        myterm = node.strings.term;
    }

    let plural: any = node.strings.plural;
    if ("number" !== typeof plural) {
        const theItem = (item && node.strings.term === "locator") ? item : Item;
        if (theItem[node.strings.term]) {
            state.processNumber(false, theItem, node.strings.term, Item.type);
            plural = state.tmp.shadow_numbers[node.strings.term].plural;
            if (!state.tmp.shadow_numbers[node.strings.term].labelForm
                && !state.tmp.shadow_numbers[node.strings.term].labelDecorations) {
                if (node.strings.form) {
                    state.tmp.shadow_numbers[node.strings.term].labelForm = node.strings.form;
                } else if (state.tmp.group_context.tip.label_form) {
                    state.tmp.shadow_numbers[node.strings.term].labelForm = state.tmp.group_context.tip.label_form;
                }
                state.tmp.shadow_numbers[node.strings.term].labelCapitalizeIfFirst = node.strings.capitalize_if_first;
                state.tmp.shadow_numbers[node.strings.term].labelDecorations = node.decorations.slice();
            }

            if (["locator", "number", "page"].indexOf(node.strings.term) > -1 && state.tmp.shadow_numbers[node.strings.term].label) {
                myterm = state.tmp.shadow_numbers[node.strings.term].label;
            }
            if (node.decorations && state.opt.development_extensions.csl_reverse_lookup_support) {
                node.decorations.reverse();
                node.decorations.push(["@showid", "true", node.cslid]);
                node.decorations.reverse();
            }
        }
    }
    return castLabel(state, node, myterm, plural, CSL.TOLERANT);
};

export function castLabel(state: CslState, node: CslNode, term: any, plural: any, mode: any): string {
    let label_form = node.strings.form;
    let label_capitalize_if_first = node.strings.capitalize_if_first;
    if (state.tmp.group_context.tip.label_form) {
        if (label_form === "static") {
            state.tmp.group_context.tip.label_static = true;
        } else {
            label_form = state.tmp.group_context.tip.label_form;
        }
    }

    if (state.tmp.group_context.tip.label_capitalize_if_first) {
        label_capitalize_if_first = state.tmp.group_context.tip.label_capitalize_if_first;
    }
    let ret = state.getTerm(term, label_form, plural, false, mode, node.default_locale);
    if (label_capitalize_if_first) {
        ret = CSL.Output.Formatters["capitalize-first"](state, ret);
    }
    if (state.tmp.strip_periods) {
        ret = ret.replace(/\./g, "");
    } else {
        for (let i = 0, ilen = node.decorations.length; i < ilen; i += 1) {
            if ("@strip-periods" === node.decorations[i][0] && "true" === node.decorations[i][1]) {
                ret = ret.replace(/\./g, "");
                break;
            }
        }
    }
    return ret;
};
