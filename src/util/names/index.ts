import { CSL } from '../../csl';
import { _compareNamesets } from './common';

export const Util_Names: any = {};

Util_Names.compareNamesets = _compareNamesets;

/**
 * Un-initialize a name (quash caps after first character)
 */
Util_Names.unInitialize = function (state, name) {
    let i, ilen, namelist, punctlist, ret;
    if (!name) {
        return "";
    }
    namelist = name.split(/(?:\-|\s+)/);
    punctlist = name.match(/(\-|\s+)/g);
    ret = "";
    for (let i = 0, ilen = namelist.length; i < ilen; i += 1) {
        ret += namelist[i];
        if (i < ilen - 1) {
            ret += punctlist[i];
        }
    }
    return ret;
};

/**
 * Initialize a name.
 */
Util_Names.initializeWith = function (state, name, terminator, normalizeOnly) {
    let i, ilen, mm, lst, ret;
    if (!name) {
        return "";
    }
    if (!terminator) {
        terminator = "";
    }
    if (["Lord", "Lady"].indexOf(name) > -1
        || (!name.replace(/^(?:<[^>]+>)*/, "").match(CSL.STARTSWITH_ROMANESQUE_REGEXP)
            && !terminator.match("%s"))) {
        return name;
    }

    if (state.opt["initialize-with-hyphen"] === false) {
        name = name.replace(/\-/g, " ");
    }

    name = name.replace(/\s*\-\s*/g, "-").replace(/\s+/g, " ");
    name = name.replace(/-([a-z])/g, "\u2013$1");

    for (let i=name.length-2; i>-1; i += -1) {
        if (name.slice(i, i+1) === "." && name.slice(i+1, i+2) !== " ") {
            name = name.slice(0, i) + ". " + name.slice(i+1);
        }
    }

    const nameSplits = (CSL.Output.Formatters.nameDoppel as any).split(name);
    let namelist = [];
    namelist = [nameSplits.strings[0]];

    if (nameSplits.tags.length === 0) {
        const mmm = namelist[0].match(/[^\.]+$/);
        if (mmm && mmm[0].length === 1 && mmm[0] !== mmm[0].toLowerCase()) {
            namelist[0] += ".";
        }
    }

    for (let i = 1, ilen = nameSplits.strings.length; i < ilen; i += 1) {
        namelist.push(nameSplits.tags[i - 1]);
        namelist.push(nameSplits.strings[i]);
    }

    if (normalizeOnly) {
        ret = this.doNormalize(state, namelist, terminator);
    } else {
        ret = this.doInitialize(state, namelist, terminator);
    }
    ret = ret.replace(/\u2013([a-z])/g, "-$1");
    return ret;
};

Util_Names.notag = function(str) {
    return str.replace(/^(?:<[^>]+>)*/, "");
};

Util_Names.mergetag = function(state, tagstr, newstr) {
    let m = tagstr.match(/(?:-*<[^>]+>-*)/g);
    if (!m) {
        return newstr;
    } else {
        tagstr = m.join("");
    }
    m = newstr.match(/^(.*[^\s])*(\s+)$/);
    if (m) {
        m[1] = m[1] ? m[1] : "";
        newstr = m[1] + tagstr + m[2];
    } else {
        newstr = newstr + tagstr;
    }
    return newstr;
};

Util_Names.tagonly = function(state, str) {
    let m = str.match(/(?:<[^>]+>)+/);
    if (!m) {
        return str;
    } else {
        return m.join("");
    }
};

