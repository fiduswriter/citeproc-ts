import { CSL } from '../../csl';

export function truncatePersonalNameLists(this: any): void {
    let v: any, i: number, ilen: number, j: number, jlen: number, chopvar: any, values: any;
    this.freeters_count = {};
    this.persons_count = {};
    this.institutions_count = {};
    for (let v in this.freeters) {
        if (this.freeters.hasOwnProperty(v)) {
            this.freeters_count[v] = this.freeters[v].length;
            this.freeters[v] = this._truncateNameList(this.freeters, v);
        }
    }

    for (let v in this.persons) {
        if (this.persons.hasOwnProperty(v)) {
            this.institutions_count[v] = this.institutions[v].length;
            this._truncateNameList(this.institutions, v);
            this.persons[v] = this.persons[v].slice(0, this.institutions[v].length);
            this.persons_count[v] = [];
            for (let j = 0, jlen = this.persons[v].length; j < jlen; j += 1) {
                this.persons_count[v][j] = this.persons[v][j].length;
                this.persons[v][j] = this._truncateNameList(this.persons, v, j);
            }
        }
    }
    if (this.state.opt.development_extensions.etal_min_etal_usefirst_hack
        && this.etal_min === 1 && this.etal_use_first === 1
        && !(this.state.tmp.extension
            || this.state.tmp.just_looking)) {
        chopvar = v;
    } else {
        chopvar = false;
    }
    if (chopvar || this._please_chop) {
        for (let i = 0, ilen = this.variables.length; i < ilen; i += 1) {
            v = this.variables[i];
            if (this.freeters[v].length) {
                if (this._please_chop === v) {
                    this.freeters[v] = this.freeters[v].slice(1);
                    this.freeters_count[v] += -1;
                    this._please_chop = false;
                } else if (chopvar && !this._please_chop) {
                    this.freeters[v] = this.freeters[v].slice(0, 1);
                    this.freeters_count[v] = 1;
                    this.institutions[v] = [];
                    this.persons[v] = [];
                    this._please_chop = chopvar;
                }
            }
            for (let j2 = 0, jlen2 = this.persons[v].length; j2 < jlen2; j2 += 1) {
                if (this.persons[v][j2].length) {
                    if (this._please_chop === v) {
                        this.persons[v][j2] = this.persons[v][j2].slice(1);
                        this.persons_count[v][j2] += -1;
                        this._please_chop = false;
                        break;
                    } else if (chopvar && !this._please_chop) {
                        this.freeters[v] = this.persons[v][j2].slice(0, 1);
                        this.freeters_count[v] = 1;
                        this.institutions[v] = [];
                        this.persons[v] = [];
                        values = [];
                        this._please_chop = chopvar;
                        break;
                    }
                }
            }
            if (this.institutions[v].length) {
                if (this._please_chop === v) {
                    this.institutions[v] = this.institutions[v].slice(1);
                    this.institutions_count[v] += -1;
                    this._please_chop = false;
                } else if (chopvar && !this._please_chop) {
                    this.institutions[v] = this.institutions[v].slice(0, 1);
                    this.institutions_count[v] = 1;
                    values = [];
                    this._please_chop = chopvar;
                }
            }
        }
    }

    for (let i = 0, ilen = this.variables.length; i < ilen; i += 1) {
        if (this.institutions[v].length) {
            this.nameset_offset += 1;
        }
        for (let j3 = 0, jlen3 = this.persons[v].length; j3 < jlen3; j3 += 1) {
            if (this.persons[v][j3].length) {
                this.nameset_offset += 1;
            }
        }
    }
};

export function _truncateNameList(this: any, container: any, variable: any, index?: any): any {
    let lst: any;
    if ("undefined" === typeof index) {
        lst = container[variable];
    } else {
        lst = container[variable][index];
    }
    if (this.state[this.state[this.state.tmp.area].root].opt.max_number_of_names
        && lst.length > 50
        && lst.length > (this.state[this.state[this.state.tmp.area].root].opt.max_number_of_names + 2)) {

        const limit = this.state[this.state[this.state.tmp.area].root].opt.max_number_of_names;
        lst = lst.slice(0, limit + 1).concat(lst.slice(-1));
    }
    return lst;
};
