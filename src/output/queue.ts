import { CSL } from '../csl';
/*global CSL: true */

CSL.Output = {};
/**
 * Output queue object.
 * @class
 */
CSL.Output.Queue = function (state) {
    this.levelname = ["top"];
    this.state = state;
    this.queue = [];
    this.empty = new CSL.Token("empty");
    let tokenstore: any = {};
    tokenstore.empty = this.empty;
    this.formats = new CSL.Stack(tokenstore);
    this.current = new CSL.Stack(this.queue);
};

// XXX This works, but causes a mismatch in api_cite
// Could insert a placeholder
// Better to have a function that spits out an independent blob.
// Is that possible though?
// Okay. Use queue.append() with fake_queue instead.
CSL.Output.Queue.prototype.pop = function () {
    // For some reason, state.output.current.value() here can be an array, 
    // not a blob ... ?
    const drip = this.current.value();
    if (drip.length) {
        return drip.pop();
    } else {
        return drip.blobs.pop();
    }
};

CSL.Output.Queue.prototype.getToken = function (name) {
    let ret = this.formats.value()[name];
    return ret;
};

CSL.Output.Queue.prototype.mergeTokenStrings = function (base, modifier) {
    let base_token, modifier_token, ret, key;
    base_token = this.formats.value()[base];
    modifier_token = this.formats.value()[modifier];
    ret = base_token;
    if (modifier_token) {
        if (!base_token) {
            base_token = new CSL.Token(base, CSL.SINGLETON);
            base_token.decorations = [];
        }
        ret = new CSL.Token(base, CSL.SINGLETON);
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
};

// Store a new output format token based on another
CSL.Output.Queue.prototype.addToken = function (name, modifier, token) {
    let newtok, attr;
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
};

//
// newFormat adds a new bundle of formatting tokens to
// the queue's internal stack of such bundles
CSL.Output.Queue.prototype.pushFormats = function (tokenstore) {
    if (!tokenstore) {
        tokenstore = {};
    }
    tokenstore.empty = this.empty;
    this.formats.push(tokenstore);
};


CSL.Output.Queue.prototype.popFormats = function () {
    this.formats.pop();
};

CSL.Output.Queue.prototype.startTag = function (name, token) {
    let tokenstore = {};
    if (this.state.tmp["doing-macro-with-date"] && this.state.tmp.extension) {
        token = this.empty;
        name = "empty";
    }
    tokenstore[name] = token;
    this.pushFormats(tokenstore);
    this.openLevel(name);
};

CSL.Output.Queue.prototype.endTag = function (name) {
    this.closeLevel(name);
    this.popFormats();
};

//
// newlevel adds a new blob object to the end of the current
// list, and adjusts the current pointer so that subsequent
// appends are made to blob list of the new object.

CSL.Output.Queue.prototype.openLevel = function (token) {
    let blob, curr;
    if ("object" === typeof token) {
        // delimiter, prefix, suffix, decorations from token
        blob = new CSL.Blob(undefined, token);
    } else if ("undefined" === typeof token) {
        blob = new CSL.Blob(undefined, this.formats.value().empty, "empty");
    } else {
        if (!this.formats.value() || !this.formats.value()[token]) {
            CSL.error("CSL processor error: call to nonexistent format token \"" + token + "\"");
        }
        // delimiter, prefix, suffix, decorations from token
        blob = new CSL.Blob(undefined, this.formats.value()[token], token);
    }
    curr = this.current.value();
    if (!this.state.tmp.just_looking && this.checkNestedBrace) {
        blob.strings.prefix = this.checkNestedBrace.update(blob.strings.prefix);
    }
    curr.push(blob);
    this.current.push(blob);
};

/**
 * "merge" used to be real complicated, now it's real simple.
 */
CSL.Output.Queue.prototype.closeLevel = function (name) {
    // CLEANUP: Okay, so this.current.value() holds the blob at the
    // end of the current list.  This is wrong.  It should
    // be the parent, so that we have  the choice of reading
    // the affixes and decorations, or appending to its
    // content.  The code that manipulates blobs will be
    // much simpler that way.
    if (name && name !== this.current.value().levelname) {
        CSL.error("Level mismatch error:  wanted " + name + " but found " + this.current.value().levelname);
    }
    let blob = this.current.pop();
    if (!this.state.tmp.just_looking && this.checkNestedBrace) {
        blob.strings.suffix = this.checkNestedBrace.update(blob.strings.suffix);
    }
};

//
// append does the same thing as newlevel, except
// that the blob it pushes has text content,
// and the current pointer is not moved after the push.

CSL.Output.Queue.prototype.append = function (str, tokname, notSerious, ignorePredecessor, noStripPeriods) {
    let token, blob, curr;
    let useblob = true;
    if (notSerious) {
        ignorePredecessor = true;
    }
    // XXXXX Nasty workaround, but still an improvement
    // over the reverse calls to the cs:date node build
    // function that we had before.
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
        CSL.error("CSL processor error: unknown format token name: " + tokname);
    }
    // Unset delimiters must be left undefined until they reach the queue
    // in order to discriminate unset from explicitly empty delimiters
    // when inheriting a default value from a superior node. [??? really ???]
    if (token.strings && "undefined" === typeof token.strings.delimiter) {
        token.strings.delimiter = "";
    }
    if ("string" === typeof str && str.length) {

        // Source (;?!»«): http://en.wikipedia.org/wiki/Space_(punctuation)#Breaking_and_non-breaking_spaces
        // Source (:): http://forums.zotero.org/discussion/4933/localized-quotes/#Comment_88384
        str = str.replace(/ ([:;?!\u00bb])/g, "\u202f$1").replace(/\u00ab /g, "\u00ab\u202f");

        this.last_char_rendered = str.slice(-1);
        // This, and not the str argument below on flipflop, is the
        // source of the flipflopper string source.
        str = str.replace(/\s+'/g, " \'");
        if (!notSerious) {
            // this condition for sort_LeadingApostropheOnNameParticle
            str = str.replace(/^'/g, " \'");
        }

        // signal whether we end with terminal punctuation?
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
        // XXXX An operation like this is missing somewhere, this should NOT be necessary.
        // Addresses error triggered in multi-layouts.
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
    //
    // Caution: The parallel detection machinery will blow up if tracking
    // variables are not properly initialized elsewhere.
    //
    if ("string" === typeof str) {
        if ("string" === typeof blob.blobs) {
            if (blob.blobs.slice(0, 1) !== " ") {
                let blobPrefix = "";
                let blobBlobs = blob.blobs;
                while (CSL.TERMINAL_PUNCTUATION.indexOf(blobBlobs.slice(0, 1)) > -1) {
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
            //
            // This one is _particularly_ hard to follow.  It's not obvious,
            // but the blob already contains the input string at this
            // point, as blob.blobs -- it's a terminal node, as it were.
            // The str variable also contains the input string, but
            // that copy is not used for onward processing.  We have to
            // apply our changes to the blob copy.
            //
            blob.blobs = CSL.Output.Formatters[blob.strings["text-case"]](this.state, str);
        }
        if (this.state.tmp.strip_periods && !noStripPeriods) {
            blob.blobs = blob.blobs.replace(/\.([^a-z]|$)/g, "$1");
        }
        for (let i = blob.decorations.length - 1; i > -1; i += -1) {
            if (blob.decorations[i][0] === "@quotes" && blob.decorations[i][1] !== "false") {
                blob.punctuation_in_quote = this.state.getOpt("punctuation-in-quote");
            }
            if (!blob.blobs.match(CSL.ROMANESQUE_REGEXP)) {
                if (blob.decorations[i][0] === "@font-style") {
                    blob.decorations = blob.decorations.slice(0, i).concat(blob.decorations.slice(i + 1));
                }
            }
        }
        //
        // XXX: Beware superfluous code in your code.  str in this
        // case is not the source of the final rendered string.
        // See note above.
        //
        curr.push(blob);
        this.state.fun.flipflopper.processTags(blob);
    } else if (useblob) {
        curr.push(blob);
    } else {
        curr.push(str);
    }
    return true;
};

CSL.Output.Queue.prototype.string = function (state, myblobs, blob) {
    let i, ilen, j, jlen, b;
    //if (blob && blob.strings.delimiter) {
    //    print("DELIMITER: "+blob.strings.delimiter+" on "+[x.blobs[0].num for each (x in myblobs)]);
    //}
    //var blobs, ret, blob_delimiter, i, params, blobjr, last_str, last_char, b, use_suffix, qres, addtoret, span_split, j, res, blobs_start, blobs_end, key, pos, len, ppos, llen, ttype, ltype, terminal, leading, delimiters, use_prefix, txt_esc;
    let txt_esc = CSL.getSafeEscape(this.state);
    const blobs = myblobs.slice();
    let ret = [];
    
    if (blobs.length === 0) {
        return ret;
    }

    let blob_delimiter = "";
    if (blob) {
        blob_delimiter = blob.strings.delimiter;
    } else {
        //print("=== Setting false to start ===");
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
            // Being the Item.id of the the entry being rendered.
            //print("  -- turning on counting");
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
                // (skips empty strings)
                //b = txt_esc(blobjr.blobs);
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
                //
                // because we will rip out portions of the output
                // queue before rendering, group wrappers need
                // to produce no output if they are found to be
                // empty.
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
                // Patch up world-class weird bug in the ill-constructed code of mine.
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
            // The Item.id of the entry being rendered.
            state.registry.registry[blobjr.strings.first_blob].offset = state.tmp.offset_characters;
            state.tmp.count_offset_characters = false;
        }
    }

    // Provide delimiters on adjacent numeric blobs
    for (let i=0,ilen=ret.length - 1;i<ilen;i+=1) {
        if ("number" === typeof ret[i].num && "number" === typeof ret[i+1].num && !ret[i+1].UGLY_DELIMITER_SUPPRESS_HACK) {
            // XXX watch this
            ret[i].strings.suffix = ret[i].strings.suffix + (blob_delimiter ? blob_delimiter : "");
            ret[i+1].successor_prefix = "";
            ret[i+1].UGLY_DELIMITER_SUPPRESS_HACK = true;
        }
    }

    let span_split = 0;
    for (let i = 0, ilen = ret.length; i < ilen; i += 1) {
        if ("string" === typeof ret[i]) {
            span_split = (parseInt(i as any, 10) + 1);
            if (i < ret.length - 1  && "object" === typeof ret[i + 1]) {
                if (blob_delimiter && !ret[i + 1].UGLY_DELIMITER_SUPPRESS_HACK) {
                    ret[i] += txt_esc(blob_delimiter);
                }
                // One bite of the apple
                ret[i + 1].UGLY_DELIMITER_SUPPRESS_HACK = true;
            }
            //span_split = ret.length;
            //print("XXX ret: "+ret+" -- "+blob_delimiter);
        }
    }
/*
    if (blob && (blob.decorations.length || blob.strings.suffix || blob.strings.prefix)) {
        span_split = ret.length;
    }
*/
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
        //
        // XXXX: cut-and-paste warning.  same as a code block above.
        //
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
    //
    // Blobs is now definitely a string with
    // trailing blobs.  Return it.
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
    //if (!blob && !state.tmp.just_looking) {
    //  print("QUEUE ("+ state.tmp.just_looking +"): "+JSON.stringify(state.output.queue, ["num", "strings", "decorations", "blobs", "prefix", "suffix", "delimiter"], 2));
    //}
    return ret;
};

CSL.Output.Queue.prototype.clearlevel = function () {
    let blob, pos, len;
    blob = this.current.value();
    len = blob.blobs.length;
    for (let pos = 0; pos < len; pos += 1) {
        blob.blobs.pop();
    }
};

CSL.Output.Queue.prototype.renderBlobs = function (blobs, delim, in_cite, parent) {
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
            //blobs[pos+1].checkNext(blobs[pos + 1],start);
        } else {
            start = true;
        }
    }
    
    // print("LEN="+len+" "+JSON.stringify(blobs, null, 2));
    // Fix last non-range join
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
            // XXX Blob should be run through flipflop and flattened here.
            // (I think it must be a fragment of text around a numeric
            // variable)
            ret += blob;
            if (state.tmp.count_offset_characters) {
                //state.tmp.offset_characters += (use_delim.length + blob.length);
                state.tmp.offset_characters += (use_delim.length);
            }
        } else if (in_cite) {
            // pass
            // Okay, so this does it -- but we're now not able to return a string!
            if (ret) {
                ret = [ret, blob];
            } else {
                ret = [blob];
            }
        } else if (blob.status !== CSL.SUPPRESS) {
            if (blob.particle) {
                str = blob.particle + blob.num;
            } else {
                str = blob.formatter.format(blob.num, blob.gender);
            }
            // Workaround to get a more or less accurate value.
            const strlen = str.replace(/<[^>]*>/g, "").length;
            // notSerious
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
            if (blob.status === CSL.END) {
                //print("  CSL.END");
                addme = txt_esc(blob.range_prefix);
            } else if (blob.status === CSL.SUCCESSOR) {
                //print("  CSL.SUCCESSOR");
                addme = txt_esc(blob.successor_prefix);
            } else if (blob.status === CSL.START) {
                //print("  CSL.START");
                if (pos > 0 && !blob.suppress_splice_prefix) {
                    addme = txt_esc(blob.splice_prefix);
                } else {
                    addme = "";
                }
            } else if (blob.status === CSL.SEEN) {
                //print("  CSL.SEEN");

                // THIS IS NOT THE PROPER FUNCTION OF CSL.SEEN, IS IT?

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
};

CSL.Output.Queue.purgeEmptyBlobs = function (parent) {
    //print("START1");
    if ("object" !== typeof parent || "object" !== typeof parent.blobs || !parent.blobs.length) {
        return;
    }
    // back-to-front, bottom-first
    for (let i=parent.blobs.length-1;i>-1;i--) {
        CSL.Output.Queue.purgeEmptyBlobs(parent.blobs[i]);
        const child = parent.blobs[i];
        if (!child || !child.blobs || !child.blobs.length) {
            const buf = [];
            while ((parent.blobs.length-1) > i) {
                buf.push(parent.blobs.pop());
            }
            parent.blobs.pop();
            while (buf.length) {
                parent.blobs.push(buf.pop());
            }
        }
    }
    //print("   end");
};

// Adjustments to be made:
//
// * Never migrate beyond a @quotes node
// * Never migrate into a num node.

CSL.Output.Queue.adjust = function (punctInQuote) {

    const NO_SWAP_IN = {
        ";": true,
        ":": true
    };

    const NO_SWAP_OUT = {
        ".": true,
        "!": true,
        "?": true
    };

    const LtoR_MAP = {
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

    const SWAP_IN = {};
    const SWAP_OUT = {};
    const PUNCT = {};
    const PUNCT_OR_SPACE = {};
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
    PUNCT_OR_SPACE[" "] = true;

    const RtoL_MAP = {};
    for (let key in LtoR_MAP) {
        for (let subkey in LtoR_MAP[key]) {
            if (!RtoL_MAP[subkey]) {
                RtoL_MAP[subkey] = {};
            }
            RtoL_MAP[subkey][key] = LtoR_MAP[key][subkey];
        }
    }

    function blobIsNumber(blob) {
        return ("number" === typeof blob.num || (blob.blobs && blob.blobs.length === 1 && "number" === typeof blob.blobs[0].num));
    }

    function blobEndsInNumber(blob) {
        if ("number" === typeof blob.num) {
            return true;
        }
        if (!blob.blobs || "object" !==  typeof blob.blobs) {
            return false;
        }
        if (blobEndsInNumber(blob.blobs[blob.blobs.length-1])) {
            return true;
        }
    }
    
    function blobHasDecorations(blob, includeQuotes?) {
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
    
    function blobHasDescendantQuotes(blob) {
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
        return blobHasDescendantQuotes(blob.blobs[blob.blobs.length-1]);
        //if (blobHasDescendantQuotes(blob.blobs[blob.blobs.length-1])) {
        //    return true
        //};
        //return false;
    }
    
    function blobHasDescendantMergingPunctuation(parentChar,blob) {
        let childChar = blob.strings.suffix.slice(-1);
        if (!childChar && "string" === typeof blob.blobs) {
            childChar = blob.blobs.slice(-1);
        }
        const mergedChars = RtoL_MAP[parentChar][childChar];
        if (mergedChars && mergedChars.length === 1) {
            return true;
        }
        if ("object" !== typeof blob.blobs) {
            return false;
        }
        if (blobHasDescendantMergingPunctuation(parentChar,blob.blobs[blob.blobs.length-1])) {
            return true;
        }
        return false;
    }
    
    function matchLastChar(blob, chr) {
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
    
    function mergeChars (First, first, Second, second, merge_right?) {
        const FirstStrings = "blobs" === first ? First : First.strings;
        const SecondStrings = "blobs" === second ? Second: Second.strings;
        const firstChar = FirstStrings[first].slice(-1);
        const secondChar = SecondStrings[second].slice(0,1);
        function cullRight () {
            SecondStrings[second] = SecondStrings[second].slice(1);
        }
        function cullLeft () {
            FirstStrings[first] = FirstStrings[first].slice(0,-1);
        }
        function addRight (chr) {
            SecondStrings[second] = chr + SecondStrings[second];
        }
        function addLeft (chr) {
            FirstStrings[first] += chr;
        }
        const cull = merge_right ? cullLeft : cullRight;
        function matchOnRight () {
            return RtoL_MAP[secondChar];
        }
        function matchOnLeft () {
            return LtoR_MAP[firstChar];
        }
        const match = merge_right ? matchOnLeft : matchOnRight;
        function mergeToRight () {
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
        function mergeToLeft () {
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

    function upward (parent) {
        //print("START2");
        // Terminus if no blobs
        if (parent.blobs && "string" == typeof parent.blobs) {
            if (PUNCT[parent.strings.suffix.slice(0,1)]
                && parent.strings.suffix.slice(0,1) === parent.blobs.slice(-1)) {

                parent.strings.suffix = parent.strings.suffix.slice(1);
            }
            return;
        } else if ("object" !== typeof parent || "object" !== typeof parent.blobs || !parent.blobs.length) {
            return;
        }

        // back-to-front, bottom-first
        const parentDecorations = blobHasDecorations(parent,true);
        for (let i=parent.blobs.length-1;i>-1;i--) {
            this.upward(parent.blobs[i]);
            const parentStrings = parent.strings;
            const childStrings = parent.blobs[i].strings;
            if (i === 0) {
                // Remove leading space on first-position child node prefix if there is a trailing space on the node prefix above 
                if (" " === parentStrings.prefix.slice(-1) && " " === childStrings.prefix.slice(0, 1)) {
                    childStrings.prefix = childStrings.prefix.slice(1);
                }
                // Migrate leading punctuation or space on a first-position prefix upward
                let childChar = childStrings.prefix.slice(0, 1);
                if (!parentDecorations && PUNCT_OR_SPACE[childChar] && !parentStrings.prefix) {
                    parentStrings.prefix += childChar;
                    childStrings.prefix = childStrings.prefix.slice(1);
                }
            }
            if (i === (parent.blobs.length - 1)) {
                // Migrate trailing space ONLY on a last-position suffix upward, controlling for duplicates
                let childChar = childStrings.suffix.slice(-1);
                // ZZZ Loosened to fix initialized names wrapped in a span and followed by a period
                if (!parentDecorations && [" "].indexOf(childChar) > -1) {
                    if (parentStrings.suffix.slice(0,1) !== childChar) {
                        parentStrings.suffix = childChar + parentStrings.suffix;
                    }
                    childStrings.suffix = childStrings.suffix.slice(0, -1);
                }
            }
            if (parentStrings.delimiter && i > 0) {
                // Remove leading space on mid-position child node prefix if there is a trailing space on delimiter above
                if (PUNCT_OR_SPACE[parentStrings.delimiter.slice(-1)]
                    && parentStrings.delimiter.slice(-1) === childStrings.prefix.slice(0, 1)) {

                    childStrings.prefix = childStrings.prefix.slice(1);
                }
            }
            // Siblings are handled in adjustNearsideSuffixes()
        }
        //print("   end");
    }

    function leftward (parent) {
        // Terminus if no blobs
        if ("object" !== typeof parent || "object" !== typeof parent.blobs || !parent.blobs.length) {
            return;
        }

        for (let i=parent.blobs.length-1;i>-1;i--) {
            this.leftward(parent.blobs[i]);
            // This is a delicate one.
            //
            // Migrate if:
            // * there is no umbrella delimiter [ok]
            // * neither the child nor its sibling is a number [ok]
            // * decorations exist neither on the child nor on the sibling [ok]
            // * sibling prefix char is a swapping char [ok]
            //
            // Suppress without migration if:
            // * sibling prefix char matches child suffix char or
            // * child suffix is empty and sibling prefix char match last field char
            if ((i < parent.blobs.length -1) && !parent.strings.delimiter) {
                // If there is a trailing swappable character on a sibling prefix with no intervening delimiter, copy it to suffix,
                // controlling for duplicates
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
                        //child.strings.suffix += siblingChar;
                    } else {
                        sibling.strings.prefix = sibling.strings.prefix.slice(1);
                    }
                }
            }
        }
    }

    function downward (parent) {
        //print("START3");
        // Terminus if no blobs
        if (parent.blobs && "string" == typeof parent.blobs) {
            if (PUNCT[parent.strings.suffix.slice(0,1)]
                && parent.strings.suffix.slice(0,1) === parent.blobs.slice(-1)) {

                parent.strings.suffix = parent.strings.suffix.slice(1);
            }
            return;
        } else if ("object" !== typeof parent || "object" !== typeof parent.blobs || !parent.blobs.length) {
            return;
        }
        //if (top) {
        //    print("JSON "+JSON.stringify(parent, ["strings", "decorations", "blobs", "prefix", "suffix", "delimiter"], 2));
        //}

        const parentStrings = parent.strings;
        // Check for numeric child
        let someChildrenAreNumbers = false;
        for (let i=0,ilen=parent.blobs.length;i<ilen;i++) {
            if (blobIsNumber(parent.blobs[i])) {
                someChildrenAreNumbers = true;
                break;
            }
        }
        if (true || !someChildrenAreNumbers) {
            // If there is a leading swappable character on delimiter, copy it to suffixes IFF none of the targets are numbers
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
        // back-to-front, top-first
        for (let i=parent.blobs.length-1;i>-1;i--) {
            const child = parent.blobs[i];
            const childStrings = parent.blobs[i].strings;
            const childDecorations = blobHasDecorations(child, true);
            const childIsNumber = blobIsNumber(child);

            if (i === (parent.blobs.length - 1)) {

                //if (blobHasDescendantQuotes(child)) {
                //    print("JSON "+JSON.stringify(parent, ["strings", "decorations", "blobs", "prefix", "suffix", "delimiter"]));
                //}

                if (true || !someChildrenAreNumbers) {
                    // If we have decorations, drill down to see if there are quotes below.
                    // If so, we allow migration anyway.
                    // Original discussion is here:
                    // https://forums.zotero.org/discussion/37091/citeproc-bug-punctuation-in-quotes/
                    const parentChar = parentStrings.suffix.slice(0, 1);

                    // Hmm.
                    // Consider writing out the matching child from blobHasDescendant functions.
                    // It should save some cycles, and produce the same result.

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
                    // More duplicates control
                    if (PUNCT_OR_SPACE[childStrings.suffix.slice(0,1)]) {
                        if ("string" === typeof child.blobs && child.blobs.slice(-1) === childStrings.suffix.slice(0,1)) {
                            // Remove parent punctuation of it duplicates the last character of a field
                            childStrings.suffix = childStrings.suffix.slice(1);
                        }
                        if (childStrings.suffix.slice(-1) === parentStrings.suffix.slice(0, 1)) {
                            // Remove duplicate punctuation on child suffix
                            parentStrings.suffix = parentStrings.suffix.slice(0, -1);
                        }
                    }
                }
                // Squash dupes
                if (matchLastChar(parent,parent.strings.suffix.slice(0,1))) {
                    parent.strings.suffix = parent.strings.suffix.slice(1);
                }
            } else if (parentStrings.delimiter) {
                // Remove trailing space on mid-position child node suffix if there is a leading space on delimiter above
                if (PUNCT_OR_SPACE[parentStrings.delimiter.slice(0,1)]
                    && parentStrings.delimiter.slice(0, 1) === childStrings.suffix.slice(-1)) {

                    parent.blobs[i].strings.suffix = parent.blobs[i].strings.suffix.slice(0, -1);
                    
                }
            } else {
                // Otherwise it's a sibling. We don't care about moving spaces here, just suppress a duplicate
                const siblingStrings = parent.blobs[i+1].strings;
                if (!blobIsNumber(child) 
                    && !childDecorations
                    && PUNCT_OR_SPACE[childStrings.suffix.slice(-1)]
                    && childStrings.suffix.slice(-1) === siblingStrings.prefix.slice(0, 1)) {

                    siblingStrings.prefix = siblingStrings.prefix.slice(1);
                }
            }
            // If field content ends with swappable punctuation, suppress swappable punctuation in style suffix.
            if (!childIsNumber && !childDecorations && PUNCT[childStrings.suffix.slice(0,1)]
                && "string" === typeof child.blobs) {
                
                mergeChars(child, 'blobs', child, 'suffix');
            }
            this.downward(parent.blobs[i]);
        }
/*
        if (top) {

            var seen = [];
            print(JSON.stringify(parent, function(key, val) {
                if (!val || key === 'alldecor') return;
                if (typeof val == "object") {
                    if (seen.indexOf(val) >= 0)
                        return
                    seen.push(val)
                }
                return val
            },2));
        }
*/

        //print("  end");
    }
    // Abstract out a couple of utility functions, used in fix() below.
    function swapToTheLeft (child) {
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
    function swapToTheRight (child) {
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

    function fix (parent) {
        // Terminus if no blobs
        if ("object" !== typeof parent || "object" !== typeof parent.blobs || !parent.blobs.length) {
            return;
        }
        
        //print("START4");
        // Do the swap, front-to-back, bottom-first
        let lastChar;

        // XXX Two things to fix with this:
        // XXX (1) Stalls after one character
        // XXX (2) Moves colon and semicolon, both of which SHOULD stall

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
