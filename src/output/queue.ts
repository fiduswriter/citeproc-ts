import { CSL } from '../csl';
/*global CSL: true */

import { END, SEEN, SINGLETON, START, SUCCESSOR, SUPPRESS, TERMINAL_PUNCTUATION } from '../constants/core';
import { ROMANESQUE_REGEXP } from '../constants/regex';
import { error } from '../logger';
import { Blob } from '../obj/blob';
export class Queue {
    public levelname: string[];
    public state: CslState;
    public queue: Blob[];
    public empty: any;
    public formats: any;
    public current: any;
    public last_char_rendered: string;
    public checkNestedBrace?: { update(str: string): string };

    constructor(state: CslState) {
        this.levelname = ["top"];
        this.state = state;
        this.queue = [];
        this.empty = new CSL.Token("empty");
        const tokenstore: Record<string, any> = {};
        tokenstore.empty = this.empty;
        this.formats = new CSL.Stack(tokenstore);
        this.current = new CSL.Stack(this.queue);
    }

    pop() {
        const drip = this.current.value();
        if (drip.length) {
            return drip.pop();
        } else {
            return drip.blobs.pop();
        }
    }

    getToken(name: string) {
        const ret = this.formats.value()[name];
        return ret;
    }

    mergeTokenStrings(base: string, modifier: string) {
        let base_token, modifier_token, ret, key;
        base_token = this.formats.value()[base];
        modifier_token = this.formats.value()[modifier];
        ret = base_token;
        if (modifier_token) {
            if (!base_token) {
                base_token = new CSL.Token(base, SINGLETON);
                base_token.decorations = [];
            }
            ret = new CSL.Token(base, SINGLETON);
            let key = "";
            for (let key in base_token.strings) {
                if (base_token.strings.hasOwnProperty(key)) {
                    ret.strings[key] = base_token.strings[key];
                }
            }
            for (let key in modifier_token.strings) {
                if (modifier_token.strings.hasOwnProperty(key)) {
                    ret.strings[key] = modifier_token.strings[key];
                }
            }
            ret.decorations = base_token.decorations.concat(modifier_token.decorations);
        }
        return ret;
    }

    addToken(name: string, modifier: string, token: any) {
        let newtok: any, attr: string;
        newtok = new CSL.Token("output");
        if ("string" === typeof token) {
            token = this.formats.value()[token];
        }
        if (token && token.strings) {
            for (let attr in token.strings) {
                if (token.strings.hasOwnProperty(attr)) {
                    newtok.strings[attr] = token.strings[attr];
                }
            }
            newtok.decorations = token.decorations;
        }
        if ("string" === typeof modifier) {
            newtok.strings.delimiter = modifier;
        }
        this.formats.value()[name] = newtok;
    }

    pushFormats(tokenstore?: Record<string, any>) {
        if (!tokenstore) {
            tokenstore = {};
        }
        tokenstore.empty = this.empty;
        this.formats.push(tokenstore);
    }

    popFormats() {
        this.formats.pop();
    }

    startTag(name: string, token: any) {
        const tokenstore: Record<string, any> = {};
        if (this.state.tmp["doing-macro-with-date"] && this.state.tmp.extension) {
            token = this.empty;
            name = "empty";
        }
        tokenstore[name] = token;
        this.pushFormats(tokenstore);
        this.openLevel(name);
    }

    endTag(name: string) {
        this.closeLevel(name);
        this.popFormats();
    }

    openLevel(token?: any) {
        let blob, curr;
        if ("object" === typeof token) {
            blob = new CSL.Blob(undefined, token);
        } else if ("undefined" === typeof token) {
            blob = new CSL.Blob(undefined, this.formats.value().empty, "empty");
        } else {
            if (!this.formats.value() || !this.formats.value()[token]) {
                error("CSL processor error: call to nonexistent format token \"" + token + "\"");
            }
            blob = new CSL.Blob(undefined, this.formats.value()[token], token);
        }
        curr = this.current.value();
        if (!this.state.tmp.just_looking && this.checkNestedBrace) {
            blob.strings.prefix = this.checkNestedBrace.update(blob.strings.prefix);
        }
        curr.push(blob);
        this.current.push(blob);
    }

    closeLevel(name?: string) {
        if (name && name !== this.current.value().levelname) {
            error("Level mismatch error:  wanted " + name + " but found " + this.current.value().levelname);
        }
        const blob = this.current.pop();
        if (!this.state.tmp.just_looking && this.checkNestedBrace) {
            blob.strings.suffix = this.checkNestedBrace.update(blob.strings.suffix);
        }
    }

