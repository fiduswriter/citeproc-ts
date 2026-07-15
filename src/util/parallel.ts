import { CSL } from '../csl';
/*global CSL: true */

/**
 * Initializes the parallel cite tracking arrays
 */
CSL.Parallel = function (this: any, state: CslState): void {
    this.state = state;
};

CSL.Parallel.prototype.StartCitation = function (this: any, sortedItems: any, out: any): void {
    this.state.tmp.suppress_repeats = [];
    if (sortedItems.length < 2) {
        return;
    }
    var idxEnd: any = 0;
    var parallelMatchList: any = false;
    var siblingRanges: any[] = [];

    for (let i = 0, ilen = sortedItems.length - 1; i < ilen; i += 1) {
        var currItem = sortedItems[i][0];
        var nextItem = sortedItems[i + 1][0];
        var freshMatchList = false;
        var info: any = {};
        if (sortedItems[i][0].seeAlso && sortedItems[i][0].seeAlso.length > 0 && !parallelMatchList) {
            freshMatchList = true;
            parallelMatchList = [sortedItems[i][0].id].concat(sortedItems[i][0].seeAlso);
            var tempMatchList = parallelMatchList.slice();
            var remainder = sortedItems.slice(i);
            remainder[0][1].parallel = "first";
            for (let j = 0, jlen = remainder.length; j < jlen; j += 1) {
                var itemID = remainder[j][0].id;
                var ididx = tempMatchList.indexOf(itemID);
                idxEnd = false;
                if (ididx === -1) {
                    idxEnd = (i + j - 1);
                } else if ((i + j) === (sortedItems.length - 1)) {
                    idxEnd = (i + j);
                }
                if (idxEnd) {
                    siblingRanges.push([i, idxEnd]);
                    break;
                } else {
                    tempMatchList = tempMatchList.slice(0, ididx).concat(tempMatchList.slice(ididx + 1));
                }
            }
        }
        if (i > 0 && freshMatchList) {
            this.state.tmp.suppress_repeats[i - 1].START = true;
            freshMatchList = false;
        }
        for (let varname in this.state.opt.track_repeat) {
            if (!currItem[varname] || !nextItem[varname]) {
                info[varname] = false;
            } else if ("string" === typeof nextItem[varname] || "number" === typeof nextItem[varname]) {
                if (varname === "title" && currItem["title-short"] && nextItem["title-short"]) {
                    var currVal = currItem["title-short"];
                    var nextVal = nextItem["title-short"];
                } else {
                    var currVal2 = currItem[varname];
                    var nextVal2 = nextItem[varname];
                }
                if (currVal2 == nextVal2) {
                    info[varname] = true;
                } else {
                    info[varname] = false;
                }
            } else if ("undefined" === typeof currItem[varname].length) {
                info[varname] = false;
                var currYear = currItem[varname].year;
                var nextYear = nextItem[varname].year;
                if (currYear && nextYear) {
                    if (currYear == nextYear) {
                        info[varname] = true;
                    }
                }
            } else {
                var currVal3 = JSON.stringify(currItem[varname]);
                var nextVal3 = JSON.stringify(nextItem[varname]);
                if (currVal3 === nextVal3) {
                    info[varname] = true;
                } else {
                    info[varname] = false;
                }
            }
        }
        if (!parallelMatchList) {
            info.ORPHAN = true;
        }
        if (idxEnd === i) {
            info.END = true;
            parallelMatchList = false;
        }
        this.state.tmp.suppress_repeats.push(info);
    }

    for (let j2 = 0, jlen2 = siblingRanges.length; j2 < jlen2; j2 += 1) {
        var masterID = sortedItems[siblingRanges[j2][0]][0].id;
        this.state.registry.registry[masterID].master = true;
        this.state.registry.registry[masterID].siblings = [];
        var start = siblingRanges[j2][0];
        var end = siblingRanges[j2][1];
        for (let k = start; k < end; k += 1) {
            this.state.tmp.suppress_repeats[k].SIBLING = true;
            var siblingID = sortedItems[k + 1][0].id;
            sortedItems[k + 1][1].parallel = "other";
            this.state.registry.registry[masterID].siblings.push(siblingID);
        }
    }
};

CSL.Parallel.prototype.checkRepeats = function (this: any, params: any): any {
    var idx = this.state.tmp.cite_index;
    if (this.state.tmp.suppress_repeats) {
        if (params.parallel_first && Object.keys(params.parallel_first).length > 0) {
            var arr: any = [{}].concat(this.state.tmp.suppress_repeats);
            let ret = true;
            for (let varname in params.parallel_first) {
                if (!arr[idx][varname] || arr[idx].START) {
                    ret = false;
                }
            }
            return ret;
        }
        if (params.parallel_last && Object.keys(params.parallel_last).length > 0) {
            var arr2 = this.state.tmp.suppress_repeats.concat([{}]);
            var ret2 = Object.keys(params.parallel_last).length > 0 ? true : false;
            for (let varname2 in params.parallel_last) {
                if (!arr2[idx][varname2] || arr2[idx].END) {
                    ret2 = false;
                }
            }
            return ret2;
        }
        if (params.non_parallel && Object.keys(params.non_parallel).length > 0) {
            var arr3: any = [{}].concat(this.state.tmp.suppress_repeats);
            var ret3 = true;
            for (let varname3 in params.non_parallel) {
                if (!arr3[idx][varname3]) {
                    ret3 = false;
                }
            }
            return ret3;
        }
    }
    return false;
};
