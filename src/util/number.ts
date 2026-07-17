import { CSL } from '../csl';

import { NumericBlob } from '../obj/number';
import { Token, Util_cloneToken } from '../obj/token';

import { LOOSE, LangPrefsMap, ROMAN_NUMERALS, SUFFIX_CHARS } from '../constants/core';
import { STATUTE_SUBDIV_STRINGS, STATUTE_SUBDIV_STRINGS_REVERSE } from '../constants/statute';
export function padding(num: string): string {
    let m = num.match(/\s*(-{0,1}[0-9]+)/);
    if (m) {
        let n = parseInt(m[1], 10);
        if (n < 0) {
            n = 99999999999999999999 + n;
        }
        num = "" + n;
        while (num.length < 20) {
            num = "0" + num;
        }
    }
    return num;
};

export class LongOrdinalizer {
    state: CslState;

    init(state: CslState) {
        this.state = state;
    }

    format(num: string | number, gender?: string) {
        if (typeof num === "number" && num < 10) {
            num = "0" + num;
        }
        let ret = CSL.Engine.getField(
            LOOSE, 
            this.state.locale[this.state.opt.lang].terms,
            "long-ordinal-" + num,
            "long", 
            0, 
            gender
        );
        if (!ret) {
            ret = this.state.fun.ordinalizer.format(num, gender);
        }
        this.state.tmp.cite_renders_content = true;
        return ret;
    }
}

export class Ordinalizer {
    state: CslState;
    suffixes: Record<string, Record<string | undefined, string[]>>;

    constructor(state: CslState) {
        this.state = state;
        this.suffixes = {};
    }

    init() {
        if (!this.suffixes[this.state.opt.lang]) {
            this.suffixes[this.state.opt.lang] = {};
            for (let i = 0, ilen = 3; i < ilen; i += 1) {
                let gender: string | undefined = [undefined, "masculine", "feminine"][i];
                this.suffixes[this.state.opt.lang][gender] = [];
                for (let j = 1; j < 5; j += 1) {
                    const ordinal = this.state.getTerm("ordinal-0" + j, "long", false, gender as any);
                    if ("undefined" === typeof ordinal) {
                        delete this.suffixes[this.state.opt.lang][gender];
                        break;
                    }
                    this.suffixes[this.state.opt.lang][gender].push(ordinal);
                }
            }
        }
    }

    format(num: string | number, gender?: string | number | boolean) {
        let str;
        num = parseInt("" + num, 10);
        str = "" + num;
        let suffix = "";
        const trygenders = [];
        if (gender) {
            trygenders.push(gender);
        }
        trygenders.push("neuter");
        if (this.state.locale[this.state.opt.lang].ord["1.0.1"]) {
            suffix = this.state.getTerm("ordinal", undefined, 0, gender as number | boolean);
            let trygender;
            for (let i = 0, ilen = trygenders.length; i < ilen; i += 1) {
                trygender = trygenders[i];
                const ordinfo = this.state.locale[this.state.opt.lang].ord["1.0.1"];
                if (ordinfo["whole-number"][str] && ordinfo["whole-number"][str][trygender]) {
                    suffix = this.state.getTerm(this.state.locale[this.state.opt.lang].ord["1.0.1"]["whole-number"][str][trygender], undefined, 0, gender as number | boolean);
                } else if (ordinfo["last-two-digits"][str.slice(str.length - 2)] && ordinfo["last-two-digits"][str.slice(str.length - 2)][trygender]) {
                    suffix = this.state.getTerm(this.state.locale[this.state.opt.lang].ord["1.0.1"]["last-two-digits"][str.slice(str.length - 2)][trygender], undefined, 0, gender as number | boolean);
                } else if (ordinfo["last-digit"][str.slice(str.length - 1)] && ordinfo["last-digit"][str.slice(str.length - 1)][trygender]) {
                    suffix = this.state.getTerm(this.state.locale[this.state.opt.lang].ord["1.0.1"]["last-digit"][str.slice(str.length - 1)][trygender], undefined, 0, gender as number | boolean);
                }
                if (suffix) {
                    break;
                }
            }
        } else {
            if (!gender) {
                gender = undefined;
            }
            const genderKey = gender as string | undefined;
            this.state.fun.ordinalizer.init();
            if ((num / 10) % 10 === 1 || (num > 10 && num < 20)) {
                suffix = this.suffixes[this.state.opt.lang][genderKey][3];
            } else if (num % 10 === 1 && num % 100 !== 11) {
                suffix = this.suffixes[this.state.opt.lang][genderKey][0];
            } else if (num % 10 === 2 && num % 100 !== 12) {
                suffix = this.suffixes[this.state.opt.lang][genderKey][1];
            } else if (num % 10 === 3 && num % 100 !== 13) {
                suffix = this.suffixes[this.state.opt.lang][genderKey][2];
            } else {
                suffix = this.suffixes[this.state.opt.lang][genderKey][3];
            }
        }
        str = str += suffix;
        return str;
    }
}

