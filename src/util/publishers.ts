import { CSL } from '../csl';

export class PublisherOutput {
    state: CslState;
    group_tok: any;
    varlist: string[];
    and_blob: Record<string, any>;
    ["publisher-list"]: any[];
    ["publisher-place-list"]: any[];
    ["publisher-token"]: any;
    ["publisher-place-token"]: any;

    constructor(state: CslState, group_tok: any) {
        this.state = state;
        this.group_tok = group_tok;
        this.varlist = [];
    }

    render(): void {
        this.clearVars();
        this.composeAndBlob();
        this.composeElements();
        this.composePublishers();
        this.joinPublishers();
    }

    composeAndBlob(): void {
        this.and_blob = {};
        let and_term: any = false;
        if (this.group_tok.strings.and === "text") {
            and_term = this.state.getTerm("and");
        } else if (this.group_tok.strings.and === "symbol") {
            and_term = "&";
        }
        const tok = new CSL.Token();
        tok.strings.suffix = " ";
        tok.strings.prefix = " ";
        this.state.output.append(and_term, tok, true);
        const no_delim = this.state.output.pop();

        tok.strings.prefix = this.group_tok.strings["subgroup-delimiter"];
        this.state.output.append(and_term, tok, true);
        const with_delim = this.state.output.pop();

        this.and_blob.single = false;
        this.and_blob.multiple = false;
        if (and_term) {
            if (this.group_tok.strings["subgroup-delimiter-precedes-last"] === "always") {
                this.and_blob.single = with_delim;
            } else if (this.group_tok.strings["subgroup-delimiter-precedes-last"] === "never") {
                this.and_blob.single = no_delim;
                this.and_blob.multiple = no_delim;
            } else {
                this.and_blob.single = no_delim;
                this.and_blob.multiple = with_delim;
            }
        }
    }

    composeElements(): void {
        for (let i = 0, ilen = 2; i < ilen; i += 1) {
            const varname = ["publisher", "publisher-place"][i];
            for (let j = 0, jlen = this["publisher-list"].length; j < jlen; j += 1) {
                let str = this[varname + "-list"][j];
                const tok = this[varname + "-token"];
                this.state.output.append(str, tok, true);
                this[varname + "-list"][j] = this.state.output.pop();
            }
        }
    }

    composePublishers(): void {
        let blobs: any;
        for (let i = 0, ilen = this["publisher-list"].length; i < ilen; i += 1) {
            blobs = [this[this.varlist[0] + "-list"][i], this[this.varlist[1] + "-list"][i]];
            this["publisher-list"][i] = this._join(blobs, this.group_tok.strings.delimiter);
        }
    }

    joinPublishers(): void {
        let blobs = this["publisher-list"];
        const publishers = this._join(blobs, this.group_tok.strings["subgroup-delimiter"], this.and_blob.single, this.and_blob.multiple, this.group_tok);
        this.state.output.append(publishers, "literal");
    }

    _purgeEmptyBlobs(blobs: any[]): any[] {
        for (let i = blobs.length - 1; i > -1; i -= 1) {
            if (!blobs[i] || blobs[i].length === 0 || !blobs[i].blobs.length) {
                blobs = blobs.slice(0, i).concat(blobs.slice(i + 1));
            }
        }
        return blobs;
    }

    _join(blobs: any[], delimiter: string, finalJoin?: any, ..._extra: any[]): any {
        let i: number, ilen: number;
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
                let offset: number;
                if (finalJoin) {
                    offset = 1;
                } else {
                    offset = 0;
                }
                const blob = blobs.pop();
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
    }

    _getToken(tokenname: string): any {
        const token = this[tokenname];
        if (tokenname === "institution") {
            const newtoken = new CSL.Token();
            return newtoken;
        }
        return token;
    }

    clearVars(): void {
        this.state.tmp["publisher-list"] = false;
        this.state.tmp["publisher-place-list"] = false;
        this.state.tmp["publisher-group-token"] = false;
        this.state.tmp["publisher-token"] = false;
        this.state.tmp["publisher-place-token"] = false;
    }
}
