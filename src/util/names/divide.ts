import { getRawName } from './index';

import { debug } from '../../logger';
export function divideAndTransliterateNames(this: any): void {
    let i: number, ilen: number, j: number, jlen: number;
    const Item = this.Item;
    const variables = this.variables;
    this.varnames = variables.slice();
    this.freeters = {};
    this.persons = {};
    this.institutions = {};
    for (let i = 0, ilen = variables.length; i < ilen; i += 1) {
        const v = variables[i];
        this.variable_offset[v] = this.nameset_offset;
        let values = this._normalizeVariableValue(Item, v);
        if (this.name.strings["suppress-min"] && values.length >= this.name.strings["suppress-min"]) {
            values = [];
        }
        if (this.name.strings["suppress-max"] && values.length <= this.name.strings["suppress-max"]) {
            values = [];
        }
        this._getFreeters(v, values);
        this._getPersonsAndInstitutions(v, values);
        if (this.state.opt.development_extensions.spoof_institutional_affiliations) {
            if (this.name.strings["suppress-min"] === 0) {
                this.freeters[v] = [];
                for (let j = 0, jlen = this.persons[v].length; j < jlen; j += 1) {
                    this.persons[v][j] = [];
                }
            } else if (this.institution.strings["suppress-min"] === 0) {
                this.institutions[v] = [];
                this.freeters[v] = this.freeters[v].concat(this.persons[v]);
                for (let j = 0, jlen = this.persons[v].length; j < jlen; j += 1) {
                    for (let k = 0, klen = this.persons[v][j].length; k < klen; k += 1) {
                        this.freeters[v].push(this.persons[v][j][k]);
                    }
                }
                this.persons[v] = [];
            }
        }
    }
};

export function _normalizeVariableValue(this: any, Item: CslItem, variable: any): any {
    let names: any;
    if ("string" === typeof Item[variable] || "number" === typeof Item[variable]) {
        debug("name variable \"" + variable + "\" is string or number, not array. Attempting to fix.");
        names = [{ literal: Item[variable] + "" }];
    } else if (!Item[variable]) {
        names = [];
    } else if ("number" !== typeof Item[variable].length) {
        debug("name variable \"" + variable + "\" is object, not array. Attempting to fix.");
        Item[variable] = [Item[variable]];
        names = Item[variable].slice();
    } else {
        names = Item[variable].slice();
    }
    return names;
};

export function _getFreeters(this: any, v: any, values: any): void {
    this.freeters[v] = [];
    if (this.state.opt.development_extensions.spoof_institutional_affiliations) {
        for (let i = values.length - 1; i > -1; i -= 1) {
            if (this.isPerson(values[i])) {
                const value = this._checkNickname(values.pop());
                if (value) {
                    this.freeters[v].push(value);
                }
            } else {
                break;
            }
        }
    } else {
        for (let i2 = values.length - 1; i2 > -1; i2 -= 1) {
            let value2 = values.pop();
            if (this.isPerson(value2)) {
                value2 = this._checkNickname(value2);
            }
            this.freeters[v].push(value2);
        }
    }
    this.freeters[v].reverse();
    if (this.freeters[v].length) {
        this.nameset_offset += 1;
    }
};

export function _getPersonsAndInstitutions(this: any, v: any, values: any): void {
    this.persons[v] = [];
    this.institutions[v] = [];
    if (!this.state.opt.development_extensions.spoof_institutional_affiliations) {
        return;
    }
    let persons = [];
    let has_affiliates = false;
    let first = true;
    for (let i = values.length - 1; i > -1; i -= 1) {
        if (this.isPerson(values[i])) {
            const value = this._checkNickname(values[i]);
            if (value) {
                persons.push(value);
            }
        } else {
            has_affiliates = true;
            this.institutions[v].push(values[i]);
            if (!first) {
                persons.reverse();
                this.persons[v].push(persons);
                persons = [];
            }
            first = false;
        }
    }
    if (has_affiliates) {
        persons.reverse();
        this.persons[v].push(persons);
        this.persons[v].reverse();
        this.institutions[v].reverse();
    }
};

export function _clearValues(this: any, values: any): void {
    for (let i = values.length - 1; i > -1; i -= 1) {
        values.pop();
    }
};

export function _checkNickname(this: any, name: any): any {
    if (["interview", "personal_communication"].indexOf(this.Item.type) > -1) {
        let author = "";
        author = getRawName(name);
        if (author && this.state.sys.getAbbreviation && !(this.item && this.item["suppress-author"])) {
            let normalizedKey = author;
            if (this.state.sys.normalizeAbbrevsKey) {
                normalizedKey = this.state.sys.normalizeAbbrevsKey("author", author);
            }
            this.state.transform.loadAbbreviation("default", "nickname", normalizedKey, this.Item.language);
            const myLocalName = this.state.transform.abbrevs["default"].nickname[normalizedKey];
            if (myLocalName) {
                if (myLocalName === "!here>>>") {
                    name = false;
                } else {
                    name = { family: myLocalName, given: "" };
                }
            }
        }
    }
    return name;
};