export class Romanizer {
    format(num: number) {
        let ret, pos, n, numstr, len;
        ret = "";
        if (num < 6000) {
            numstr = num.toString().split("");
            numstr.reverse();
            pos = 0;
            n = 0;
            len = numstr.length;
            for (let pos = 0; pos < len; pos += 1) {
                n = parseInt(numstr[pos], 10);
                ret = ROMAN_NUMERALS[pos][n] + ret;
            }
        }
        return ret;
    }
}

export class Suffixator {
    slist: string[];

    constructor(slist?: string) {
        if (!slist) {
            slist = SUFFIX_CHARS;
        }
        this.slist = slist.split(",");
    }

    format(N: number) {
        let X;
        N += 1;
        let key = "";
        do {
            X = ((N % 26) === 0) ? 26 : (N % 26);
            key = this.slist[X-1] + key;
            N = (N - X) / 26;
        } while ( N !== 0 );
        return key;
    }
}

export function processNumber(node: CslNode | false, ItemObject: Record<string, any>, variable: string) {
    let val;

    const me = this;

    const realVariable = variable;
    variable = (variable === "page-first") ? "page" : variable;

    let fullformAnd = ",\\s+and\\s+|\\s+and\\s+";
    if (this.opt.lang.slice(0, 2) !== "en") {
        fullformAnd += "|,\\s+" + this.getTerm("and") + "\\s+|\\s+" + this.getTerm("and") + "\\s+";
    }
    const symbolAnd = "\\s*&\\s*";
    const andRex = new RegExp("^" + symbolAnd+ "$");
    const joinerMatchRex = new RegExp("(" + symbolAnd + "|" + fullformAnd + "|;\\s+|,\\s+|\\s*\\\\*[\\-\\u2013]+\\s*)", "g");
    const joinerSplitRex = new RegExp("(?:" + symbolAnd + "|" + fullformAnd + "|;\\s+|,\\s+|\\s*\\\\*[\\-\\u2013]+\\s*)");

    // This guesses whether the symbol form is defined or not.
    // It's the best we can do, because when locales are built, all of the
    // holes are filled explictly with fallback values: the symbol form is never undefined.
    const localeAnd = this.getTerm("and");
    let localeAmpersand = this.getTerm("and", "symbol");
    if (localeAnd === localeAmpersand) {
        localeAmpersand = "&";
    }

    // XXXX shadow_numbers should carry an array of objects with
    // XXXX full data for each. The test of a number should be
    // XXXX a separate function, possibly supported by a splitter
    // XXXX method also used here. Keep code for each action in one place,
    // XXXX to prevent debugging from becoming a nightmare.

    // The capture pattern below would apply affixes to all sub-elements,
    // which is not what we want. Sub-elements should nest within, or
    // affixes should be edited. The latter is probably easier to handle.
    
    // values = [
    //   {
    //     label: "sec.",
    //     label-form: "plural",
    //     value: 100,
    //     styling: [object],
    //     numeric: true
    //     joiningSuffix: " & ",
    //   },
    //   {
    //     label: "sec.",
    //     label-form: "none",
    //     value: 103,
    //     styling: [object],
    //     numeric: true,
    //     joiningSuffix: ""
    //   }
    // ]
    
    function normalizeFieldValue(str, defaultLabel?) {
        str = str.trim();
        let m = str.match(/^([^ ]+)/);
        if (m && !STATUTE_SUBDIV_STRINGS[m[1]]) {
            let embeddedLabel = null;
            if (["locator", "locator-extra", "page"].indexOf(variable) > -1) {
                if (ItemObject.label) {
                    embeddedLabel = STATUTE_SUBDIV_STRINGS_REVERSE[ItemObject.label];
                } else {
                    embeddedLabel = "p.";
                }
            } else {
                embeddedLabel = STATUTE_SUBDIV_STRINGS_REVERSE[variable];
            }
            if (embeddedLabel) {
                str = embeddedLabel + " " + str;
            }
        }
        return str;
    }
    

    function composeNumberInfo(origLabel, label, val, joiningSuffix, parsePosition?) {
        joiningSuffix = joiningSuffix ? joiningSuffix : "";
        const info: any = {};

        if (!label && !STATUTE_SUBDIV_STRINGS_REVERSE[variable]) {
            label = "var:"+ variable;
        }

        if (label) {
            let m = label.match(/(\s*)([^\s]+)(\s*)/);
            if (realVariable === "page" && parsePosition === 0 && ["p.", "pp."].indexOf(m[2]) === -1) {
                info.gotosleepability = true;
                info.labelVisibility = true;
            } else {
                info.labelVisibility = false;
            }
            info.label = m[2];
            info.origLabel = origLabel;
            info.labelSuffix = m[3] ? m[3] : "";
            info.plural = 0;
        }
        
        let m = val.match(/^([0-9]*[a-zA-Z]+0*)?([0-9]+(?:[a-zA-Z]*|[-,a-zA-Z]+))$/);
        //let m = val.match(/^([0-9]*[a-zA-Z]0*)([0-9]+(?:[a-zA-Z]*|[-,a-zA-Z]+))$/);
        if (m) {
            info.particle = m[1] ? m[1] : "";
            info.value = m[2];
        } else {
            info.particle = "";
            info.value = val;
        }
        info.joiningSuffix = joiningSuffix.replace(/\s*-\s*/, "-");
        return info;
    }

    function fixupSubsections(elems) {
        // This catches things like p. 12a-c, recombining content to yield
        // numeric true despite the hyphen.
        for (let i=elems.length-2;i>-1;i-=2) {
            if (elems[i] === "-"
               && elems[i-1].match(/^(?:(?:[a-z]|[a-z][a-z]|[a-z][a-z][a-z]|[a-z][a-z][a-z][a-z])\.  *)*[0-9]+[,a-zA-Z]+$/)
               && elems[i+1].match(/^[,a-zA-Z]+$/)) {
                elems[i-1] = elems.slice(i-1,i+2).join("");
                elems = elems.slice(0,i).concat(elems.slice(i+2));
            }
        }
        return elems;
    }

    function parseString(str, defaultLabel) {
        defaultLabel = defaultLabel ? defaultLabel : "";
        
        str = normalizeFieldValue(str, defaultLabel);

        let jmrex, jsrex, mystr;
        if ("page" === variable) {
            if (str.indexOf("\u2013") > -1) {
                str = str.replace(/\u2013/g, "-");
            }
        }
        if (str.indexOf("\\-") > -1) {
            jmrex = new RegExp(joinerMatchRex.source.replace("\\-", ""));
            jsrex = new RegExp(joinerSplitRex.source.replace("\\-", ""));
            let lst = str.split("\\-");
            for (let i=0,ilen=lst.length;i<ilen;i++) {
                lst[i] = lst[i].replace(/\-/g, "\u2013");
            }
            mystr = lst.join("\\-");
            mystr = mystr.replace(/\\/g, "");
        } else {
            jmrex = joinerMatchRex;
            jsrex = joinerSplitRex;
            mystr = str;
        }
        // jmrex = joinerMatchRex;
        // jsrex = joinerSplitRex;
        
        // Split chunks and collate delimiters.
        let elems = [];
        let m = mystr.match(jmrex);
        if (m) {
            let lst = mystr.split(jsrex);
            for (let i=0, ilen=m.length; i<ilen; i++) {
                if (m[i].match(andRex)) {
                    if (lst[i].match(/[a-zA-Z]$/) && lst[i].match(/^[a-zA-Z]/)) {
                        m[i] = localeAmpersand;
                    } else {
                        m[i] = " " + localeAmpersand + " ";
                    }
                }
            }
            const recombine = false;
            for (let i in lst) {
                if (("" + lst[i]).replace(/^[a-z]\.\s+/, "").match(/[^\s0-9ivxlcmIVXLCM]/)) {
                    //recombine = true;
                    break;
                }
            }
            if (recombine) {
                elems = [mystr];
            } else {
                for (let i=0,ilen=lst.length-1; i<ilen; i++) {
                    elems.push(lst[i]);
                    elems.push(m[i]);
                }
                elems.push(lst[lst.length-1]);
                //print("ELEMS: "+elems);
                elems = fixupSubsections(elems);
                //print("  fixup: "+elems);
            }
        } else {
            elems = [mystr];
        }
        // Split elements within each chunk build list of value objects.
        let values = [];
        let label = defaultLabel;
        let origLabel = "";
        for (let i=0,ilen=elems.length;i<ilen;i += 2) {
            
            // AHA! HERE'S THE CULPRIT!!!
            // Words up to four characters are treated as honorary short-form labels.
            // Some valid labels are longer than four chars, so we stir those in explicitly
            
            let m = elems[i].match(/((?:^| )(?:[a-z]|[a-z][a-z]|[a-z][a-z][a-z]|[a-z][a-z][a-z][a-z]|subpara|subch|amend|bibliog|annot|illus|princ|intro|sched|subdiv|subsec)(?:\.| ) *)/g);
            if (m) {
                let lst = elems[i].split(/(?:(?:^| )(?:[a-z]|[a-z][a-z]|[a-z][a-z][a-z]|[a-z][a-z][a-z][a-z]|subpara|subch|amend|bibliog|annot|illus|princ|intro|sched|subdiv|subsec)(?:\.| ) *)/);
                // Head off disaster by merging parsed labels on non-numeric values into content
                for (let j=lst.length-1;j>0;j--) {
                    if (lst[j-1] && (!lst[j].match(/^[0-9]+([-;,:a-zA-Z]*)$/) || !lst[j-1].match(/^[0-9]+([-;,:a-zA-Z]*)$/))) {
                        lst[j-1] = lst[j-1] + m[j-1] + lst[j];
                        lst = lst.slice(0,j).concat(lst.slice(j+1));
                        m = m.slice(0,j-1).concat(m.slice(j));
                    }
                }
                // merge bad leading label into content
                if (m.length > 0) {
                    const slug = m[0].trim();
                    const notAlabel = !STATUTE_SUBDIV_STRINGS[slug]
                        || "undefined" === typeof me.getTerm(STATUTE_SUBDIV_STRINGS[slug])
                        || (["locator", "number", "locator-extra", "page"].indexOf(variable) === -1 && STATUTE_SUBDIV_STRINGS[slug] !== variable);
                    if (notAlabel) {
                        if (i === 0) {
                            m = m.slice(1);
                            lst[0] = lst[0] + " " + slug + " " + lst[1];
                            lst = lst.slice(0,1).concat(lst.slice(2));
                        }
                    } else {
                        origLabel = slug;
                    }
                }

                for (let j=0,jlen=lst.length; j<jlen; j++) {
                    if (lst[j] || j === (lst.length-1)) {
                        let filteredOrigLabel;
                        label = m[j-1] ? m[j-1] : label;
                        if (origLabel === label.trim()) {
                            filteredOrigLabel = "";
                        } else {
                            filteredOrigLabel = origLabel;
                        }
                        //var origLabel = j > 1 ? m[j-1] : "";
                        mystr = lst[j] ? lst[j].trim() : "";
                        if (j === (lst.length-1)) {
                            values.push(composeNumberInfo(filteredOrigLabel, label, mystr, elems[i+1], i));
                        } else {
                            values.push(composeNumberInfo(filteredOrigLabel, label, mystr, null, i));
                        }
                    }
                }
            } else {
                let filteredOrigLabel;
                if (origLabel === label.trim()) {
                    filteredOrigLabel = "";
                } else {
                    filteredOrigLabel = origLabel;
                }
                values.push(composeNumberInfo(filteredOrigLabel, label, elems[i], elems[i+1]));
            }
        }
        return values;
    }

    function setSpaces(values) {
        // Add space joins (is this really right?)
        for (let i=0,ilen=values.length-1;i<ilen;i++) {
            if (!values[i].joiningSuffix && values[i+1].label) {
                values[i].joiningSuffix = " ";
            }
        }
    }

    function fixNumericAndCount(values, i, currentLabelInfo) {
        const master = values[currentLabelInfo.pos];
        let val = values[i].value;
        const isEscapedHyphen = master.joiningSuffix === "\\-";
        if (val.particle && val.particle !== master.particle) {
            currentLabelInfo.collapsible = false;
        }
        const mVal = val.match(/^[0-9]+([-,:a-zA-Z]*)$/);
        const mCurrentLabel = master.value.match(/^(?:[0-9]+|[ixv]+)([-,:a-zA-Z]*|\-[\-0-9]+)$/);
        if (!val || !mVal || !mCurrentLabel || isEscapedHyphen) {
            currentLabelInfo.collapsible = false;
            if (!val || !mCurrentLabel) {
                currentLabelInfo.numeric = false;
            }
            if (isEscapedHyphen) {
                currentLabelInfo.count--;
            }
        }
        if ((mVal && mVal[1]) || (mCurrentLabel && mCurrentLabel[1])) {
            currentLabelInfo.collapsible = false;
        }
        if (undefined === values[i].collapsible) {
            for (let j=i,jlen=i+currentLabelInfo.count;j<jlen;j++) {
                if (isNaN(parseInt(values[j].value)) && !values[j].value.match(/^[ivxlcmIVXLCM]+$/)) {
                    values[j].collapsible = false;
                } else {
                    values[j].collapsible = true;
                }
            }
            currentLabelInfo.collapsible = values[i].collapsible;
        }
        const isCollapsible = currentLabelInfo.collapsible;
        for (let j=currentLabelInfo.pos,jlen=(currentLabelInfo.pos + currentLabelInfo.count); j<jlen; j++) {
            if (currentLabelInfo.count > 1 && isCollapsible) {
                values[j].plural = 1;
            }
            values[j].numeric = currentLabelInfo.numeric;
            values[j].collapsible = currentLabelInfo.collapsible;
        }
    }

    function fixLabelVisibility(values, groupStartPos, currentLabelInfo) {
        if (currentLabelInfo.label.slice(0, 4) !== "var:") {
            if (currentLabelInfo.pos === 0) {
                if (["locator", "number", "locator-extra", "page"].indexOf(variable) > -1) {
                    // Actually, shouldn't we do this always?
                    if ("undefined" === typeof me.getTerm(STATUTE_SUBDIV_STRINGS[currentLabelInfo.label])) {
                        values[currentLabelInfo.pos].labelVisibility = true;
                    }
                }
                // If there is an explicit
                // label embedded at the start of a field that
                // does not match the context, it should be
                // marked for rendering.
                if (["locator", "number", "locator-extra", "page"].indexOf(variable) === -1) {
                    if (STATUTE_SUBDIV_STRINGS[currentLabelInfo.label] !== variable) {
                        values[0].labelVisibility = true;
                    }
                }
            } else {
                // Also, mark initial mid-field labels for
                // rendering.
                //if (values[i-1].label !== values[i].label && currentLabelInfo.label.slice(0, 4) !== "var:") {
                values[currentLabelInfo.pos].labelVisibility = true;
                //}
            }
        }
    }
    
    function setPluralsAndNumerics(values) {
        if (values.length === 0) {
            return;
        }
        let groupStartPos = 0;
        let groupCount = 1;
        
        for (let i=1,ilen=values.length;i<ilen;i++) {
            const lastVal = values[i-1];
            const thisVal = values[i];
            if (lastVal.label === thisVal.label && lastVal.particle === lastVal.particle) {
                groupCount++;
            } else {
                const currentLabelInfo = JSON.parse(JSON.stringify(values[groupStartPos]));
                currentLabelInfo.pos = groupStartPos;
                currentLabelInfo.count = groupCount;
                currentLabelInfo.numeric = true;
                fixNumericAndCount(values, groupStartPos, currentLabelInfo);
                if (lastVal.label !== thisVal.label) {
                    fixLabelVisibility(values, groupStartPos, currentLabelInfo);
                }
                groupStartPos = i;
                groupCount = 1;
            }
        }
        // Not sure why this repetition is necessary?
        const currentLabelInfo = JSON.parse(JSON.stringify(values[groupStartPos]));
        currentLabelInfo.pos = groupStartPos;
        currentLabelInfo.count = groupCount;
        currentLabelInfo.numeric = true;
        fixNumericAndCount(values, groupStartPos, currentLabelInfo);
        fixLabelVisibility(values, groupStartPos, currentLabelInfo);
        if (values.length && values[0].numeric && variable.slice(0, 10) === "number-of-") {
            if (parseInt(ItemObject[realVariable], 10) > 1) {
                values[0].plural = 1;
            }
        }
    }        

    function stripHyphenBackslash(joiningSuffix) {
        return joiningSuffix.replace("\\-", "-");
    }

    function setStyling(values) {
        const masterNode = Util_cloneToken(node);
        const masterStyling = new Token();
        if (!me.tmp.just_looking) {
            // Per discussion @ https://discourse.citationstyles.org/t/formatting-attributes-and-hyphen/1518
            masterStyling.decorations = masterNode.decorations;
            masterNode.decorations = [];
            //for (let j=masterNode.decorations.length-1;j>-1;j--) {
            //    if (masterNode.decorations[j][0] === "@quotes") {
            //        // Add to styling
            //        masterStyling.decorations = masterStyling.decorations.concat(masterNode.decorations.slice(j, j+1));
            //        // Remove from node
            //        masterNode.decorations = masterNode.decorations.slice(0, j).concat(masterNode.decorations.slice(j+1));
            //    }
            //}
            masterStyling.strings.prefix = masterNode.strings.prefix;
            masterNode.strings.prefix = "";
            masterStyling.strings.suffix = masterNode.strings.suffix;
            masterNode.strings.suffix = "";
        }
        const masterLabel = values.length ? values[0].label : null;
        if (values.length) {
            for (let i=0,ilen=values.length; i<ilen; i++) {
                let val = values[i];
                // Clone node, make styling parameters on each instance sane.
                const newnode = Util_cloneToken(masterNode);
                newnode.gender = (node as CslNode).gender;
                if (masterLabel === val.label) {
                    newnode.formatter = (node as CslNode).formatter;
                }
                if (val.numeric) {
                    newnode.successor_prefix = val.successor_prefix;
                }
                newnode.strings.suffix = newnode.strings.suffix + stripHyphenBackslash(val.joiningSuffix);
                val.styling = newnode;
            }
            if (!me.tmp.just_looking) {
                if (values[0].value.slice(0,1) === "\"" && values[values.length-1].value.slice(-1) === "\"") {
                    values[0].value = values[0].value.slice(1);
                    values[values.length-1].value = values[values.length-1].value.slice(0,-1);
                    masterStyling.decorations.push(["@quotes", true as any]);
                }
            }
        }
        return masterStyling;
    }

    function checkTerm(variable, val) {
        let ret = true;
        if (["locator", "locator-extra", "page"].indexOf(variable) > -1) {
            let label;
            if (val.origLabel) {
                label = val.origLabel;
            } else {
                label = val.label;
            }
            ret = !!me.getTerm(STATUTE_SUBDIV_STRINGS[label]);
        }
        return ret;
    }

    function checkPage(variable, val) {
        return "page" === variable
            || (["locator", "locator-extra"].indexOf(variable) > -1 && (["p."].indexOf(val.label) > -1 || ["p."].indexOf(val.origLabel) > -1));
    }
    
    function fixupRangeDelimiter(variable, val, rangeDelimiter, isNumeric) {
        const isPage = checkPage(variable, val);
        const hasTerm = checkTerm(variable, val);
        if (hasTerm && rangeDelimiter === "-") {
            if (isNumeric) {
                if (isPage || ["locator", "locator-extra", "issue", "volume", "edition", "number"].indexOf(variable) > -1) {
                    rangeDelimiter = me.getTerm("page-range-delimiter");
                    if (!rangeDelimiter) {
                        rangeDelimiter = "\u2013";
                    }
                }
                if (variable === "collection-number") {
                    rangeDelimiter = me.getTerm("year-range-delimiter");
                    if (!rangeDelimiter) {
                        rangeDelimiter = "\u2013";
                    }
                }
            }
        }
        //if (rangeDelimiter === "\\-") {
        //    rangeDelimiter = "-";
        //}
        return rangeDelimiter;
    }

    function manglePageNumbers(values, i, currentInfo) {
        if (i<1) {
            return;
        }
        if (currentInfo.count !== 2) {
            return;
        }
        if (values[i-1].particle !== values[i].particle) {
            return;
        }
        if (values[i-1].joiningSuffix !== "-") {
            currentInfo.count = 1;
            return;
        }
        if (!me.opt["page-range-format"] && (parseInt(values[i-1].value, 10) > parseInt(values[i].value, 10))) {
            values[i-1].joiningSuffix = fixupRangeDelimiter(variable, values[i], values[i-1].joiningSuffix, true);
            return;
        }
        let val = values[i];

        const isPage = checkPage(variable, val);
        let str;
        if (isPage && !isNaN(parseInt(values[i-1].value)) && !isNaN(parseInt(values[i].value))) {
            str = values[i-1].particle + values[i-1].value + " - " + values[i].particle + values[i].value;
            str = me.fun.page_mangler(str);
        } else {
            // if (("" + values[i-1].value).match(/[0-9]$/) && ("" + values[i].value).match(/^[0-9]/)) {
            if (("" + values[i-1].value).match(/^([0-9]+|[ivxlcmIVXLCM]+)$/) && ("" + values[i].value).match(/^([0-9]+|[ivxlcmIVXLCM]+)$/)) {
                values[i-1].joiningSuffix = me.getTerm("page-range-delimiter");
            }
            str = values[i-1].value + stripHyphenBackslash(values[i-1].joiningSuffix) + values[i].value;
        }
        let m = str.match(/^((?:[0-9]*[a-zA-Z]+0*))?([0-9]+[a-z]*)(\s*[^0-9]+\s*)([-,a-zA-Z]?0*)([0-9]+[a-z]*)$/);
        // let m = str.match(/^((?:[0-9]*[a-zA-Z]+0*))?([0-9]+[a-z]*)(\s*[^0-9]+\s*)([-,a-zA-Z]?0*)([0-9]+[a-z]*)$/);
        if (m) {
            let rangeDelimiter = m[3];
            rangeDelimiter = fixupRangeDelimiter(variable, val, rangeDelimiter, values[i].numeric);
            values[i-1].particle = m[1];
            values[i-1].value = m[2];
            values[i-1].joiningSuffix = rangeDelimiter;
            values[i].particle = m[4];
            values[i].value = m[5];
        }
        currentInfo.count = 0;
    }
    
    function fixRanges(values) {

        if (!node) {
            return;
        }
        if (["page", "chapter-number", "collection-number", "edition", "issue", "number", "number-of-pages", "number-of-volumes", "volume", "locator", "locator-extra"].indexOf(variable) === -1) {
            return;
        }

        const currentInfo = {
            count: 0,
            label: null,
            lastHadRangeDelimiter: false
        };

        for (let i=0,ilen=values.length; i<ilen; i++) {
            let val = values[i];
            if (!val.collapsible) {
                currentInfo.count = 0;
                currentInfo.label = null;
                const isNumeric = val.numeric;
                val.joiningSuffix = fixupRangeDelimiter(variable, val, val.joiningSuffix, isNumeric);
            } else if (currentInfo.label === val.label && val.joiningSuffix === "-") {
                // So if there is a hyphen here, and none previous, reset to 1
                currentInfo.count = 1;
            } else if (currentInfo.label === val.label && val.joiningSuffix !== "-") {
                // If there is NO hyphen here, count up
                currentInfo.count++;
                if (currentInfo.count === 2) {
                    manglePageNumbers(values, i, currentInfo);
                }
            } else if (currentInfo.label !== val.label) {
                // If the label doesn't match and count is 2, process
                currentInfo.label = val.label;
                currentInfo.count = 1;
            } else {
                // Safety belt: label doesn't match and count is some other value, so reset to 1
                // This never happens, though.
                currentInfo.count = 1;
                currentInfo.label = val.label;
            }
        }
        // Finally clear, if needed
        if (currentInfo.count === 2) {
            manglePageNumbers(values, values.length-1, currentInfo);
        }
    }

    function setVariableParams(shadow_numbers, realVariable, values) {
        const obj = shadow_numbers[realVariable];
        if (values.length) {
            obj.numeric = values[0].numeric;
            obj.collapsible = values[0].collapsible;
            obj.plural = values[0].plural;
            obj.label = STATUTE_SUBDIV_STRINGS[values[0].label];
            if (variable === "number" && obj.label === "issue" && me.getTerm("number")) {
                obj.label = "number";
            }
        }
    }

    // Split out the labels and values.

    // short-circuit if object exists: if numeric, set styling, no other action
    if (node && this.tmp.shadow_numbers[realVariable] && this.tmp.shadow_numbers[realVariable].values.length) {
        let values = this.tmp.shadow_numbers[realVariable].values;
        fixRanges(values);
        //if (!this.tmp.shadow_numbers[variable].masterStyling && !this.tmp.just_looking) {
            this.tmp.shadow_numbers[realVariable].masterStyling = setStyling(values);
        //}
        return;
    }

    // info.styling = node;

    // This carries value, pluralization and numeric info for use in other contexts.
    // XXX We used to use one set of params for the entire variable value.
    // XXX Now params are set on individual objects, of which there may be several after parsing.
    if (!this.tmp.shadow_numbers[realVariable]) {
        this.tmp.shadow_numbers[realVariable] = {
            values:[]
        };
    }
    //this.tmp.shadow_numbers[variable].values = [];
    //this.tmp.shadow_numbers[variable].plural = 0;
    //this.tmp.shadow_numbers[variable].numeric = false;
    //this.tmp.shadow_numbers[variable].label = false;

    if (!ItemObject) {
        return;
    }

    // Possibly apply multilingual transform
    const languageRole = LangPrefsMap[variable];
    if (languageRole) {
        const localeType = this.opt["cite-lang-prefs"][languageRole][0];
        val = this.transform.getTextSubField(ItemObject, realVariable, "locale-"+localeType, true);
        val = val.name;
    } else {
        val = ItemObject[realVariable];
    }

    if (val && realVariable === "number" && ItemObject.type === "legal_case") {
        val = val.replace(/[\\]*-/g, "\\-");
    }

    // XXX HOLDING THIS
    // Apply short form ONLY if first element tests is-numeric=false
    if (val && this.sys.getAbbreviation) {
        // RefMe bug report: print("XX D'oh! (3): "+num);
        // true as the fourth argument suppresses update of the UI

        // No need for this.
        //val = ("" + val).replace(/^\"/, "").replace(/\"$/, "");
        let normval;
        if (this.sys.normalizeAbbrevsKey) {
            normval = this.sys.normalizeAbbrevsKey(realVariable, val);
        } else {
            normval = val;
        }
        const jurisdiction = this.transform.loadAbbreviation(ItemObject.jurisdiction, "number", normval, ItemObject.language);
        if (this.transform.abbrevs[jurisdiction].number) {
            if (this.transform.abbrevs[jurisdiction].number[normval]) {
                val = this.transform.abbrevs[jurisdiction].number[normval];
            } else {
                
                // *** This is terrible ***
                
                // Strings rendered via cs:number should not be added to the abbreviations
                // UI unless they test non-numeric. The test happens below.
                if ("undefined" !== typeof this.transform.abbrevs[jurisdiction].number[normval]) {
                    delete this.transform.abbrevs[jurisdiction].number[normval];
                }
            }
        }
    }

    //   {
    //     label: "sec.",
    //     labelForm: "plural",
    //     labelVisibility: true,
    //     value: 100,
    //     styling: [object],
    //     numeric: true
    //     joiningSuffix: " & ",
    //   },

    // Process only if there is a value.
    if ("undefined" !== typeof val && ("string" === typeof val || "number" === typeof val)) {
        if ("number" === typeof val) {
            val = "" + val;
        }
        const defaultLabel = STATUTE_SUBDIV_STRINGS_REVERSE[variable];

        if (this.tmp.shadow_numbers[realVariable].values.length === 0) {
            // XXX
            let values = parseString(val, defaultLabel);

            setSpaces(values);
            //print("setSpaces(): "+JSON.stringify(values, null, 2));

            setPluralsAndNumerics(values);
            //print("setPluralsAndNumerics(): "+JSON.stringify(values, null, 2));

            for (let obj of values) {
                if (!obj.numeric && obj.label) {
                    this.tmp.shadow_numbers[realVariable].labelForm = obj.labelForm;
                }
            }
            this.tmp.shadow_numbers[realVariable].values = values;
            // me.sys.print(JSON.stringify(values))

            if (node) {
                fixRanges(values);
                
                this.tmp.shadow_numbers[realVariable].masterStyling = setStyling(values);
                // me.sys.print("setStyling(): "+JSON.stringify(values, null, 2));
            }
            setVariableParams(this.tmp.shadow_numbers, realVariable, values);
        }
        
        // hack in support for non-numeric numerics like "91 Civ. 5442 (RPP)|91 Civ. 5471"
        const info = this.tmp.shadow_numbers[realVariable];
        if (variable === "number") {
            if (info.values.length === 1 && info.values[0].value.indexOf("|") > -1) {
                info.values[0].value = info.values[0].value.replace(/\|/g, ", ");
                info.values[0].numeric = true;
                info.values[0].plural = 1;
                info.values[0].collapsible = false;
                info.numeric = true;
                info.plural = 1;
                info.collapsible = false;
            }
        }
        if (info.values.length === 1) {
            if (info.values[0].value.match(/^[0-9]+(?:\/[0-9]+)+$/)) {
                info.values[0].numeric = true;
                info.values[0].plural = 0;
                info.values[0].collapsible = false;
                info.numeric = true;
                info.plural = 0;
                info.collapsible = false;
            }
        }
        if (variable === "page") {
            if (info.values.length > 0) {
                if (info.values[0].gotosleepability) {
                    info.labelForm = "short";
                }
            }
        }
        //this.sys.print("OK "+JSON.stringify(values, ["label", "origLabel", "labelSuffix", "particle", "collapsible", "value", "numeric", "joiningSuffix", "labelVisibility", "plural"], 2));
    }
};