Util_Names.doNormalize = function (state, namelist, terminator) {
    let i, ilen;
    terminator = terminator ? terminator : "";
    const isAbbrev = [];
    for (let i = 0, ilen = namelist.length; i < ilen; i += 1) {
        if (this.notag(namelist[i]).length > 1 && this.notag(namelist[i]).slice(-1) === ".") {
            namelist[i] = namelist[i].replace(/^(.*)\.(.*)$/, "$1$2");
            isAbbrev.push(true);
        } else if (namelist[i].length === 1 && namelist[i].toUpperCase() === namelist[i]) {
            isAbbrev.push(true);
        } else {
            isAbbrev.push(false);
        }
    }
    for (let i = 0, ilen = namelist.length; i < ilen; i += 2) {
        if (isAbbrev[i]) {
            if (i < namelist.length - 2) {
                namelist[i + 1] = this.tagonly(state, namelist[i+1]);
                if (!isAbbrev[i+2]) {
                    namelist[i + 1] = this.tagonly(state, namelist[i+1]) + " ";
                }
                if (namelist[i + 2].length > 1) {
                    namelist[i+1] = terminator.replace(/\ufeff$/, "") + namelist[i+1];
                } else {
                    namelist[i+1] = this.mergetag(state, namelist[i+1], terminator);
                }
            }
            if (i === namelist.length - 1) {
                namelist[i] = namelist[i] + terminator;
            }
        }
    }
    return namelist.join("").replace(/[\u0009\u000a\u000b\u000c\u000d\u0020\ufeff\u00a0]+$/,"").replace(/\s*\-\s*/g, "-").replace(/[\u0009\u000a\u000b\u000c\u000d\u0020]+/g, " ");
};

Util_Names.doInitialize = function (state, namelist, terminator) {
    let i, ilen, m, j, jlen, lst, n;
    for (let i = 0, ilen = namelist.length; i < ilen; i += 2) {
        n = namelist[i];
        if (!n) {
            continue;
        }
        m = n.match(CSL.NAME_INITIAL_REGEXP);
        if (!m && (!n.match(CSL.STARTSWITH_ROMANESQUE_REGEXP) && n.length > 1 && terminator.match("%s"))) {
            m = n.match(/(.)(.*)/);
        }
        if (m && m[2] && m[3]) {
            m[1] = m[1] + m[2];
            m[2] = "";
        }
        if (m && m[1].slice(0, 1) === m[1].slice(0, 1).toUpperCase()) {
            let extra = "";
            if (m[2]) {
                let s = "";
                lst = m[2].split("");
                for (let j = 0, jlen = lst.length; j < jlen; j += 1) {
                    const c = lst[j];
                    if (c === c.toUpperCase()) {
                        s += c;
                    } else {
                        break;
                    }
                }
                if (s.length < m[2].length) {
                    extra = CSL.toLocaleLowerCase.call(state, s);
                }
            }
            namelist[i] = m[1] + extra;
            if (i < (ilen - 1)) {
                if (terminator.match("%s")) {
                    namelist[i] = terminator.replace("%s", namelist[i]);
                } else {
                    if (namelist[i + 1].indexOf("-") > -1) {
                        namelist[i + 1] = this.mergetag(state, namelist[i+1].replace("-", ""), terminator) + "-";
                    } else {
                        namelist[i + 1] = this.mergetag(state, namelist[i+1], terminator);
                    }
                }
            } else {
                if (terminator.match("%s")) {
                    namelist[i] = terminator.replace("%s", namelist[i]);
                } else {
                    namelist.push(terminator);
                }
            }
        } else if (n.match(CSL.ROMANESQUE_REGEXP) && (!m || !m[3])) {
            namelist[i] = " " + n;
        }
    }
    let ret = namelist.join("");
    ret = ret.replace(/[\u0009\u000a\u000b\u000c\u000d\u0020\ufeff\u00a0]+$/,"").replace(/\s*\-\s*/g, "-").replace(/[\u0009\u000a\u000b\u000c\u000d\u0020]+/g, " ");
    return ret;
};

Util_Names.getRawName = function (name) {
    let ret = [];
    if (name.literal) {
        ret.push(name.literal);
    } else {
        if (name.given) {
            ret.push(name.given);
        }
        if (name.family) {
            ret.push(name.family);
        }
    }
    return ret.join(" ");
};
