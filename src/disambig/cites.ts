import { getAmbiguousCite } from '../engine/cite';
import { ambigConfigDiff, getAmbigConfig, getMaxVals, cloneAmbigConfig } from '../util/disambig';

export class Disambiguation {
    state: CslState;
    sys: any;
    registry: any;
    ambigcites: any;
    debug: boolean;
    akey: string;
    modes: string[];
    modeindex: number;
    lists: [any, any[]][];
    base: any;
    betterbase: any;
    Item: CslItem;
    ItemCite: string;
    scanlist: any[];
    partners: CslItem[];
    nonpartners: CslItem[];
    clashes: number[];
    gnameset: number;
    gname: number;
    initGivens: boolean;
    givensMax: any;
    namesMax: any;
    namesetsMax: any;
    maxNamesByItemId: Record<string, any>;
    listpos: number;

    constructor(state: CslState) {
        this.state = state;
        this.sys = this.state.sys;
        this.registry = state.registry.registry;
        this.ambigcites = state.registry.ambigcites;
        this.configModes();
        this.debug = false;
    }

    run(akey: string): void {
        if (!this.modes.length) {
            return;
        }
        if (this.debug) {
            this.state.sys.print("[A] === RUN ===");
        }
        this.akey = akey;
        if (this.initVars(akey)) {
            this.runDisambig();
        }
    }

    runDisambig(): void {
        let ismax: boolean;
        if (this.debug) {
            this.state.sys.print("[C] === runDisambig() ===");
        }
        this.initGivens = true;
        while (this.lists.length) {
            this.gnameset = 0;
            this.gname = 0;
            this.clashes = [1, 0];
            let loopGuard = 0;
            const loopGuardMax = (this.lists[0][1].length + 2) * 1000;
            while (this.lists[0][1].length) {
                this.listpos = 0;
                if (!this.base) {
                    this.base = this.lists[0][0];
                }
                ismax = this.incrementDisambig();
                this.scanItems(this.lists[0]);
                this.evalScan(ismax);
                loopGuard += 1;
                if (loopGuard > loopGuardMax) {
                    const giveupBase = this.betterbase || this.base;
                    const remaining = this.lists[0][1];
                    for (let gi = 0, gilen = remaining.length; gi < gilen; gi += 1) {
                        this.state.registry.registerAmbigToken(this.akey, "" + remaining[gi].id, giveupBase);
                    }
                    this.lists[0] = [giveupBase, []];
                    break;
                }
            }
            this.lists = this.lists.slice(1);
        }
    }

    scanItems(list: [any, CslItem[]]): void {
        let pos: number, len: number, otherItem: CslItem;
        if (this.debug) {
            this.state.sys.print("[2] === scanItems() ===");
        }

        this.Item = list[1][0];
        this.ItemCite = getAmbiguousCite.call(this.state, this.Item, this.base, true);

        this.scanlist = list[1];
        this.partners = [];
        this.partners.push(this.Item);
        this.nonpartners = [];
        let clashes = 0;

        for (let pos = 1, len = list[1].length; pos < len; pos += 1) {
            otherItem = list[1][pos];
            const otherItemCite = getAmbiguousCite.call(this.state, otherItem, this.base, true);
            if (this.debug) {
                if (pos > 1) {
                    this.state.sys.print("  -----------");
                }
            }
            if (this.ItemCite === otherItemCite) {
                if (this.debug) {
                    this.state.sys.print("  [CLASH]--> " + this.Item.id + ": " + this.ItemCite);
                    this.state.sys.print("             " + otherItem.id + ": " + otherItemCite);
                }
                clashes += 1;
                this.partners.push(otherItem);
            } else {
                if (this.debug) {
                    this.state.sys.print("  [clear]--> " + this.Item.id + ": " + this.ItemCite);
                    this.state.sys.print("             " + otherItem.id + ": " + otherItemCite);
                }
                this.nonpartners.push(otherItem);
            }
        }
        this.clashes[0] = this.clashes[1];
        this.clashes[1] = clashes;
    }