export function outputNumericField(state: CslState, varname: string, itemID: string): void {

    state.output.openLevel(state.tmp.shadow_numbers[varname].masterStyling);
    const masterStyling = state.tmp.shadow_numbers[varname].masterStyling;
    const nums = state.tmp.shadow_numbers[varname].values;
    const masterLabel = nums.length ? nums[0].label : null;
    const labelForm = state.tmp.shadow_numbers[varname].labelForm;
    const tryStatic = state.tmp.group_context.tip.label_static;
    let embeddedLabelForm;
    if (labelForm) {
        embeddedLabelForm = labelForm;
    } else {
        embeddedLabelForm = "short";
        //labelForm = "short";
    }
    const labelCapitalizeIfFirst = state.tmp.shadow_numbers[varname].labelCapitalizeIfFirst;
    const labelDecorations = state.tmp.shadow_numbers[varname].labelDecorations;
    let lastLabelName = null;

    for (let i=0,ilen=nums.length;i<ilen;i++) {
        const num = nums[i];
        let label = "";
        let labelName;
        if (num.label) {
            if ('var:' === num.label.slice(0,4)) {
                labelName = num.label.slice(4);
            } else {
                labelName = STATUTE_SUBDIV_STRINGS[num.label];
            }
            if (labelName) {
                // Simplify this some day.
                if (num.label === masterLabel) {
                    if (tryStatic) {
                        label = state.getTerm(labelName, "static", num.plural);
                        if (label.indexOf("%s") === -1) {
                            label = "";
                        }
                    }
                    if (!label) {
                        label = state.getTerm(labelName, labelForm, num.plural);
                    }
                } else {
                    if (tryStatic) {
                        label = state.getTerm(labelName, "static", num.plural);
                        if (label.indexOf("%s") === -1) {
                            label = "";
                        }
                    }
                    if (!label) {
                        label = state.getTerm(labelName, embeddedLabelForm, num.plural);
                    }
                }
                if (labelCapitalizeIfFirst) {
                    label = CSL.Output.Formatters["capitalize-first"](state, label);
                }
            }
        }
        let labelPlaceholderPos = -1;
        if (label) {
            labelPlaceholderPos = label.indexOf("%s");
        }
        const numStyling = Util_cloneToken(num.styling);
        numStyling.formatter = num.styling.formatter;
        (numStyling as any).type = num.styling.type;
        (numStyling as any).num = num.styling.num;
        numStyling.gender = num.styling.gender;
        
        if (labelPlaceholderPos > 0 && labelPlaceholderPos < (label.length-2)) {
            numStyling.strings.prefix += label.slice(0,labelPlaceholderPos);
            numStyling.strings.suffix = label.slice(labelPlaceholderPos+2) + numStyling.strings.suffix;
        } else if (num.labelVisibility) {
            if (!label) {
                label = num.label;
                labelName = num.label;
            }
            if (labelPlaceholderPos > 0) {
                const prefixLabelStyling = new Token();
                prefixLabelStyling.decorations = labelDecorations;
                state.output.append(label.slice(0,labelPlaceholderPos), prefixLabelStyling);
            } else if (labelPlaceholderPos === (label.length-2) || labelPlaceholderPos === -1) {
                // And add a trailing delimiter.
                state.output.append(label+num.labelSuffix, "empty");
            }
        }
        CSL.UPDATE_GROUP_CONTEXT_CONDITION(state, masterStyling.strings.prefix, null, masterStyling, `${num.particle}${num.value}`);
        if (num.collapsible) {
            let blob;
            if (num.value.match(/^[1-9][0-9]*$/) && Number.isSafeInteger(parseInt(num.value, 10))) {
                blob = new NumericBlob(state, num.particle, parseInt(num.value, 10), numStyling, itemID);
            } else {
                blob = new NumericBlob(state, num.particle, num.value, numStyling, itemID);
            }
            if ("undefined" === typeof blob.gender) {
                blob.gender = state.locale[state.opt.lang]["noun-genders"][varname];
            }
            state.output.append(blob, "literal");
        } else {
            state.output.append(num.particle + num.value, numStyling);
        }
        if (labelPlaceholderPos === 0 && labelPlaceholderPos < (label.length-2)) {
            // Only and always if this is the last entry of this label
            if (lastLabelName === null) {
                lastLabelName = labelName;
            }
            if (labelName !== lastLabelName || i === (nums.length-1)) {
                const suffixLabelStyling = new Token();
                suffixLabelStyling.decorations = labelDecorations;
                state.output.append(label.slice(labelPlaceholderPos+2), suffixLabelStyling);
            }
        }
        lastLabelName = labelName;
        state.tmp.term_predecessor = true;
    }
    state.output.closeLevel();
};
