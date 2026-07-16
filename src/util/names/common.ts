import { NAME_PARTS } from '../../constants/core';
export function checkCommonAuthor(this: any, requireMatch: any): boolean {
    if (!requireMatch) {
        return false;
    }
    let common_term: any = false;
    if (this.variables.length === 2) {
        const variables = this.variables;
        const varnames = variables.slice();
        varnames.sort();
        common_term = varnames.join("");
    }
    if (!common_term) {
        return false;
    }
    let has_term = false;
    if (this.state.locale[this.state.opt.lang].terms[common_term]) {
        has_term = true;
    }
    if (!has_term) {
        this.state.tmp.done_vars.push(this.variables[0]);
        this.state.tmp.done_vars.push(this.variables[1]);
        return false;
    }
    const firstSet = this.Item[this.variables[0]];
    const secondSet = this.Item[this.variables[1]];
    const perfectMatch = this._compareNamesets(firstSet, secondSet);
    if (perfectMatch === true) {
        this.state.tmp.done_vars.push(this.variables[0]);
        this.state.tmp.done_vars.push(this.variables[1]);
    }
    return !perfectMatch;
};

export function setCommonTerm(this: any): void {
    const variables = this.variables;
    const varnames = variables.slice();
    varnames.sort();
    this.common_term = varnames.join("");
    if (!this.common_term) {
        return;
    }
    let has_term = false;
    if (this.label && this.label[this.variables[0]]) {
        if (this.label[this.variables[0]].before) {
            has_term = this.state.getTerm(this.common_term, this.label[this.variables[0]].before.strings.form, 0);
        } else if (this.label[this.variables[0]].after) {
            has_term = this.state.getTerm(this.common_term, this.label[this.variables[0]].after.strings.form, 0);
        }
    }

    if (!this.state.locale[this.state.opt.lang].terms[this.common_term]
        || !has_term
        || this.variables.length < 2) {
        this.common_term = false;
        return;
    }
    let freeters_offset = 0;
    for (let i = 0, ilen = this.variables.length - 1; i < ilen; i += 1) {
        const v = this.variables[i];
        const vv = this.variables[i + 1];
        if (this.freeters[v].length || this.freeters[vv].length) {
            if (this.etal_spec[v].freeters !== this.etal_spec[vv].freeters
                || !this._compareNamesets(this.freeters[v], this.freeters[vv])) {
                this.common_term = false;
                return;
            }
            freeters_offset += 1;
        }
        if (this.persons[v].length !== this.persons[vv].length) {
            this.common_term = false;
            return;
        }
        for (let j = 0, jlen = this.persons[v].length; j < jlen; j += 1) {
            if (this.etal_spec[v].persons[j] !== this.etal_spec[vv].persons[j]
                || !this._compareNamesets(this.persons[v][j], this.persons[vv][j])) {
                this.common_term = false;
                return;
            }
        }
    }
};

export function _compareNamesets(this: any, base_nameset: any, nameset: any): boolean {
    if (!base_nameset || !nameset || base_nameset.length !== nameset.length) {
        return false;
    }
    for (let i = 0, ilen = nameset.length; i < ilen; i += 1) {
        for (let j = 0, jlen = NAME_PARTS.length; j < jlen; j += 1) {
            const part = NAME_PARTS[j];
            if (!base_nameset[i] || base_nameset[i][part] != nameset[i][part]) {
                return false;
            }
        }
    }
    return true;
};