    evalScan(maxed: boolean): void {
        this[this.modes[this.modeindex]](maxed);
        if (maxed) {
            if (this.modeindex < this.modes.length - 1) {
                this.modeindex += 1;
            } else {
                this.lists[this.listpos + 1] = [this.base, []];
            }
        }
    }

    disNames(ismax?: boolean): void {
        let i: number, ilen: number;

        if (this.debug) {
            this.state.sys.print("[3] == disNames() ==");
        }

        if (this.clashes[1] === 0 && this.nonpartners.length === 1) {
            this.captureStepToBase();
            if (this.debug) {
                this.state.sys.print("  ** RESOLUTION [a]: lone partner, one nonpartner");
                this.state.sys.print("  registering " + this.partners[0].id + " and " + this.nonpartners[0].id);
            }
            this.state.registry.registerAmbigToken(this.akey, "" + this.nonpartners[0].id, this.betterbase);
            this.state.registry.registerAmbigToken(this.akey, "" + this.partners[0].id, this.betterbase);
            this.lists[this.listpos] = [this.betterbase, []];
        } else if (this.clashes[1] === 0) {
            this.captureStepToBase();
            if (this.debug) {
                this.state.sys.print("  ** RESOLUTION [b]: lone partner, unknown number of remaining nonpartners");
                this.state.sys.print("  registering " + this.partners[0].id);
            }
            this.state.registry.registerAmbigToken(this.akey, "" + this.partners[0].id, this.betterbase);
            this.lists[this.listpos] = [this.betterbase, this.nonpartners];
            if (this.nonpartners.length) {
                this.initGivens = true;
            }
        } else if (this.nonpartners.length === 1) {
            this.captureStepToBase();
            if (this.debug) {
                this.state.sys.print("  ** RESOLUTION [c]: lone nonpartner, unknown number of partners remaining");
                this.state.sys.print("  registering " + this.nonpartners[0].id);
            }
            this.state.registry.registerAmbigToken(this.akey, "" + this.nonpartners[0].id, this.betterbase);
            this.lists[this.listpos] = [this.betterbase, this.partners];
        } else if (this.clashes[1] < this.clashes[0]) {
            this.captureStepToBase();
            if (this.debug) {
                this.state.sys.print("  ** RESOLUTION [d]: better result, but no entries safe to register");
            }
            this.lists[this.listpos] = [this.betterbase, this.partners];
            this.lists.push([this.betterbase, this.nonpartners]);
        } else {
            if (this.debug) {
                this.state.sys.print("  ** RESOLUTION [e]: no improvement, and clashes remain");
            }
            if (ismax) {
                this.lists[this.listpos] = [this.betterbase, this.nonpartners];
                this.lists.push([this.betterbase, this.partners]);
                if (this.modeindex === this.modes.length - 1) {
                    if (this.debug) {
                        this.state.sys.print("     (registering clashing entries because we've run out of options)");
                    }
                    for (let i = 0, ilen = this.partners.length; i < ilen; i += 1) {
                        this.state.registry.registerAmbigToken(this.akey, "" + this.partners[i].id, this.betterbase);
                    }
                    this.lists[this.listpos] = [this.betterbase, []];
                }
            }
        }
    }

