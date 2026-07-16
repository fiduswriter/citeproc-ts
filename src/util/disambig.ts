/*global CSL: true */

import { AmbigConfig } from '../obj/ambigconfig';

export function ambigConfigDiff(a: AmbigConfig, b: AmbigConfig): number {
    let pos: number, len: number, ppos: number, llen: number;
    if (a.names.length !== b.names.length) {
        return 1;
    } else {
        for (let pos = 0, len = a.names.length; pos < len; pos += 1) {
            if (a.names[pos] !== b.names[pos]) {
                return 1;
            } else {
                for (let ppos = 0, llen = a.givens[pos]; ppos < llen; ppos += 1) {
                    if (a.givens[pos][ppos] !== b.givens[pos][ppos]) {
                        return 1;
                    }
                }
            }
        }
    }
    if (a.disambiguate != b.disambiguate) {
        return 1;
    }
    if (a.year_suffix !== b.year_suffix) {
        return 1;
    }
    return 0;
};

export function cloneAmbigConfig(config: AmbigConfig, oldconfig?: AmbigConfig): AmbigConfig {
    let i: number, ilen: number, j: number, jlen: number, param: any;
    let ret: any = {};
    ret.names = [];
    ret.givens = [];
    ret.year_suffix = false;
    ret.disambiguate = false;
    for (let i = 0, ilen = config.names.length; i < ilen; i += 1) {
        param = config.names[i];
        ret.names[i] = param;
    }
    for (let i = 0, ilen = config.givens.length; i < ilen; i += 1) {
        param = [];
        for (let j = 0, jlen = config.givens[i].length; j < jlen; j += 1) {
            param.push(config.givens[i][j]);
        }
        ret.givens.push(param);
    }
    if (oldconfig) {
        ret.year_suffix = oldconfig.year_suffix;
        ret.disambiguate = oldconfig.disambiguate;
    } else {
        ret.year_suffix = config.year_suffix;
        ret.disambiguate = config.disambiguate;
    }
    return ret;
};

/**
 * Return current base configuration for disambiguation
 */
export function getAmbigConfig(this: CslState): AmbigConfig {
    let config: any, ret: any;
    config = this.tmp.disambig_request;
    if (!config) {
        config = this.tmp.disambig_settings;
    }
    const ret2 = cloneAmbigConfig(config);
    return ret2;
};

/**
 * Return max values for disambiguation
 */
export function getMaxVals(this: CslState): any[] {
    return this.tmp.names_max.mystack.slice();
};

/**
 * Return min value for disambiguation
 */
export function getMinVal(this: CslState): any {
    return this.tmp["et-al-min"];
};
