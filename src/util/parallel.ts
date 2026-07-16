export class Parallel {
    state: CslState;

    constructor(state: CslState) {
        this.state = state;
    }

    StartCitation(sortedItems: any[], _out?: any): void {
        this.state.tmp.suppress_repeats = [];
        if (sortedItems.length < 2) {
            return;
        }
        let idxEnd: any = 0;
        let parallelMatchList: any = false;
        const siblingRanges: any[] = [];

        for (let i = 0, ilen = sortedItems.length - 1; i < ilen; i += 1) {
            const currItem = sortedItems[i][0];
            const nextItem = sortedItems[i + 1][0];
            let freshMatchList = false;
            const info: any = {};
            if (sortedItems[i][0].seeAlso && sortedItems[i][0].seeAlso.length > 0 && !parallelMatchList) {
                freshMatchList = true;
                parallelMatchList = [sortedItems[i][0].id].concat(sortedItems[i][0].seeAlso);
                let tempMatchList = parallelMatchList.slice();
                const remainder = sortedItems.slice(i);
                remainder[0][1].parallel = "first";
                for (let j = 0, jlen = remainder.length; j < jlen; j += 1) {
                    const itemID = remainder[j][0].id;
                    const ididx = tempMatchList.indexOf(itemID);
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
            for (const varname in this.state.opt.track_repeat) {
                if (!currItem[varname] || !nextItem[varname]) {
                    info[varname] = false;
                } else if ("string" === typeof nextItem[varname] || "number" === typeof nextItem[varname]) {
                    let currVal2: any, nextVal2: any;
                    if (varname === "title" && currItem["title-short"] && nextItem["title-short"]) {
                        currVal2 = currItem["title-short"];
                        nextVal2 = nextItem["title-short"];
                    } else {
                        currVal2 = currItem[varname];
                        nextVal2 = nextItem[varname];
                    }
                    if (currVal2 == nextVal2) {
                        info[varname] = true;
                    } else {
                        info[varname] = false;
                    }
                } else if ("undefined" === typeof currItem[varname].length) {
                    info[varname] = false;
                    const currYear = currItem[varname].year;
                    const nextYear = nextItem[varname].year;
                    if (currYear && nextYear) {
                        if (currYear == nextYear) {
                            info[varname] = true;
                        }
                    }
                } else {
                    const currVal3 = JSON.stringify(currItem[varname]);
                    const nextVal3 = JSON.stringify(nextItem[varname]);
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
            const masterID = sortedItems[siblingRanges[j2][0]][0].id;
            this.state.registry.registry[masterID].master = true;
            this.state.registry.registry[masterID].siblings = [];
            const start = siblingRanges[j2][0];
            const end = siblingRanges[j2][1];
            for (let k = start; k < end; k += 1) {
                this.state.tmp.suppress_repeats[k].SIBLING = true;
                const siblingID = sortedItems[k + 1][0].id;
                sortedItems[k + 1][1].parallel = "other";
                this.state.registry.registry[masterID].siblings.push(siblingID);
            }
        }
    }

    checkRepeats(params: Record<string, any>): boolean {
        const idx = this.state.tmp.cite_index;
        if (this.state.tmp.suppress_repeats) {
            if (params.parallel_first && Object.keys(params.parallel_first).length > 0) {
                const arr: any = [{}].concat(this.state.tmp.suppress_repeats);
                let ret = true;
                for (const varname in params.parallel_first) {
                    if (!arr[idx][varname] || arr[idx].START) {
                        ret = false;
                    }
                }
                return ret;
            }
            if (params.parallel_last && Object.keys(params.parallel_last).length > 0) {
                const arr2 = this.state.tmp.suppress_repeats.concat([{}]);
                let ret2 = Object.keys(params.parallel_last).length > 0;
                for (const varname2 in params.parallel_last) {
                    if (!arr2[idx][varname2] || arr2[idx].END) {
                        ret2 = false;
                    }
                }
                return ret2;
            }
            if (params.non_parallel && Object.keys(params.non_parallel).length > 0) {
                const arr3: any = [{}].concat(this.state.tmp.suppress_repeats);
                let ret3 = true;
                for (const varname3 in params.non_parallel) {
                    if (!arr3[idx][varname3]) {
                        ret3 = false;
                    }
                }
                return ret3;
            }
        }
        return false;
    }
}
