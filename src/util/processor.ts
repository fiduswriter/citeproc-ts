import { CSL } from '../csl';
/*global CSL: true */

import { Blob } from '../obj/blob';
import { FORMAT_KEY_SEQUENCE } from '../constants/core';
import { error } from '../logger';
CSL.substituteOne = function (template: string): (state: CslState, list: string) => string {
    return function (state: CslState, list: string): string {
        if (!list) {
            return "";
        } else {
            return template.replace("%%STRING%%", list);
        }
    };
};


/**
 * Two-tiered substitutions gadget.
 */
CSL.substituteTwo = function (template: string): (param: string) => (state: CslState, list: string) => string {
    return function (param: string): (state: CslState, list: string) => string {
        const template2 = template.replace("%%PARAM%%", param);
        return function (state: CslState, list: string): string {
            if (!list) {
                return "";
            } else {
                return template2.replace("%%STRING%%", list);
            }
        };
    };
};

/**
 * Generate string functions for designated output mode.
 * @param {String} mode Either "html" or "rtf", eventually.
 */
CSL.Mode = function (mode: string): Record<string, any> {
    let decorations: Record<string, any>, params: Record<string, any>, param: string, func: any, val: any, args: string[];
    decorations = {};
    params = CSL.Output.Formats[mode];
    for (let param in params) {
        if (true) {

            if ("@" !== param.slice(0, 1)) {
                decorations[param] = params[param];
                continue;
            }
            func = false;
            val = params[param];
            args = param.split("/");

            if (typeof val === "string" && val.indexOf("%%STRING%%") > -1) {
                if (val.indexOf("%%PARAM%%") > -1) {
                    func = CSL.substituteTwo(val);
                } else {
                    func = CSL.substituteOne(val);
                }
            } else if (typeof val === "boolean" && !val) {
                func = CSL.Output.Formatters.passthrough;
            } else if (typeof val === "function") {
                func = val;
            } else {
                error("Bad " + mode + " config entry for " + param + ": " + val);
            }

            if (args.length === 1) {
                decorations[args[0]] = func;
            } else if (args.length === 2) {
                if (!decorations[args[0]]) {
                    decorations[args[0]] = {};
                }
                decorations[args[0]][args[1]] = func;
            }
        }
    }
    return decorations;
};


/**
 * Generate a separate list of formatting attributes.
 */
CSL.setDecorations = function (state: CslState, attributes: Record<string, any>): any[][] {
    let ret: any[][], key: string, pos: number;
    ret = [];
    for (let pos = 0; pos < FORMAT_KEY_SEQUENCE.length; pos += 1) {
        const key2 = FORMAT_KEY_SEQUENCE[pos];
        if (attributes[key2]) {
            ret.push([key2, attributes[key2]]);
            delete attributes[key2];
        }
    }
    return ret;
};

CSL.Doppeler = function (this: any, rexStr: string, stringMangler?: (str: string) => string): void {
    const matchRex = new RegExp("(" + rexStr + ")", "g");
    const splitRex = new RegExp(rexStr, "g");
    this.split = function (str: string): { tags: string[]; strings: string[]; origStrings: string[] } {
        if (stringMangler) {
            str = stringMangler(str);
        }
        const match = str.match(matchRex);
        if (!match) {
            return {
                tags: [],
                strings: [str],
                origStrings: [str]
            };
        }
        const split = str.split(splitRex);
        for (let i = match.length - 1; i > -1; i -= 1) {
            if (typeof match[i] === "number") {
                match[i] = "";
            }
            const tag = match[i];
            if (tag === "\'" && split[i + 1].length > 0 && split[i + 1][0] !== " ") {
                split[i + 1] = match[i] + split[i + 1];
                match[i] = "";
            }
        }
        return {
            tags: match,
            strings: split,
            origStrings: split.slice()
        };
    };
    this.join = function (obj: { tags: string[]; strings: string[]; origStrings?: string[] }): string {
        const lst = obj.strings.slice(-1);
        for (let i = obj.tags.length - 1; i > -1; i -= 1) {
            lst.push(obj.tags[i]);
            lst.push(obj.strings[i]);
        }
        lst.reverse();
        return lst.join("");
    };
};

export function normalDecorIsOrphan(this: any, blob: Blob, params: string[]): boolean {
    if (params[1] === "normal") {
        let use_param = false;
        let all_the_decor: any;
        if (this.tmp.area === "citation") {
            all_the_decor = [this.citation.opt.layout_decorations].concat(blob.alldecor);
        } else {
            all_the_decor = blob.alldecor;
        }
        for (let k = all_the_decor.length - 1; k > -1; k -= 1) {
            for (let n = all_the_decor[k].length - 1; n > -1; n -= 1) {
                if (all_the_decor[k][n][0] === params[0]) {
                    if (all_the_decor[k][n][1] !== "normal") {
                        use_param = true;
                    }
                }
            }
        }
        if (!use_param) {
            return true;
        }
    }
    return false;
};
