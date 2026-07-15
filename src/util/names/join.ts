import { CSL } from '../../csl';
/*global CSL: true */

CSL.NameOutput.prototype._purgeEmptyBlobs = function (this: any, blobs: any): any {
    for (let i = blobs.length - 1; i > -1; i -= 1) {
        if (!blobs[i] || blobs[i].length === 0 || !blobs[i].blobs.length) {
            blobs = blobs.slice(0, i).concat(blobs.slice(i + 1));
        }
    }
    return blobs;
};

CSL.NameOutput.prototype.joinPersons = function (this: any, blobs: any, pos: any, j?: any, tokenname?: any): any {
    let ret: any;
    blobs = this._purgeEmptyBlobs(blobs);
    if (!tokenname) {
        tokenname = "name";
    }
    if ("undefined" === typeof j) {
        if (this.etal_spec[pos].freeters === 1) {
            ret = this._joinEtAl(blobs);
        } else if (this.etal_spec[pos].freeters === 2) {
            ret = this._joinEllipsis(blobs);
        } else if (!this.state.tmp.sort_key_flag) {
            ret = this._joinAnd(blobs);
        } else {
            ret = this._join(blobs, this.state.inheritOpt(this.name, "delimiter", "name-delimiter", ", "));
        }
    } else {
        if (this.etal_spec[pos].persons[j] === 1) {
            ret = this._joinEtAl(blobs);
        } else if (this.etal_spec[pos].persons[j] === 2) {
            ret = this._joinEllipsis(blobs);
        } else if (!this.state.tmp.sort_key_flag) {
            ret = this._joinAnd(blobs);
        } else {
            ret = this._join(blobs, this.state.inheritOpt(this.name, "delimiter", "name-delimiter", ", "));
        }
    }
    return ret;
};


CSL.NameOutput.prototype.joinInstitutionSets = function (this: any, blobs: any, pos: any): any {
    let ret: any;
    blobs = this._purgeEmptyBlobs(blobs);
    if (this.etal_spec[pos].institutions === 1) {
        ret = this._joinEtAl(blobs, "institution");
    } else if (this.etal_spec[pos].institutions === 2) {
        ret = this._joinEllipsis(blobs, "institution");
    } else {
        ret = this._joinAnd(blobs);
    }
    return ret;
};


CSL.NameOutput.prototype.joinPersonsAndInstitutions = function (this: any, blobs: any): any {
    blobs = this._purgeEmptyBlobs(blobs);
    let ret = this._join(blobs, this.state.tmp.name_delimiter);
    ret.isInstitution = true;
    return ret;
};

CSL.NameOutput.prototype.joinFreetersAndInstitutionSets = function (this: any, blobs: any): any {
    blobs = this._purgeEmptyBlobs(blobs);
    let ret = this._join(blobs, "[never here]", this["with"].single, this["with"].multiple);
    return ret;
};

CSL.NameOutput.prototype._getAfterInvertedName = function (this: any, blobs: any, delimiter: any, finalJoin: any): any {
    if (finalJoin && blobs.length > 1) {
        if (this.state.inheritOpt(this.name, "delimiter-precedes-last") === "after-inverted-name") {
            var prevBlob = blobs[blobs.length - 2];
            if (prevBlob.blobs.length > 0 && prevBlob.blobs[0].isInverted) {
                finalJoin.strings.prefix = delimiter;
            }
        }
    }
    return finalJoin;
};

CSL.NameOutput.prototype._getAndJoin = function (this: any, blobs: any, delimiter: any): any {
    var finalJoin = false;
    if (blobs.length > 1) {
        var singleOrMultiple = "single";
        if (blobs.length > 2) {
            singleOrMultiple = "multiple";
        }
        if (blobs[blobs.length - 1].isInstitution) {
            finalJoin = this.institution.and[singleOrMultiple];
        } else {
            finalJoin = this.name.and[singleOrMultiple];
        }
        finalJoin = JSON.parse(JSON.stringify(finalJoin));
        finalJoin = this._getAfterInvertedName(blobs, delimiter, finalJoin);
    }
    return finalJoin;
};

CSL.NameOutput.prototype._joinEtAl = function (this: any, blobs: any): any {
    var delimiter = this.state.inheritOpt(this.name, "delimiter", "name-delimiter", ", ");
    var blob = this._join(blobs, delimiter);

    this.state.output.openLevel(this._getToken("name"));
    this.state.output.current.value().strings.delimiter = "";
    this.state.output.append(blob, "literal", true);
    if (blobs.length > 1) {
        this.state.output.append(this["et-al"].multiple, "literal", true);
    } else if (blobs.length === 1) {
        this.state.output.append(this["et-al"].single, "literal", true);
    }
    this.state.output.closeLevel();
    return this.state.output.pop();
};


CSL.NameOutput.prototype._joinEllipsis = function (this: any, blobs: any): any {
    var delimiter = this.state.inheritOpt(this.name, "delimiter", "name-delimiter", ", ");
    var finalJoin = false;
    if (blobs.length > 1) {
        var singleOrMultiple = "single";
        if (blobs.length > 2) {
            singleOrMultiple = "multiple";
        }
        finalJoin = JSON.parse(JSON.stringify(this.name.ellipsis[singleOrMultiple]));
        finalJoin = this._getAfterInvertedName(blobs, delimiter, finalJoin);

    }
    return this._join(blobs, delimiter, finalJoin);
};

CSL.NameOutput.prototype._joinAnd = function (this: any, blobs: any): any {
    var delimiter = this.state.inheritOpt(this.name, "delimiter", "name-delimiter", ", ");
    var finalJoin = this._getAndJoin(blobs, delimiter);
    return this._join(blobs, delimiter, finalJoin);
};


CSL.NameOutput.prototype._join = function (this: any, blobs: any, delimiter: any, finalJoin?: any): any {
    var i: number, ilen: number;
    if (!blobs) {
        return false;
    }
    blobs = this._purgeEmptyBlobs(blobs);
    if (!blobs.length) {
        return false;
    }
    if (blobs.length > 1) {
        if (blobs.length === 2) {
            if (!finalJoin) {
                blobs[0].strings.suffix += delimiter;
            } else {
                blobs = [blobs[0], finalJoin, blobs[1]];
            }
        } else {
            var offset: number;
            if (finalJoin) {
                offset = 1;
            } else {
                offset = 0;
            }
            var blob = blobs.pop();
            for (let i2 = 0, ilen = blobs.length - offset; i2 < ilen; i2 += 1) {
                blobs[i2].strings.suffix += delimiter;
            }
            blobs.push(finalJoin);
            blobs.push(blob);
        }
    }

    this.state.output.openLevel();

    for (let i = 0, ilen = blobs.length; i < ilen; i += 1) {
        this.state.output.append(blobs[i], false, true);
    }
    this.state.output.closeLevel();
    return this.state.output.pop();
};


CSL.NameOutput.prototype._getToken = function (this: any, tokenname: any): any {
    var token = this[tokenname];
    if (tokenname === "institution") {
        var newtoken = new CSL.Token();
        return newtoken;
    }
    return token;
};
