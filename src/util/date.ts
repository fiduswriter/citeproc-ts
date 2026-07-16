import { CSL } from '../csl';

import { DATE_PARTS, DATE_PARTS_INTERNAL } from '../constants/core';
import { debug, error } from '../logger';
export function dateMacroAsSortKey(this: any, state: CslState, Item: CslItem): void {
    dateAsSortKey.call(this, state, Item, true);
};


export function dateAsSortKey(this: any, state: CslState, Item: CslItem, isMacro?: any): void {
    let dp: any, elem: any, value: any, e: any, yr: any, prefix: any, i: any, ilen: any;
    const variable = this.variables[0];
    let macroFlag = "empty";
    if (isMacro && state.tmp.extension) {
        macroFlag = "macro-with-date";
    }
    dp = Item[variable];
    if ("undefined" === typeof dp) {
        dp = { "date-parts": [[0]] };
    }
    if ("undefined" === typeof this.dateparts) {
        this.dateparts = ["year", "month", "day"];
    }
    if (dp.raw) {
        dp = state.fun.dateparser.parseDateToArray(dp.raw);
    } else if (dp["date-parts"]) {
        dp = state.dateParseArray(dp);
    }
    if ("undefined" === typeof dp) {
        dp = {};
    }
    if (dp.year) {
        for (let i = 0, ilen = DATE_PARTS_INTERNAL.length; i < ilen; i += 1) {
            elem = DATE_PARTS_INTERNAL[i];
            value = 0;
            e = elem;
            if (e.slice(-4) === "_end") {
                e = e.slice(0, -4);
            }
            if (dp[elem] && this.dateparts.indexOf(e) > -1) {
                value = dp[elem];
            }
            if (elem.slice(0, 4) === "year") {
                yr = CSL.Util.Dates[e].numeric(state, value);
                let prefix2 = "1";
                if (yr[0] === "-") {
                    prefix2 = "0";
                    yr = yr.slice(1);
                    yr = 9999 - parseInt(yr, 10);
                }
                state.output.append(CSL.Util.Dates[elem.slice(0, 4)].numeric(state, (prefix2 + yr)), macroFlag);
            } else {
                value = CSL.Util.Dates[e]["numeric-leading-zeros"](state, value);
                if (!value) {
                    value = "00";
                }
                state.output.append(value, macroFlag);
            }
        }
    }
};

export function dateParseArray(this: any, date_obj: any): any {
    let ret: any, field: any, dp: any, exts: any;
    ret = {};
    for (let field in date_obj) {
        if (field === "date-parts") {
            dp = date_obj["date-parts"];
            if (dp.length > 1) {
                if (dp[0].length !== dp[1].length) {
                    error("CSL data error: element mismatch in date range input.");
                }
            }
            exts = ["", "_end"];
            for (let i = 0, ilen = dp.length; i < ilen; i += 1) {
                for (let j = 0, jlen = DATE_PARTS.length; j < jlen; j += 1) {
                    if (isNaN(parseInt(dp[i][j], 10))) {
                        ret[(DATE_PARTS[j] + exts[i])] = undefined;
                    } else {
                        ret[(DATE_PARTS[j] + exts[i])] = parseInt(dp[i][j], 10);
                    }
                }
            }
        } else if (date_obj.hasOwnProperty(field)) {
            if (field === "literal" && "object" === typeof date_obj.literal && "string" === typeof date_obj.literal.part) {
                debug("Warning: fixing up weird literal date value");
                ret.literal = date_obj.literal.part;
            } else {
                ret[field] = date_obj[field];
            }
        }
    }
    return ret;
};