    append(str: string | number | boolean | Blob | undefined, tokname?: string | any, notSerious?: boolean, ignorePredecessor?: boolean, noStripPeriods?: boolean): boolean {
        let token, blob, curr;
        let useblob = true;
        if (notSerious) {
            ignorePredecessor = true;
        }
        if (this.state.tmp["doing-macro-with-date"] && !notSerious) {
            if (tokname !== "macro-with-date") {
                return false;
            }
            if (tokname === "macro-with-date") {
                tokname = "empty";
            }
        }
        if ("undefined" === typeof str) {
            return false;
        }
        if ("number" === typeof str) {
            str = "" + str;
        }
        if (!notSerious 
            && this.state.tmp.element_trace 
            && this.state.tmp.element_trace.value() === "suppress-me") {
            
            return false;
        }
        blob = false;
        if (!tokname) {
            token = this.formats.value().empty;
        } else if (tokname === "literal") {
            token = true;
            useblob = false;
        } else if ("string" === typeof tokname) {
            token = this.formats.value()[tokname];
        } else {
            token = tokname;
        }
        if (!token) {
            error("CSL processor error: unknown format token name: " + tokname);
        }
        if (token.strings && "undefined" === typeof token.strings.delimiter) {
            token.strings.delimiter = "";
        }
        if ("string" === typeof str && str.length) {
            str = str.replace(/ ([:;?!\u00bb])/g, "\u202f$1").replace(/\u00ab /g, "\u00ab\u202f");
            this.last_char_rendered = str.slice(-1);
            str = str.replace(/\s+'/g, " \'");
            if (!notSerious) {
                str = str.replace(/^'/g, " \'");
            }
            if (!ignorePredecessor) {
                this.state.tmp.term_predecessor = true;
                this.state.tmp.in_cite_predecessor = true;
            } else if (notSerious) {
                this.state.tmp.term_predecessor_name = true;
            }
        }
        blob = new CSL.Blob(str, token);
        curr = this.current.value();
        if ("undefined" === typeof curr && this.current.mystack.length === 0) {
            this.current.mystack.push([]);
            curr = this.current.value();
        }
        if ("string" === typeof blob.blobs) {
            if (!ignorePredecessor) {
                this.state.tmp.term_predecessor = true;
                this.state.tmp.in_cite_predecessor = true;
            } else if (notSerious) {
                this.state.tmp.term_predecessor_name = true;
            }
        }
        if ("string" === typeof str) {
            if ("string" === typeof blob.blobs) {
                if (blob.blobs.slice(0, 1) !== " ") {
                    let blobPrefix = "";
                    let blobBlobs = blob.blobs;
                    while (TERMINAL_PUNCTUATION.indexOf(blobBlobs.slice(0, 1)) > -1) {
                        blobPrefix = blobPrefix + blobBlobs.slice(0, 1);
                        blobBlobs = blobBlobs.slice(1);
                    }
                    if (blobBlobs && blobPrefix) {
                        blob.strings.prefix = blob.strings.prefix + blobPrefix;
                        blob.blobs = blobBlobs;
                    }
                }
            }
            if (blob.strings["text-case"]) {
                blob.blobs = CSL.Output.Formatters[blob.strings["text-case"]](this.state, str);
            }
            if (this.state.tmp.strip_periods && !noStripPeriods) {
                blob.blobs = blob.blobs.replace(/\.([^a-z]|$)/g, "$1");
            }
            for (let i = blob.decorations.length - 1; i > -1; i += -1) {
                if (blob.decorations[i][0] === "@quotes" && blob.decorations[i][1] !== "false") {
                    blob.punctuation_in_quote = this.state.getOpt("punctuation-in-quote");
                }
                if (!blob.blobs.match(ROMANESQUE_REGEXP)) {
                    if (blob.decorations[i][0] === "@font-style") {
                        blob.decorations = blob.decorations.slice(0, i).concat(blob.decorations.slice(i + 1));
                    }
                }
            }
            curr.push(blob);
            this.state.fun.flipflopper.processTags(blob);
        } else if (useblob) {
            curr.push(blob);
        } else {
            curr.push(str);
        }
        return true;
    }

    string(state: CslState, myblobs: any[], blob?: any): any[] {
        let i: number, ilen: number, j: number, jlen: number, b: string;
        const txt_esc = CSL.getSafeEscape(this.state);
        const blobs = myblobs.slice();
        let ret: any[] = [];
        
        if (blobs.length === 0) {
            return ret;
        }

        let blob_delimiter = "";
        if (blob) {
            blob_delimiter = blob.strings.delimiter;
        } else {
            state.tmp.count_offset_characters = false;
            state.tmp.offset_characters = 0;
        }

        if (blob && blob.new_locale) {
            blob.old_locale = state.opt.lang;
            state.opt.lang = blob.new_locale;
        }

        let blobjr, use_suffix, use_prefix, params;
        for (let i = 0, ilen = blobs.length; i < ilen; i += 1) {
            blobjr = blobs[i];

            if (blobjr.strings.first_blob) {
                state.tmp.count_offset_characters = blobjr.strings.first_blob;
            }

            if ("string" === typeof blobjr.blobs) {
                if ("number" === typeof blobjr.num) {
                    ret.push(blobjr);
                } else if (blobjr.blobs) {
                    if (blobjr.particle) {
                        blobjr.blobs = blobjr.particle + blobjr.blobs;
                        blobjr.particle = "";
                    }
                    b = txt_esc(blobjr.blobs);
                    const blen = b.length;

                    if (!state.tmp.suppress_decorations) {
                        for (let j = 0, jlen = blobjr.decorations.length; j < jlen; j += 1) {
                            params = blobjr.decorations[j];
                            if (params[0] === "@showid") {
                                continue;
                            }
                            if (state.normalDecorIsOrphan(blobjr, params)) {
                                continue;
                            }
                            b = state.fun.decorate[params[0]][params[1]].call(blobjr, state, b, params[2]);
                        }
                    }
                    if (b && b.length) {
                        b = txt_esc(blobjr.strings.prefix) + b + txt_esc(blobjr.strings.suffix);
                        if (state.opt.development_extensions.csl_reverse_lookup_support && !state.tmp.suppress_decorations) {
                            for (let j = 0, jlen = blobjr.decorations.length; j < jlen; j += 1) {
                                params = blobjr.decorations[j];

                                if (params[0] === "@showid") {
                                    b = state.fun.decorate[params[0]][params[1]].call(blobjr, state, b, params[2]);
                                }
                            }
                        }
                        ret.push(b);
                        if (state.tmp.count_offset_characters) {
                            state.tmp.offset_characters += (blen + blobjr.strings.suffix.length + blobjr.strings.prefix.length);
                        }
                    }
                }
            } else if (blobjr.blobs.length) {
                const addtoret = state.output.string(state, blobjr.blobs, blobjr);
                if (blob) {
                    if ("string" !== addtoret && addtoret.length > 1 && blobjr.strings.delimiter) {
                        let numberSeen = false;
                        for (let j=0,jlen=addtoret.length;j<jlen;j++) {
                            if ("string" !== typeof addtoret[j]) {
                                numberSeen = true;
                            } else if (numberSeen) {
                                addtoret[j] = (blobjr.strings.delimiter + addtoret[j]);
                            }
                        }
                    }
                }
                ret = ret.concat(addtoret);
            }
            if (blobjr.strings.first_blob && state.registry.registry[blobjr.strings.first_blob]) {
                state.registry.registry[blobjr.strings.first_blob].offset = state.tmp.offset_characters;
                state.tmp.count_offset_characters = false;
            }
        }

        for (let i=0,ilen=ret.length - 1;i<ilen;i+=1) {
            if ("number" === typeof ret[i].num && "number" === typeof ret[i+1].num && !ret[i+1].UGLY_DELIMITER_SUPPRESS_HACK) {
                ret[i].strings.suffix = ret[i].strings.suffix + (blob_delimiter ? blob_delimiter : "");
                ret[i+1].successor_prefix = "";
                ret[i+1].UGLY_DELIMITER_SUPPRESS_HACK = true;
            }
        }

        let span_split = 0;
        for (let i = 0, ilen = ret.length; i < ilen; i += 1) {
            if ("string" === typeof ret[i]) {
                span_split = (i + 1);
                if (i < ret.length - 1  && "object" === typeof ret[i + 1]) {
                    if (blob_delimiter && !ret[i + 1].UGLY_DELIMITER_SUPPRESS_HACK) {
                        ret[i] += txt_esc(blob_delimiter);
                    }
                    ret[i + 1].UGLY_DELIMITER_SUPPRESS_HACK = true;
                }
            }
        }

        if (blob && (blob.decorations.length || blob.strings.suffix)) {
            span_split = ret.length;
        } else if (blob && blob.strings.prefix) {
            for (let i=0,ilen=ret.length;i<ilen;i++) {
                if ("undefined" !== typeof ret[i].num) {
                    span_split = i;
                    if (i === 0) {
                        ret[i].strings.prefix = blob.strings.prefix + ret[i].strings.prefix;
                    }
                    break;
                }
            }
        }

        let blobs_start = state.output.renderBlobs(ret.slice(0, span_split), blob_delimiter, false, blob);
        if (blobs_start && blob && (blob.decorations.length || blob.strings.suffix || blob.strings.prefix)) {
            if (!state.tmp.suppress_decorations) {
                for (let i = 0, ilen = blob.decorations.length; i < ilen; i += 1) {
                    params = blob.decorations[i];
                    if (["@cite","@bibliography", "@display", "@showid"].indexOf(params[0]) > -1) {
                        continue;
                    }
                    if (state.normalDecorIsOrphan(blobjr, params)) {
                        continue;
                    }
                    if (!params[0]) continue;
                    if ("string" === typeof blobs_start) {
                        blobs_start = state.fun.decorate[params[0]][params[1]].call(blob, state, blobs_start, params[2]);
                    }
                }
            }
            b = blobs_start;
            use_suffix = blob.strings.suffix;
            if (b && b.length) {
                use_prefix = blob.strings.prefix;
                b = txt_esc(use_prefix) + b + txt_esc(use_suffix);
                if (state.tmp.count_offset_characters) {
                    state.tmp.offset_characters += (use_prefix.length + use_suffix.length);
                }
            }
            blobs_start = b;
            if (!state.tmp.suppress_decorations) {
                for (let i = 0, ilen = blob.decorations.length; i < ilen; i += 1) {
                    params = blob.decorations[i];
                    if (["@cite","@bibliography", "@display", "@showid"].indexOf(params[0]) === -1) {
                        continue;
                    }
                    if ("string" === typeof blobs_start) {
                        blobs_start = state.fun.decorate[params[0]][params[1]].call(blob, state, blobs_start, params[2]);
                    }
                }
            }
        }

        const blobs_end = ret.slice(span_split, ret.length);
        if (!blobs_end.length && blobs_start) {
            ret = [blobs_start];
        } else if (blobs_end.length && !blobs_start) {
            ret = blobs_end;
        } else if (blobs_start && blobs_end.length) {
            ret = [blobs_start].concat(blobs_end);
        }
        if ("undefined" === typeof blob) {
            this.queue = [];
            this.current.mystack = [];
            this.current.mystack.push(this.queue);
            if (state.tmp.suppress_decorations) {
                ret = state.output.renderBlobs(ret, undefined, false);
            }
        } else if ("boolean" === typeof blob) {
            ret = state.output.renderBlobs(ret, undefined, true);
        }

        if (blob && blob.new_locale) {
            state.opt.lang = blob.old_locale;
        }
        return ret;
    }

    clearlevel() {
        let blob: any, pos: number, len: number;
        blob = this.current.value();
        len = blob.blobs.length;
        for (let pos = 0; pos < len; pos += 1) {
            blob.blobs.pop();
        }
    }

    renderBlobs(blobs: any[], delim?: string, in_cite?: boolean, parent?: any): string | any {
        let state, ret, ret_last_char, use_delim, blob, pos, len, ppos, llen, str, params, txt_esc;
        txt_esc = CSL.getSafeEscape(this.state);
        if (!delim) {
            delim = "";
        }
        state = this.state;
        ret = "";
        ret_last_char = [];
        use_delim = "";
        len = blobs.length;
        if (this.state.tmp.area === "citation" && !this.state.tmp.just_looking && len === 1 && typeof blobs[0] === "object" && parent) {
            blobs[0].strings.prefix = parent.strings.prefix + blobs[0].strings.prefix;
            blobs[0].strings.suffix = blobs[0].strings.suffix + parent.strings.suffix;
            blobs[0].decorations = blobs[0].decorations.concat(parent.decorations);
            blobs[0].params = parent.params;
            return blobs[0];
        }
        let start = true;
        for (let pos = 0; pos < len; pos += 1) {
            if (blobs[pos].checkNext) {
                blobs[pos].checkNext(blobs[pos + 1],start);
                start = false;
            } else if (blobs[pos+1] && blobs[pos+1].splice_prefix) {
                start = false;
            } else {
                start = true;
            }
        }
        
        let doit = true;
        for (let pos = blobs.length - 1; pos > 0; pos += -1) {
            if (blobs[pos].checkLast) {
                if (doit && blobs[pos].checkLast(blobs[pos - 1])) {
                    doit = false;
                }
            } else {
                doit = true;
            }
        }
        len = blobs.length;
        for (let pos = 0; pos < len; pos += 1) {
            blob = blobs[pos];
            if (ret) {
                use_delim = delim;
            }
            if ("string" === typeof blob) {
                ret += txt_esc(use_delim);
                ret += blob;
                if (state.tmp.count_offset_characters) {
                    state.tmp.offset_characters += (use_delim.length);
                }
            } else if (in_cite) {
                if (ret) {
                    ret = [ret, blob];
                } else {
                    ret = [blob];
                }
            } else if (blob.status !== SUPPRESS) {
                if (blob.particle) {
                    str = blob.particle + blob.num;
                } else {
                    str = blob.formatter.format(blob.num, blob.gender);
                }
                const strlen = str.replace(/<[^>]*>/g, "").length;
                this.append(str, "empty", true);
                const str_blob = this.pop();
                const count_offset_characters = state.tmp.count_offset_characters;
                str = this.string(state, [str_blob], false);
                state.tmp.count_offset_characters = count_offset_characters;
                if (blob.strings["text-case"]) {
                    str = CSL.Output.Formatters[blob.strings["text-case"]](this.state, str);
                }
                if (str && this.state.tmp.strip_periods) {
                    str = str.replace(/\.([^a-z]|$)/g, "$1");
                }
                if (!state.tmp.suppress_decorations) {
                    llen = blob.decorations.length;
                    for (let ppos = 0; ppos < llen; ppos += 1) {
                        params = blob.decorations[ppos];
                        if (state.normalDecorIsOrphan(blob, params)) {
                            continue;
                        }
                        str = state.fun.decorate[params[0]][params[1]].call(blob, state, str, params[2]);
                    }
                }
                str = txt_esc(blob.strings.prefix) + str + txt_esc(blob.strings.suffix);
                let addme = "";
                if (blob.status === END) {
                    addme = txt_esc(blob.range_prefix);
                } else if (blob.status === SUCCESSOR) {
                    addme = txt_esc(blob.successor_prefix);
                } else if (blob.status === START) {
                    if (pos > 0 && !blob.suppress_splice_prefix) {
                        addme = txt_esc(blob.splice_prefix);
                    } else {
                        addme = "";
                    }
                } else if (blob.status === SEEN) {
                    addme = txt_esc(blob.splice_prefix);
                }
                ret += addme;
                ret += str;
                if (state.tmp.count_offset_characters) {
                    state.tmp.offset_characters += (addme.length + blob.strings.prefix.length + strlen + blob.strings.suffix.length);
                }
            }
        }
        return ret;
    }

    static purgeEmptyBlobs(parent: Blob) {
        if ("object" !== typeof parent || "object" !== typeof parent.blobs || !(parent.blobs as Blob[]).length) {
            return;
        }
        const parentBlobs = parent.blobs as Blob[];
        for (let i=parentBlobs.length-1;i>-1;i--) {
            Queue.purgeEmptyBlobs(parentBlobs[i]);
            const child = parentBlobs[i];
            if (!child || !child.blobs || !(child.blobs as Blob[]).length) {
                const buf: Blob[] = [];
                while ((parentBlobs.length-1) > i) {
                    buf.push(parentBlobs.pop()!);
                }
                parentBlobs.pop();
                while (buf.length) {
                    parentBlobs.push(buf.pop()!);
                }
            }
        }
    }

    static adjust = function(this: any, punctInQuote?: boolean) {
        const NO_SWAP_IN: Record<string, boolean> = {
            ";": true,
            ":": true
        };

        const NO_SWAP_OUT: Record<string, boolean> = {
            ".": true,
            "!": true,
            "?": true
        };

        const LtoR_MAP: Record<string, Record<string, string>> = {
            "!": {
                ".": "!",
                "?": "!?",
                ":": "!",
                ",": "!,",
                ";": "!;"
            },
            "?": {
                "!": "?!",
                ".": "?",
                ":": "?",
                ",": "?,",
                ";": "?;"
            },
            ".": {
                "!": ".!",
                "?": ".?",
                ":": ".:",
                ",": ".,",
                ";": ".;"
            },
            ":": {
                "!": "!",
                "?": "?",
                ".": ":",
                ",": ":,",
                ";": ":;"
            },
            ",": {
                "!": ",!",
                "?": ",?",
                ":": ",:",
                ".": ",.",
                ";": ",;"
            },
            ";": {
                "!": "!",
                "?": "?",
                ":": ";",
                ",": ";,",
                ".": ";"
            }
        };

        const SWAP_IN: Record<string, boolean> = {};
        const SWAP_OUT: Record<string, boolean> = {};
        const PUNCT: Record<string, boolean> = {};
        const PUNCT_OR_SPACE: Record<string, boolean> = {};
        for (let key in LtoR_MAP) {
            PUNCT[key] = true;
            PUNCT_OR_SPACE[key] = true;
            if (!NO_SWAP_IN[key]) {
                SWAP_IN[key] = true;
            }
            if (!NO_SWAP_OUT[key]) {
                SWAP_OUT[key] = true;
            }
        }
        PUNCT_OR_SPACE[" "] = true;
        PUNCT_OR_SPACE["\u00a0"] = true;

        const RtoL_MAP: Record<string, Record<string, string>> = {};
        for (let key in LtoR_MAP) {
            for (let subkey in LtoR_MAP[key]) {
                if (!RtoL_MAP[subkey]) {
                    RtoL_MAP[subkey] = {};
                }
                RtoL_MAP[subkey][key] = LtoR_MAP[key][subkey];
            }
        }

        function blobIsNumber(blob: Blob): boolean {
            return ("number" === typeof blob.num || ((blob.blobs as Blob[]).length === 1 && "number" === typeof (blob.blobs as Blob[])[0].num));
        }

        function blobEndsInNumber(blob: Blob): boolean | undefined {
            if ("number" === typeof blob.num) {
                return true;
            }
            if (!blob.blobs || "object" !== typeof blob.blobs) {
                return false;
            }
            const blobs = blob.blobs as Blob[];
            if (blobEndsInNumber(blobs[blobs.length-1])) {
                return true;
            }
        }
        
        function blobHasDecorations(blob: Blob, includeQuotes?: boolean): boolean {
            let ret = false;
            const decorlist = ['@font-style','@font-variant','@font-weight','@text-decoration','@vertical-align'];
            if (includeQuotes) {
                decorlist.push('@quotes');
            }
            if (blob.decorations) {
                for (let i=0,ilen=blob.decorations.length;i<ilen;i++) {
                    if (decorlist.indexOf(blob.decorations[i][0]) > -1) {
                        ret = true;
                        break;
                    }
                }
            }
            return ret;
        }
        
        function blobHasDescendantQuotes(blob: Blob): boolean {
            if (blob.decorations) {
                for (let i=0,ilen=blob.decorations.length;i<ilen;i++) {
                    if (blob.decorations[i][0] === '@quotes' && blob.decorations[i][1] !== "false") {
                        return true;
                    }
                }
            }
            if ("object" !== typeof blob.blobs) {
                return false;
            }
            const blobs = blob.blobs as Blob[];
            return blobHasDescendantQuotes(blobs[blobs.length-1]);
        }
        
        function blobHasDescendantMergingPunctuation(parentChar: string, blob: Blob): boolean {
            let childChar = blob.strings.suffix.slice(-1);
            if (!childChar && "string" === typeof blob.blobs) {
                childChar = (blob.blobs as string).slice(-1);
            }
            const mergedChars = RtoL_MAP[parentChar][childChar];
            if (mergedChars && mergedChars.length === 1) {
                return true;
            }
            if ("object" !== typeof blob.blobs) {
                return false;
            }
            const blobs = blob.blobs as Blob[];
            if (blobHasDescendantMergingPunctuation(parentChar, blobs[blobs.length-1])) {
                return true;
            }
            return false;
        }
        
        function matchLastChar(blob: Blob, chr: string): boolean {
            if (!PUNCT[chr]) {
                return false;
            }
            if ("string" === typeof blob.blobs) {

                if (blob.blobs.slice(-1) === chr) {
                    return true;
                } else {
                    return false;
                }
            } else {
                const child = blob.blobs[blob.blobs.length-1];
                if (child) {
                    let childChar = child.strings.suffix.slice(-1);
                    if (!childChar) {
                        return matchLastChar(child,chr);
                    } else if (child.strings.suffix.slice(-1) == chr) {
                        return true;
                    } else {
                        return false;
                    }
                } else {
                    return false;
                }
            }
        }
        
        function mergeChars(First: Blob, first: string, Second: Blob, second: string, merge_right?: boolean) {
            const FirstStrings = "blobs" === first ? First : First.strings;
            const SecondStrings = "blobs" === second ? Second: Second.strings;
            const firstChar = FirstStrings[first].slice(-1);
            const secondChar = SecondStrings[second].slice(0,1);
            function cullRight() {
                SecondStrings[second] = SecondStrings[second].slice(1);
            }
            function cullLeft() {
                FirstStrings[first] = FirstStrings[first].slice(0,-1);
            }
            function addRight(chr: any) {
                SecondStrings[second] = chr + SecondStrings[second];
            }
            function addLeft(chr: any) {
                FirstStrings[first] += chr;
            }
            const cull = merge_right ? cullLeft : cullRight;
            function matchOnRight() {
                return RtoL_MAP[secondChar];
            }
            function matchOnLeft() {
                return LtoR_MAP[firstChar];
            }
            const match = merge_right ? matchOnLeft : matchOnRight;
            function mergeToRight() {
                const chr = LtoR_MAP[firstChar][secondChar];
                if ("string" === typeof chr) {
                    cullLeft();
                    cullRight();
                    addRight(chr);
                } else {
                    addRight(firstChar);
                    cullLeft();
                }
            }
            function mergeToLeft() {
                const chr = RtoL_MAP[secondChar][firstChar];
                if ("string" === typeof chr) {
                    cullLeft();
                    cullRight();
                    addLeft(chr);
                } else {
                    addLeft(secondChar);
                    cullRight();
                }
            }
            const merge = merge_right ? mergeToRight: mergeToLeft;

            const isDuplicate = firstChar === secondChar;
            if (isDuplicate) {
                cull();
            } else {
                if (match()) {
                    merge();
                }
            }
        }

        function upward(parent: Blob) {
            if (parent.blobs && "string" == typeof parent.blobs) {
                if (PUNCT[parent.strings.suffix.slice(0,1)]
                    && parent.strings.suffix.slice(0,1) === parent.blobs.slice(-1)) {

                    parent.strings.suffix = parent.strings.suffix.slice(1);
                }
                return;
            } else if ("object" !== typeof parent || "object" !== typeof parent.blobs || !parent.blobs.length) {
                return;
            }

            const parentDecorations = blobHasDecorations(parent,true);
            for (let i=parent.blobs.length-1;i>-1;i--) {
                this.upward(parent.blobs[i]);
                const parentStrings = parent.strings;
                const childStrings = parent.blobs[i].strings;
                if (i === 0) {
                    if (" " === parentStrings.prefix.slice(-1) && " " === childStrings.prefix.slice(0, 1)) {
                        childStrings.prefix = childStrings.prefix.slice(1);
                    }
                    let childChar = childStrings.prefix.slice(0, 1);
                    if (!parentDecorations && PUNCT_OR_SPACE[childChar] && !parentStrings.prefix) {
                        parentStrings.prefix += childChar;
                        childStrings.prefix = childStrings.prefix.slice(1);
                    }
                }
                if (i === (parent.blobs.length - 1)) {
                    let childChar = childStrings.suffix.slice(-1);
                    if (!parentDecorations && [" "].indexOf(childChar) > -1) {
                        if (parentStrings.suffix.slice(0,1) !== childChar) {
                            parentStrings.suffix = childChar + parentStrings.suffix;
                        }
                        childStrings.suffix = childStrings.suffix.slice(0, -1);
                    }
                }
                if (parentStrings.delimiter && i > 0) {
                    if (PUNCT_OR_SPACE[parentStrings.delimiter.slice(-1)]
                        && parentStrings.delimiter.slice(-1) === childStrings.prefix.slice(0, 1)) {

                        childStrings.prefix = childStrings.prefix.slice(1);
                    }
                }
            }
        }

        function leftward(parent: Blob) {
            if ("object" !== typeof parent || "object" !== typeof parent.blobs || !(parent.blobs as Blob[]).length) {
                return;
            }

            for (let i=parent.blobs.length-1;i>-1;i--) {
                this.leftward(parent.blobs[i]);
                if ((i < parent.blobs.length -1) && !parent.strings.delimiter) {
                    const child = parent.blobs[i];
                    let childChar = child.strings.suffix.slice(-1);
                    const sibling = parent.blobs[i+1];
                    const siblingChar = sibling.strings.prefix.slice(0, 1);
                    const hasDecorations = blobHasDecorations(child) || blobHasDecorations(sibling);
                    const hasNumber = "number" === typeof childChar || "number" === typeof siblingChar;

                    if (!hasDecorations && !hasNumber && PUNCT[siblingChar] && !hasNumber) {
                        const suffixAndPrefixMatch = siblingChar === child.strings.suffix.slice(-1);
                        const suffixAndFieldMatch = (!child.strings.suffix && "string" === typeof child.blobs && child.blobs.slice(-1) === siblingChar);
                        if (!suffixAndPrefixMatch && !suffixAndFieldMatch) {
                            mergeChars(child, 'suffix', sibling, 'prefix');
                        } else {
                            sibling.strings.prefix = sibling.strings.prefix.slice(1);
                        }
                    }
                }
            }
        }

        function downward(parent: Blob) {
            if (parent.blobs && "string" == typeof parent.blobs) {
                if (PUNCT[parent.strings.suffix.slice(0,1)]
                    && parent.strings.suffix.slice(0,1) === parent.blobs.slice(-1)) {

                    parent.strings.suffix = parent.strings.suffix.slice(1);
                }
                return;
            } else if ("object" !== typeof parent || "object" !== typeof parent.blobs || !parent.blobs.length) {
                return;
            }

            const parentStrings = parent.strings;
            let someChildrenAreNumbers = false;
            for (let i=0,ilen=parent.blobs.length;i<ilen;i++) {
                if (blobIsNumber(parent.blobs[i])) {
                    someChildrenAreNumbers = true;
                    break;
                }
            }
            if (true || !someChildrenAreNumbers) {
                if (parentStrings.delimiter && PUNCT[parentStrings.delimiter.slice(0, 1)]) {
                    const delimChar = parentStrings.delimiter.slice(0, 1);
                    for (let i=parent.blobs.length-2;i>-1;i--) {
                        const childStrings = parent.blobs[i].strings;
                        if (childStrings.suffix.slice(-1) !== delimChar) {
                            childStrings.suffix += delimChar;
                        }
                    }
                    parentStrings.delimiter = parentStrings.delimiter.slice(1);
                }
            }
            for (let i=parent.blobs.length-1;i>-1;i--) {
                const child = parent.blobs[i];
                const childStrings = parent.blobs[i].strings;
                const childDecorations = blobHasDecorations(child, true);
                const childIsNumber = blobIsNumber(child);

                if (i === (parent.blobs.length - 1)) {

                    if (true || !someChildrenAreNumbers) {
                        const parentChar = parentStrings.suffix.slice(0, 1);

                        let allowMigration = false;
                        if (PUNCT[parentChar]) {
                            allowMigration = blobHasDescendantMergingPunctuation(parentChar,child);
                            if (!allowMigration && punctInQuote) {
                                allowMigration = blobHasDescendantQuotes(child);
                            }
                        }
                        if (allowMigration) {
                            if (PUNCT[parentChar]) {
                                if (!blobEndsInNumber(child)) {
                                    if ("string" === typeof child.blobs) {
                                        mergeChars(child, 'blobs', parent, 'suffix');
                                    } else {
                                        mergeChars(child, 'suffix', parent, 'suffix');
                                    }
                                    if (parentStrings.suffix.slice(0,1) === ".") {
                                        childStrings.suffix += parentStrings.suffix.slice(0,1);
                                        parentStrings.suffix = parentStrings.suffix.slice(1);
                                    }
                                }
                            }
                        }
                        if (childStrings.suffix.slice(-1) === " " && parentStrings.suffix.slice(0,1) === " ") {
                            parentStrings.suffix = parentStrings.suffix.slice(1);
                        }
                        if (PUNCT_OR_SPACE[childStrings.suffix.slice(0,1)]) {
                            if ("string" === typeof child.blobs && child.blobs.slice(-1) === childStrings.suffix.slice(0,1)) {
                                childStrings.suffix = childStrings.suffix.slice(1);
                            }
                            if (childStrings.suffix.slice(-1) === parentStrings.suffix.slice(0, 1)) {
                                parentStrings.suffix = parentStrings.suffix.slice(0, -1);
                            }
                        }
                    }
                    if (matchLastChar(parent,parent.strings.suffix.slice(0,1))) {
                        parent.strings.suffix = parent.strings.suffix.slice(1);
                    }
                } else if (parentStrings.delimiter) {
                    if (PUNCT_OR_SPACE[parentStrings.delimiter.slice(0,1)]
                        && parentStrings.delimiter.slice(0, 1) === childStrings.suffix.slice(-1)) {

                        parent.blobs[i].strings.suffix = parent.blobs[i].strings.suffix.slice(0, -1);
                        
                    }
                } else {
                    const siblingStrings = parent.blobs[i+1].strings;
                    if (!blobIsNumber(child) 
                        && !childDecorations
                        && PUNCT_OR_SPACE[childStrings.suffix.slice(-1)]
                        && childStrings.suffix.slice(-1) === siblingStrings.prefix.slice(0, 1)) {

                        siblingStrings.prefix = siblingStrings.prefix.slice(1);
                    }
                }
                if (!childIsNumber && !childDecorations && PUNCT[childStrings.suffix.slice(0,1)]
                    && "string" === typeof child.blobs) {
                    
                    mergeChars(child, 'blobs', child, 'suffix');
                }
                this.downward(parent.blobs[i]);
            }
        }

        function swapToTheLeft(child: Blob) {
            let childChar = child.strings.suffix.slice(0,1);
            if ("string" === typeof child.blobs) {
                while (SWAP_IN[childChar]) {
                    mergeChars(child, 'blobs', child, 'suffix');
                    childChar = child.strings.suffix.slice(0,1);
                }                                
            } else {
                while (SWAP_IN[childChar]) {
                    mergeChars(child.blobs[child.blobs.length-1], 'suffix', child, 'suffix');
                    childChar = child.strings.suffix.slice(0,1);
                }
            }
        }
        function swapToTheRight(child: Blob) {
            if ("string" === typeof child.blobs) {
                let childChar = child.blobs.slice(-1);
                while (SWAP_OUT[childChar]) {
                    mergeChars(child, 'blobs', child, 'suffix', true);
                    childChar = child.blobs.slice(-1);
                }
            } else {
                let childChar = child.blobs[child.blobs.length-1].strings.suffix.slice(-1);
                while (SWAP_OUT[childChar]) {
                    mergeChars(child.blobs[child.blobs.length-1], 'suffix', child, 'suffix', true);
                    childChar = child.blobs[child.blobs.length-1].strings.suffix.slice(-1);
                }
            }
        }

        function fix(parent: Blob) {
            if ("object" !== typeof parent || "object" !== typeof parent.blobs || !(parent.blobs as Blob[]).length) {
                return;
            }
            let lastChar;

            for (let i=0,ilen=parent.blobs.length;i<ilen;i++) {
                const child = parent.blobs[i];
                let quoteSwap = false;
                for (let j=0,jlen=child.decorations.length;j<jlen;j++) {
                    const decoration = child.decorations[j];
                    if (decoration[0] === "@quotes" && decoration[1] !== "false") {
                        quoteSwap = true;
                    }
                }
                if (quoteSwap) {
                    if (punctInQuote) {
                        swapToTheLeft(child);
                    } else {
                        swapToTheRight(child);
                    }
                }
                lastChar = this.fix(parent.blobs[i]);
                if (child.blobs && "string" === typeof child.blobs) {
                    lastChar = child.blobs.slice(-1);
                }
            }
            return lastChar;
        }
        this.upward = upward;
        this.leftward = leftward;
        this.downward = downward;
        this.fix = fix;
    };
}