    disExtraText(): void {
        if (this.debug) {
            this.state.sys.print("[3] === disExtraText ==");
        }

        let done = false;

        if (this.clashes[1] === 0 && this.nonpartners.length < 2) {
            done = true;
        }

        if (!done && (!this.base.disambiguate || this.state.tmp.disambiguate_count !== this.state.tmp.disambiguate_maxMax)) {
            this.modeindex = 0;
            this.base.disambiguate = this.state.tmp.disambiguate_count;
            this.betterbase.disambiguate = this.state.tmp.disambiguate_count;
            if (!this.base.disambiguate) {
                this.initGivens = true;
                this.base.disambiguate = 1;
                for (let i = 0, ilen = this.lists[this.listpos][1].length; i < ilen; i += 1) {
                    this.state.tmp.taintedItemIDs[this.lists[this.listpos][1][i].id] = true;
                }
            } else {
                this.disNames();
            }
        } else if (done || this.state.tmp.disambiguate_count === this.state.tmp.disambiguate_maxMax) {
            if (done || this.modeindex === this.modes.length - 1) {
                let base = this.lists[this.listpos][0];
                for (let i = 0, ilen = this.lists[this.listpos][1].length; i < ilen; i += 1) {
                    this.state.tmp.taintedItemIDs[this.lists[this.listpos][1][i].id] = true;
                    this.state.registry.registerAmbigToken(this.akey, "" + this.lists[this.listpos][1][i].id, base);
                }
                this.lists[this.listpos] = [this.betterbase, []];
            } else {
                this.modeindex = this.modes.length - 1;
                let base = this.lists[this.listpos][0];
                base.disambiguate = true;
                for (let i = 0, ilen = this.lists[this.listpos][1].length; i < ilen; i += 1) {
                    this.state.tmp.taintedItemIDs[this.lists[this.listpos][1][i].id] = true;
                    this.state.registry.registerAmbigToken(this.akey, "" + this.lists[this.listpos][1][i].id, base);
                }
            }
        }
    }

    disYears(): void {
        let pos: number, len: number, tokens: CslItem[], token: any;
        if (this.debug) {
            this.state.sys.print("[3] === disYears ==");
        }
        tokens = [];
        let base = this.lists[this.listpos][0];
        if (this.clashes[1]) {
            for (let i = 0, ilen = this.state.registry.mylist.length; i < ilen; i += 1) {
                const origid = this.state.registry.mylist[i];
                for (let j = 0, jlen = this.lists[this.listpos][1].length; j < jlen; j += 1) {
                    const token = this.lists[this.listpos][1][j];
                    if (token.id == origid) {
                        tokens.push(this.registry[token.id]);
                        break;
                    }
                }
            }
        }
        tokens.sort(this.state.registry.sorter.compareKeys);
        for (let pos = 0, len = tokens.length; pos < len; pos += 1) {
            base.year_suffix = "" + pos;
            const oldBase = this.state.registry.registry[tokens[pos].id].disambig;
            this.state.registry.registerAmbigToken(this.akey, "" + tokens[pos].id, base);
            if (ambigConfigDiff(oldBase, base)) {
                this.state.tmp.taintedItemIDs[tokens[pos].id] = true;
            }
        }
        this.lists[this.listpos] = [this.betterbase, []];
    }

