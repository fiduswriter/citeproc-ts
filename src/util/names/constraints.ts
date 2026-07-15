import { CSL } from '../../csl';

export function constrainNames(this: any): void {
    this.names_count = 0;
    let pos: any;
    for (let i = 0, ilen = this.variables.length; i < ilen; i += 1) {
        const v = this.variables[i];
        pos = this.nameset_base + i;
        if (this.freeters[v].length) {
            this.state.tmp.names_max.push(this.freeters[v].length, "literal");
            this._imposeNameConstraints(this.freeters, this.freeters_count, v, pos);
            this.names_count += this.freeters[v].length;
        }

        if (this.institutions[v].length) {
            this.state.tmp.names_max.push(this.institutions[v].length, "literal");
            this._imposeNameConstraints(this.institutions, this.institutions_count, v, pos);
            this.persons[v] = this.persons[v].slice(0, this.institutions[v].length);
            this.names_count += this.institutions[v].length;
        }

        for (let j = 0, jlen = this.persons[v].length; j < jlen; j += 1) {
            if (this.persons[v][j].length) {
                this.state.tmp.names_max.push(this.persons[v][j].length, "literal");
                this._imposeNameConstraints(this.persons[v], this.persons_count[v], j, pos);
                this.names_count += this.persons[v][j].length;
            }
        }
    }
};

export function _imposeNameConstraints(this: any, lst: any, count: any, key: any, pos: any): void {
    const display_names = lst[key];
    let discretionary_names_length = this.state.tmp["et-al-min"];

    if (this.state.tmp.suppress_decorations) {
        if (this.state.tmp.disambig_request && this.state.tmp.disambig_request.names[pos]) {
            discretionary_names_length = this.state.tmp.disambig_request.names[pos];
        } else if (count[key] >= this.etal_min) {
            discretionary_names_length = this.etal_use_first;
        }
    } else {
        if (this.state.tmp.disambig_request
            && this.state.tmp.disambig_request.names[pos] > this.etal_use_first) {

            if (count[key] < this.etal_min) {
                discretionary_names_length = count[key];
            } else {
                discretionary_names_length = this.state.tmp.disambig_request.names[pos];
            }
        } else if (count[key] >= this.etal_min) {
            discretionary_names_length = this.etal_use_first;
        }
        if (this.etal_use_last && discretionary_names_length > (this.etal_min - 2)) {
            discretionary_names_length = this.etal_min - 2;
        }
    }
    const sane = this.etal_min >= this.etal_use_first;
    const overlength = count[key] > discretionary_names_length;
    if (discretionary_names_length > count[key]) {
        discretionary_names_length = display_names.length;
    }
    if (sane && overlength) {
        if (this.etal_use_last) {
            lst[key] = display_names.slice(0, discretionary_names_length).concat(display_names.slice(-1));
        } else {
            lst[key] = display_names.slice(0, discretionary_names_length);
        }
    }
    this.state.tmp.disambig_settings.names[pos] = lst[key].length;
    this.state.disambiguate.padBase(this.state.tmp.disambig_settings);
};
