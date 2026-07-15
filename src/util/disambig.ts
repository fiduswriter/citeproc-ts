import { CSL } from '../csl';
/*global CSL: true */

CSL.ambigConfigDiff = function (a: any, b: any): number {
    let pos: number, len: number, ppos: number, llen: number;
    // return of true means the ambig configs differ
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

CSL.cloneAmbigConfig = function (config: any, oldconfig?: any): any {
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
CSL.getAmbigConfig = function (this: any): any {
    let config: any, ret: any;
    config = this.tmp.disambig_request;
    if (!config) {
        config = this.tmp.disambig_settings;
    }
    const ret2 = CSL.cloneAmbigConfig(config);
    return ret2;
};

/**
 * Return max values for disambiguation
 */
CSL.getMaxVals = function (this: any): any {
    return this.tmp.names_max.mystack.slice();
};

/**
 * Return min value for disambiguation
 */
CSL.getMinVal = function (this: any): any {
    return this.tmp["et-al-min"];
};