    incrementDisambig(): boolean {
        if (this.debug) {
            this.state.sys.print("\n[1] === incrementDisambig() ===");
        }
        if (this.initGivens) {
            this.initGivens = false;
            return false;
        }
        let maxed = false;
        let increment_names = true;
        if ("disNames" === this.modes[this.modeindex]) {
            increment_names = false;
            if ("number" !== typeof this.givensMax) {
                increment_names = true;
            }
            let increment_namesets = false;
            if ("number" !== typeof this.namesMax) {
                increment_namesets = true;
            }
            if ("number" === typeof this.givensMax) {
                if (this.base.givens.length && this.base.givens[this.gnameset][this.gname] < this.givensMax) {
                    this.base.givens[this.gnameset][this.gname] += 1;
                } else {
                    increment_names = true;
                }
            }
            if ("number" === typeof this.namesMax
                && increment_names) {
                if (this.state.opt["disambiguate-add-names"]) {
                    increment_namesets = false;
                    if (this.gname < this.namesMax) {
                        this.base.names[this.gnameset] += 1;
                        this.gname += 1;
                    } else {
                        increment_namesets = true;
                    }
                } else {
                    increment_namesets = true;
                }
            }
            if ("number" === typeof this.namesetsMax && increment_namesets) {
                if (this.gnameset < this.namesetsMax) {
                    this.gnameset += 1;
                    this.base.names[this.gnameset] = 1;
                    this.gname = 0;
                }
            }
            if (this.debug) {
                this.state.sys.print("    ------------------");
                this.state.sys.print("    incremented values");
                this.state.sys.print("    ------------------");
                this.state.sys.print("    | gnameset: " + this.gnameset);
                this.state.sys.print("    | gname: " + this.gname);
                this.state.sys.print("    | names value: " + this.base.names[this.gnameset]);
                if (this.base.givens.length) {
                    this.state.sys.print("    | givens value: " + this.base.givens[this.gnameset][this.gname]);
                } else {
                    this.state.sys.print("    | givens value: nil");
                }
                this.state.sys.print("    | namesetsMax: " + this.namesetsMax);
                this.state.sys.print("    | namesMax: " + this.namesMax);
                this.state.sys.print("    | givensMax: " + this.givensMax);
            }
            if (("number" !== typeof this.namesetsMax || this.namesetsMax === -1 || this.gnameset === this.namesetsMax)
                && (!this.state.opt["disambiguate-add-names"] || "number" !== typeof this.namesMax || this.gname === this.namesMax)
                && ("number" != typeof this.givensMax || "undefined" === typeof this.base.givens[this.gnameset] || "undefined" === typeof this.base.givens[this.gnameset][this.gname] || this.base.givens[this.gnameset][this.gname] === this.givensMax)) {

                maxed = true;
                if (this.debug) {
                    this.state.sys.print("    MAXED");
                }
            }
        } else if ("disExtraText" === this.modes[this.modeindex]) {
            this.base.disambiguate += 1;
            this.betterbase.disambiguate += 1;
        }
        return maxed;
    }

    initVars(akey: string): boolean {
        let i: number, ilen: number, myIds: string[], myItemBundles: any[], myItems: CslItem[];
        if (this.debug) {
            this.state.sys.print("[B] === initVars() ===");
        }
        this.lists = [];
        this.base = false;
        this.betterbase = false;
        this.akey = akey;

        this.maxNamesByItemId = {};

        myItemBundles = [];
        myIds = this.ambigcites[akey];
        if (!myIds || !myIds.length) {
            return false;
        }
        let myItem = this.state.refetchItem("" + myIds[0]);
        this.getCiteData(myItem);
        this.base = getAmbigConfig.call(this.state);
        if (myIds && myIds.length > 1) {
            myItemBundles.push([this.maxNamesByItemId[myItem.id], myItem]);
            for (let i = 1, ilen = myIds.length; i < ilen; i += 1) {
                myItem = this.state.refetchItem("" + myIds[i]);
                this.getCiteData(myItem, this.base);
                myItemBundles.push([this.maxNamesByItemId[myItem.id], myItem]);
            }
            myItemBundles.sort(
                function (a, b) {
                    if (a[0] > b[0]) {
                        return 1;
                    } else if (a[0] < b[0]) {
                        return -1;
                    } else {
                        if (a[1].id > b[1].id) {
                            return 1;
                        } else if (a[1].id < b[1].id) {
                            return -1;
                        } else {
                            return 0;
                        }
                    }
                }
            );
            myItems = [];
            for (let i = 0, ilen = myItemBundles.length; i < ilen; i += 1) {
                myItems.push(myItemBundles[i][1]);
            }
            this.lists.push([this.base, myItems]);
            this.Item = this.lists[0][1][0];
        } else {
            this.Item = this.state.refetchItem("" + myIds[0]);
        }

        this.modeindex = 0;
        if (this.state.citation.opt["disambiguate-add-names"] || true) {
            this.namesMax = this.maxNamesByItemId[this.Item.id][0];
        } else {
            let namesMax = this.base.names[0];
            for (let i = 1, ilen = this.base.names.length; i < ilen; i += 1) {
                namesMax = Math.max(namesMax, this.base.names.names[i]);
            }
        }

        this.padBase(this.base);
        this.padBase(this.betterbase);
        this.base.year_suffix = false;
        this.base.disambiguate = false;
        this.betterbase.year_suffix = false;
        this.betterbase.disambiguate = false;
        if (this.state.citation.opt["givenname-disambiguation-rule"] === "by-cite"
            && this.state.opt["disambiguate-add-givenname"]) {
            this.givensMax = 2;
        }
        return true;
    }

