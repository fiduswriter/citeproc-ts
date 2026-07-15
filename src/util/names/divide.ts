import { CSL } from '../../csl';
/*global CSL: true */

CSL.NameOutput.prototype.divideAndTransliterateNames = function (this: any): void {
    var i: number, ilen: number, j: number, jlen: number;
    var Item = this.Item;
    var variables = this.variables;
    this.varnames = variables.slice();
    this.freeters = {};
    this.persons = {};
    this.institutions = {};
    for (let i = 0, ilen = variables.length; i < ilen; i += 1) {
        var v = variables[i];
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

CSL.NameOutput.prototype._normalizeVariableValue = function (this: any, Item: CslItem, variable: any): any {
    var names: any;
    if ("string" === typeof Item[variable] || "number" === typeof Item[variable]) {
        CSL.debug("name variable \"" + variable + "\" is string or number, not array. Attempting to fix.");
        names = [{ literal: Item[variable] + "" }];
    } else if (!Item[variable]) {
        names = [];
    } else if ("number" !== typeof Item[variable].length) {
        CSL.debug("name variable \"" + variable + "\" is object, not array. Attempting to fix.");
        Item[variable] = [Item[variable]];
        names = Item[variable].slice();
    } else {
        names = Item[variable].slice();
    }
    return names;
};

CSL.NameOutput.prototype._getFreeters = function (this: any, v: any, values: any): void {
    this.freeters[v] = [];
    if (this.state.opt.development_extensions.spoof_institutional_affiliations) {
        for (let i = values.length - 1; i > -1; i -= 1) {
            if (this.isPerson(values[i])) {
                var value = this._checkNickname(values.pop());
                if (value) {
                    this.freeters[v].push(value);
                }
            } else {
                break;
            }
        }
    } else {
        for (let i2 = values.length - 1; i2 > -1; i2 -= 1) {
            var value2 = values.pop();
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

CSL.NameOutput.prototype._getPersonsAndInstitutions = function (this: any, v: any, values: any): void {
    this.persons[v] = [];
    this.institutions[v] = [];
    if (!this.state.opt.development_extensions.spoof_institutional_affiliations) {
        return;
    }
    var persons = [];
    var has_affiliates = false;
    var first = true;
    for (let i = values.length - 1; i > -1; i -= 1) {
        if (this.isPerson(values[i])) {
            var value = this._checkNickname(values[i]);
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

CSL.NameOutput.prototype._clearValues = function (this: any, values: any): void {
    for (let i = values.length - 1; i > -1; i -= 1) {
        values.pop();
    }
};

CSL.NameOutput.prototype._checkNickname = function (this: any, name: any): any {
    if (["interview", "personal_communication"].indexOf(this.Item.type) > -1) {
        var author = "";
        author = CSL.Util.Names.getRawName(name);
        if (author && this.state.sys.getAbbreviation && !(this.item && this.item["suppress-author"])) {
            var normalizedKey = author;
            if (this.state.sys.normalizeAbbrevsKey) {
                normalizedKey = this.state.sys.normalizeAbbrevsKey("author", author);
            }
            this.state.transform.loadAbbreviation("default", "nickname", normalizedKey, this.Item.language);
            var myLocalName = this.state.transform.abbrevs["default"].nickname[normalizedKey];
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
