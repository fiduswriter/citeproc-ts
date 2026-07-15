import { CSL } from '../csl';
/*global CSL: true */


CSL.Engine.prototype.getCitationLabel = function (this: any, Item: CslItem): string {
    let label = "";
    const params = this.getTrigraphParams();
    let config = params[0];
    let myname = this.getTerm("reference", "short", 0);
    if ("undefined" === typeof myname) {
        myname = "reference";
    }
    myname = myname.replace(".", "");
    myname = myname.slice(0, 1).toUpperCase() + myname.slice(1);
    for (let i = 0, ilen = CSL.NAME_VARIABLES.length; i < ilen; i += 1) {
        const n = CSL.NAME_VARIABLES[i];
        if (Item[n]) {
            const names = Item[n];
            if (names.length > params.length) {
                config = params[params.length - 1];
            } else {
                config = params[names.length - 1];
            }
            for (let j = 0, jlen = names.length; j < jlen; j += 1) {
                if (j === config.authors.length) {
                    break;
                }
                const res = this.nameOutput.getName(names[j], "locale-translit", true);
                const name = res.name;
                if (name && name.family) {
                    myname = name.family;
                    myname = myname.replace(/^([ \'\u2019a-z]+\s+)/, "");

                } else if (name && name.literal) {
                    myname = name.literal;
                }
                let m = myname.toLowerCase().match(/^(a\s+|the\s+|an\s+)/);
                if (m) {
                    myname = myname.slice(m[1].length);
                }
                myname = myname.replace(CSL.ROMANESQUE_NOT_REGEXP, "");
                if (!myname) {
                    break;
                }
                myname = myname.slice(0, config.authors[j]);
                if (myname.length > 1) {
                    myname = myname.slice(0, 1).toUpperCase() + myname.slice(1).toLowerCase();
                } else if (myname.length === 1) {
                    myname = myname.toUpperCase();
                }
                label += myname;
            }
            break;
        }
    }
    if (!label) {
        // Try for something using title
        if (Item.title) {
            const skipWords = this.locale[this.opt.lang].opts["skip-words"];
            let lst = Item.title.split(/\s+/);
            for (let i2 = lst.length - 1; i2 > -1; i2 -= 1) {
                if (skipWords.indexOf(lst[i2]) > -1) {
                    lst = lst.slice(0, i2).concat(lst.slice(i2 + 1));
                }
            }
            let str = lst.join("");
            str = str.slice(0, params[0].authors[0]);
            if (str.length > 1) {
                str = str.slice(0, 1).toUpperCase() + str.slice(1).toLowerCase();
            } else if (str.length === 1) {
                str = str.toUpperCase();
            }
            label = str;
        }
    }
    let year = "0000";
    if (Item.issued) {
        if (Item.issued.year) {
            year = "" + Item.issued.year;
        }
    }
    year = year.slice((config.year * -1));
    label = label + year;
    return label;
};

CSL.Engine.prototype.getTrigraphParams = function (this: any): any[] {
    const params: any[] = [];
    const ilst = this.opt.trigraph.split(":");
    if (!this.opt.trigraph || this.opt.trigraph.slice(0, 1) !== "A") {
        CSL.error("Bad trigraph definition: " + this.opt.trigraph);
    }
    for (let i = 0, ilen = ilst.length; i < ilen; i += 1) {
        let str = ilst[i];
        let config = { authors: [], year: 0 };
        for (let j = 0, jlen = str.length; j < jlen; j += 1) {
            switch (str.slice(j, j + 1)) {
            case "A":
                config.authors.push(1);
                break;
            case "a":
                config.authors[config.authors.length - 1] += 1;
                break;
            case "0":
                config.year += 1;
                break;
            default:
                CSL.error("Invalid character in trigraph definition: " + this.opt.trigraph);
            }
        }
        params.push(config);
    }
    return params;
};