    padBase(base: any): void {
        for (let i = 0, ilen = base.names.length; i < ilen; i += 1) {
            if (!base.givens[i]) {
                base.givens[i] = [];
            }
            for (let j = 0, jlen = base.names[i]; j < jlen; j += 1) {
                if (!base.givens[i][j]) {
                    base.givens[i][j] = 0;
                }
            }
        }
    }

    configModes(): void {
        let dagopt: any, gdropt: any;
        this.modes = [];
        dagopt = this.state.opt["disambiguate-add-givenname"];
        gdropt = this.state.citation.opt["givenname-disambiguation-rule"];
        if (this.state.opt['disambiguate-add-names'] || (dagopt && gdropt === "by-cite")) {
            this.modes.push("disNames");
        }

        if (this.state.opt.development_extensions.prioritize_disambiguate_condition) {
            if (this.state.opt.has_disambiguate) {
                this.modes.push("disExtraText");
            }
            if (this.state.opt["disambiguate-add-year-suffix"]) {
                this.modes.push("disYears");
            }
        } else {
            if (this.state.opt["disambiguate-add-year-suffix"]) {
                this.modes.push("disYears");
            }
            if (this.state.opt.has_disambiguate) {
                this.modes.push("disExtraText");
            }
        }
    }

    getCiteData(Item: CslItem, base?: any): void {
        if (!this.maxNamesByItemId[Item.id]) {
            getAmbiguousCite.call(this.state, Item, base);
            base = getAmbigConfig.call(this.state);
            this.maxNamesByItemId[Item.id] = getMaxVals.call(this.state);
            this.state.registry.registry[Item.id].disambig.givens = this.state.tmp.disambig_settings.givens.slice();
            for (let i = 0, ilen = this.state.registry.registry[Item.id].disambig.givens.length; i < ilen; i += 1) {
                this.state.registry.registry[Item.id].disambig.givens[i] = this.state.tmp.disambig_settings.givens[i].slice();
            }
            this.namesetsMax = this.state.registry.registry[Item.id].disambig.names.length - 1;
            if (!this.base) {
                this.base = base;
                this.betterbase = cloneAmbigConfig(base);
            }
            if (base.names.length < this.base.names.length) {
                this.base = base;
            }
            for (let i = 0, ilen = base.names.length; i < ilen; i += 1) {
                if (base.names[i] > this.base.names[i]) {
                    this.base.givens[i] = base.givens[i].slice();
                    this.base.names[i] = base.names[i];
                    this.betterbase.names = this.base.names.slice();
                    this.betterbase.givens = this.base.givens.slice();
                    this.padBase(this.base);
                    this.padBase(this.betterbase);
                }
            }
            this.betterbase.givens = this.base.givens.slice();
            for (let j = 0, jlen = this.base.givens.length; j < jlen; j += 1) {
                this.betterbase.givens[j] = this.base.givens[j].slice();
            }
        }
    }

    captureStepToBase(): void {
        if (this.state.citation.opt["givenname-disambiguation-rule"] === "by-cite"
            && this.base.givens && this.base.givens.length) {
            if ("undefined" !== typeof this.base.givens[this.gnameset][this.gname]) {
                if (this.betterbase.givens.length < this.base.givens.length) {
                    this.betterbase.givens = JSON.parse(JSON.stringify(this.base.givens));
                }
                this.betterbase.givens[this.gnameset][this.gname] = this.base.givens[this.gnameset][this.gname];
            }
        }
        this.betterbase.names[this.gnameset] = this.base.names[this.gnameset];
    }
}
