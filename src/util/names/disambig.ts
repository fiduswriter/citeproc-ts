import { CSL } from '../../csl';
// Disambiguate names (the number of names is controlled externally, by successive
// runs of the processor).

/*global CSL: true */

CSL.NameOutput.prototype.disambigNames = function (this: any): void {
    let pos: any;
    for (let i = 0, ilen = this.variables.length; i < ilen; i += 1) {
        const v = this.variables[i];
        pos = this.nameset_base + i;
        if (this.freeters[v].length) {
            this._runDisambigNames(this.freeters[v], pos);
        }
        if (this.institutions[v].length) {
            if ("undefined" === typeof this.state.tmp.disambig_settings.givens[pos]) {
                this.state.tmp.disambig_settings.givens[pos] = [];
            }
            for (let j = 0, jlen = this.institutions[v].length; j < jlen; j += 1) {
                if ("undefined" === typeof this.state.tmp.disambig_settings.givens[pos][j]) {
                    this.state.tmp.disambig_settings.givens[pos].push(2);
                }
            }
        }
        for (let j2 = 0, jlen2 = this.persons[v].length; j2 < jlen2; j2 += 1) {
            if (this.persons[v][j2].length) {
                this._runDisambigNames(this.persons[v][j2], pos);
            }
        }
    }
};

CSL.NameOutput.prototype._runDisambigNames = function (this: any, lst: any, pos: any): void {
    let chk: any, myform: any, myinitials: any, param: any, i: any, ilen: any, paramx: any;
    for (let i = 0, ilen = lst.length; i < ilen; i += 1) {
        if (!lst[i].given && !lst[i].family) {
            continue;
        }

        myinitials = this.state.inheritOpt(this.name, "initialize-with");
        this.state.registry.namereg.addname("" + this.Item.id, lst[i], i);
        chk = this.state.tmp.disambig_settings.givens[pos];
        if ("undefined" === typeof chk) {
            for (let j = 0, jlen = pos + 1; j < jlen; j += 1) {
                if (!this.state.tmp.disambig_settings.givens[j]) {
                    this.state.tmp.disambig_settings.givens[j] = [];
                }
            }
        }
        chk = this.state.tmp.disambig_settings.givens[pos][i];
        if ("undefined" === typeof chk) {
            myform = this.state.inheritOpt(this.name, "form", "name-form", "long");
            param = this.state.registry.namereg.evalname("" + this.Item.id, lst[i], i, 0, myform, myinitials);
            this.state.tmp.disambig_settings.givens[pos].push(param);
        }
        myform = this.state.inheritOpt(this.name, "form", "name-form", "long");
        paramx = this.state.registry.namereg.evalname("" + this.Item.id, lst[i], i, 0, myform, myinitials);
        if (this.state.tmp.disambig_request) {
            let val = this.state.tmp.disambig_settings.givens[pos][i];
            if (val === 1 &&
                this.state.citation.opt["givenname-disambiguation-rule"] === "by-cite" &&
                ("undefined" === typeof this.state.inheritOpt(this.name, "initialize-with")
                    || "undefined" === typeof lst[i].given)) {
                val = 2;
            }
            param = val;
            if (this.state.opt["disambiguate-add-givenname"] && lst[i].given) {
                param = this.state.registry.namereg.evalname("" + this.Item.id, lst[i], i, param, this.state.inheritOpt(this.name, "form", "name-form", "long"), this.state.inheritOpt(this.name, "initialize-with"));
            }
        } else {
            param = paramx;
        }
        if (!this.state.tmp.just_looking && this.item && this.item.position === CSL.POSITION_FIRST) {
            if (paramx > param) {
                param = paramx;
            }
        }
        if (!this.state.tmp.sort_key_flag) {
            this.state.tmp.disambig_settings.givens[pos][i] = param;
            if ("string" === typeof myinitials
                && ("undefined" === typeof this.name.strings["initialize"]
                    || true === this.name.strings["initialize"])) {

                this.state.tmp.disambig_settings.use_initials = true;
            }
        }
    }
};
