import { CSL } from '../../csl';

import { LITERAL, NAME_PARTS, TOLERANT } from '../../constants/core';
import { KATAKANA_REGEXP, ROMANESQUE_REGEXP, STARTSWITH_KATAKANA_REGEXP, STARTSWITH_ROMANESQUE_REGEXP, VIETNAMESE_NAMES, VIETNAMESE_SPECIALS } from '../../constants/regex';
import { Blob } from '../../obj/blob';
export class NameOutput {
    [key: string]: any;

    debug!: boolean;
    state!: CslState;
    Item!: CslItem;
    item?: any;
    nameset_base!: number;
    etal_spec!: any;
    _first_creator_variable!: boolean | string;
    _please_chop!: boolean;
    names!: any;
    variables!: string[];
    name!: any;
    family?: any;
    given?: any;
    family_decor?: any;
    given_decor?: any;
    institution!: any;
    label?: Record<string, any>;
    labelVariable!: string;
    requireMatch?: string;
    variables_offset!: string[];
    freeters!: Record<string, any[]>;
    institutions!: Record<string, any[]>;
    persons!: Record<string, any[][]>;
    freeters_count!: Record<string, number>;
    institutions_count!: Record<string, number>;
    persons_count!: Record<string, number[]>;
    names_count!: number;
    common_term?: string;
    variable_offset!: Record<string, number>;

    constructor(state: CslState, Item: CslItem, item?: any) {
        this.debug = false;
        this.state = state;
        //SNIP-START
        if (this.debug) {
            this.state.sys.print("(1)");
        }
        //SNIP-END
        this.Item = Item;
        this.item = item;
        this.nameset_base = 0;
        this.etal_spec = {};
        this._first_creator_variable = false;
        this._please_chop = false;
    }

    init(names: CslNode) {
        this.requireMatch = names.requireMatch;
        if (this.state.tmp.term_predecessor) {
            this.state.tmp.subsequent_author_substitute_ok = false;
        }
        if (this.nameset_offset) {
            this.nameset_base = this.nameset_base + this.nameset_offset;
        }
        this.nameset_offset = 0;
        this.names = names;
        this.variables = names.variables;

        this.state.tmp.value = [];
        this.state.tmp.rendered_name = [];
        this.state.tmp.label_blob = false;
        this.state.tmp.etal_node = false;
        this.state.tmp.etal_term = false;
        for (let i = 0, ilen = this.variables.length; i < ilen; i += 1) {
            if (this.Item[this.variables[i]] && this.Item[this.variables[i]].length) {
                this.state.tmp.value = this.state.tmp.value.concat(this.Item[this.variables[i]]);
            }
        }
        this["et-al"] = undefined;
        // REMOVE THIS
        this["with"] = undefined;

        this.name = undefined;
        // long, long-with-short, short
        this.institutionpart = {};
        // family, given
        //this.namepart = {};
        // before, after
        //this.label = {};

        this.state.tmp.group_context.tip.variable_attempt = true;

        this.labelVariable = this.variables[0];

        if (!this.state.tmp.value.length) {
            return;
        }

        // Abort and proceed to the next substitution if a match is required,
        // two variables are called, and they do not match.
        const checkCommonTerm = this.checkCommonAuthor(this.requireMatch);
        if (checkCommonTerm) {
            this.state.tmp.can_substitute.pop();
            this.state.tmp.can_substitute.push(true);
            //this.state.tmp.group_context.mystack[this.state.tmp.group_context.mystack.length-1].variable_success = false;
            for (let i in this.variables) {
                const idx = this.state.tmp.done_vars.indexOf(this.variables[i]);
                if (idx > -1) {
                    this.state.tmp.done_vars = this.state.tmp.done_vars.slice(0, idx).concat(this.state.tmp.done_vars.slice(i+1));
                }
            }
            this.state.tmp.common_term_match_fail = true;
            this.variables = [];
        }
    };

    reinit(names: CslNode, labelVariable: string) {
        this.requireMatch = names.requireMatch;
        this.labelVariable = labelVariable;

        if (this.state.tmp.can_substitute.value()) {
            this.nameset_offset = 0;
            // What-all should be carried across from the subsidiary
            // names node, and on what conditions? For each attribute,
            // and decoration, is it an override, or is it additive?
            this.variables = names.variables;
            
            // Not sure why this is necessary. Guards against a memory leak perhaps?
            const oldval = this.state.tmp.value.slice();
            this.state.tmp.value = [];

            for (let i = 0, ilen = this.variables.length; i < ilen; i += 1) {
                if (this.Item[this.variables[i]] && this.Item[this.variables[i]].length) {
                    this.state.tmp.value = this.state.tmp.value.concat(this.Item[this.variables[i]]);
                }
            }
            if (this.state.tmp.value.length) {
                this.state.tmp.can_substitute.replace(false, LITERAL);
            }

            this.state.tmp.value = oldval;

        }
        // Abort and proceed to the next substitution if a match is required,
        // two variables are called, and they do not match.
        const checkCommonTerm = this.checkCommonAuthor(this.requireMatch);
        if (checkCommonTerm) {
            this.state.tmp.can_substitute.pop();
            this.state.tmp.can_substitute.push(true);
            for (let i in this.variables) {
                const idx = this.state.tmp.done_vars.indexOf(this.variables[i]);
                if (idx > -1) {
                    this.state.tmp.done_vars = this.state.tmp.done_vars.slice(0, idx).concat(this.state.tmp.done_vars.slice(i+1));
                }
            }
            this.variables = [];
        }
    };

    outputNames() {
        let i, ilen;
        const variables = this.variables;
        if (this.institution.and) {
            if (!this.institution.and.single.blobs || !this.institution.and.single.blobs.length) {
                this.institution.and.single.blobs = this.name.and.single.blobs;
            }
            if (!this.institution.and.multiple.blobs || !this.institution.and.multiple.blobs.length) {
                this.institution.and.multiple.blobs = this.name.and.multiple.blobs;
            }
        }

        this.variable_offset = {};
        if (this.family) {
            this.family_decor = CSL.Util.cloneToken(this.family);
            this.family_decor.strings.prefix = "";
            this.family_decor.strings.suffix = "";
            // Sets text-case value (text-case="title" is suppressed for items
            // non-English with non-English value in Item.language)
            for (let i = 0, ilen = this.family.execs.length; i < ilen; i += 1) {
                this.family.execs[i].call(this.family_decor, this.state, this.Item);
            }
        } else {
            this.family_decor = false;
        }

        if (this.given) {
            this.given_decor = CSL.Util.cloneToken(this.given);
            this.given_decor.strings.prefix = "";
            this.given_decor.strings.suffix = "";
            // Sets text-case value (text-case="title" is suppressed for items
            // non-English with non-English value in Item.language)
            for (let i = 0, ilen = this.given.execs.length; i < ilen; i += 1) {
                this.given.execs[i].call(this.given_decor, this.state, this.Item);
            }
        } else {
            this.given_decor = false;
        }

        //SNIP-START
        if (this.debug) {
            this.state.sys.print("(2)");
        }
        //SNIP-END
        // util_names_etalconfig.js
        this.getEtAlConfig();
        //SNIP-START
        if (this.debug) {
            this.state.sys.print("(3)");
        }
        //SNIP-END
        // util_names_divide.js
        this.divideAndTransliterateNames();
        //SNIP-START
        if (this.debug) {
            this.state.sys.print("(4)");
        }
        //SNIP-END
        // util_names_truncate.js

        this.truncatePersonalNameLists();
        //SNIP-START
        if (this.debug) {
            this.state.sys.print("(5)");
        }
        //SNIP-END

        //SNIP-START
        if (this.debug) {
            this.state.sys.print("(6)");
        }
        //SNIP-END
        // util_names_disambig.js
        this.disambigNames();

        // util_names_constraints.js
        this.constrainNames();
        //SNIP-START
        if (this.debug) {
            this.state.sys.print("(7)");
        }
        //SNIP-END
        // form="count"
        if (this.name.strings.form === "count") {
            if (this.state.tmp.extension || this.names_count != 0) {
                this.state.output.append(this.names_count, "empty");
                this.state.tmp.group_context.tip.variable_success = true;
            }
            return;
        }

        //SNIP-START
        if (this.debug) {
            this.state.sys.print("(8)");
        }
        //SNIP-END
        this.setEtAlParameters();
        //SNIP-START
        if (this.debug) {
            this.state.sys.print("(9)");
        }
        //SNIP-END
        this.setCommonTerm(this.requireMatch);
        //SNIP-START
        if (this.debug) {
            this.state.sys.print("(10)");
        }
        //SNIP-END
        this.renderAllNames();
        //SNIP-START
        if (this.debug) {
            this.state.sys.print("(11)");
        }
        //SNIP-END
        const blob_list = [];
        for (let i = 0, ilen = variables.length; i < ilen; i += 1) {
            const v = variables[i];
            const institution_sets = [];
            let institutions = false;
            let varblob = null;
            if (!this.state.opt.development_extensions.spoof_institutional_affiliations) {
                varblob = this._join([this.freeters[v]], "");
            } else {
                //SNIP-START
                if (this.debug) {
                    this.state.sys.print("(11a)");
                }
                //SNIP-END
                for (let j = 0, jlen = this.institutions[v].length; j < jlen; j += 1) {
                    institution_sets.push(this.joinPersonsAndInstitutions([this.persons[v][j], this.institutions[v][j]]));
                }
                //SNIP-START
                if (this.debug) {
                    this.state.sys.print("(11b)");
                }
                //SNIP-END
                if (this.institutions[v].length) {
                    let pos = this.nameset_base + this.variable_offset[v];
                    if (this.freeters[v].length) {
                        pos += 1;
                    }
                    institutions = this.joinInstitutionSets(institution_sets, pos);
                }
                //SNIP-START
                if (this.debug) {
                    this.state.sys.print("(11c)");
                }
                //SNIP-END
                let varblob = this.joinFreetersAndInstitutionSets([this.freeters[v], institutions]);
                //SNIP-START
                if (this.debug) {
                    this.state.sys.print("(11d)");
                }
                //SNIP-END
            }
            if (varblob) {
                // Apply labels, if any
                if (!this.state.tmp.extension) {
                    varblob = this._applyLabels(varblob, v);
                }
                blob_list.push(varblob);
            }
            //SNIP-START
            if (this.debug) {
                this.state.sys.print("(11e)");
            }
            //SNIP-END
            if (this.common_term) {
                break;
            }
        }
        //SNIP-START
        if (this.debug) {
            this.state.sys.print("(12)");
        }
        //SNIP-END
        this.state.output.openLevel("empty");
        this.state.output.current.value().strings.delimiter = this.state.inheritOpt(this.names, "delimiter", "names-delimiter");
        //SNIP-START
        if (this.debug) {
            this.state.sys.print("(13)");
        }
        //SNIP-END
        for (let i = 0, ilen = blob_list.length; i < ilen; i += 1) {
            // notSerious
            this.state.output.append(blob_list[i], "literal", true);
        }
        if (!this.state.tmp.just_looking && blob_list.length > 0) {
            this.state.tmp.probably_rendered_something = true;
        }
        //SNIP-START
        if (this.debug) {
            this.state.sys.print("(14)");
        }
        //SNIP-END
        this.state.output.closeLevel("empty");
        //SNIP-START
        if (this.debug) {
            this.state.sys.print("(15)");
        }
        //SNIP-END
        let blob = this.state.output.pop();
        this.state.tmp.name_node.top = blob;
        //SNIP-START
        if (this.debug) {
            this.state.sys.print("(16)");
        }
        //SNIP-END

        // Append will drop the names on the floor here if suppress-me is
        // set on element_trace.
        // Need to rescue the value for collapse comparison.
        const namesToken = CSL.Util.cloneToken(this.names);
        if (this.state.tmp.group_context.tip.condition) {
            CSL.UPDATE_GROUP_CONTEXT_CONDITION(this.state, this.names.strings.prefix, null, this.names);
        }
        this.state.output.append(blob, namesToken);
        if (this.state.tmp.term_predecessor_name) {
            this.state.tmp.term_predecessor = true;
        }
        //SNIP-START
        if (this.debug) {
            this.state.sys.print("(17)");
        }
        //SNIP-END
        // Also used in CSL.Util.substituteEnd (which could do with
        // some cleanup at this writing).
        //SNIP-START
        if (this.debug) {
            this.state.sys.print("(18)");
        }
        //SNIP-END
        if (variables[0] !== "authority") {
            // Just grab the string values in the name
            let name_node_string: any = [];
            const nameobjs = this.Item[variables[0]];
            if (nameobjs) {
                for (let i = 0, ilen = nameobjs.length; i < ilen; i += 1) {
                    const substring = CSL.Util.Names.getRawName(nameobjs[i]);
                    if (substring) {
                        name_node_string.push(substring);
                    }
                }
            }
            name_node_string = name_node_string.join(", ");
            if (name_node_string) {
                this.state.tmp.name_node.string = name_node_string;
            }
        }
        // for classic support
        // This may be more convoluted than it needs to be. Or maybe not.
        //
        // Check for classic abbreviation
        //
        // If found, then (1) suppress title rendering, (2) replace the node
        // with the abbreviation output [and (3) do not run this._collapseAuthor() ?]
        if (this.state.tmp.name_node.string && !this.state.tmp.first_name_string) {
            this.state.tmp.first_name_string = this.state.tmp.name_node.string;
        }
        if ("classic" === this.Item.type) {
            if (this.state.tmp.first_name_string) {
                let author_title: any = [];
                author_title.push(this.state.tmp.first_name_string);
                if (this.Item.title) {
                    author_title.push(this.Item.title);
                }
                author_title = author_title.join(", ");
                if (author_title && this.state.sys.getAbbreviation) {
                    if (this.state.sys.normalizeAbbrevsKey) {
                        author_title = this.state.sys.normalizeAbbrevsKey("classic", author_title);
                    }
                    this.state.transform.loadAbbreviation("default", "classic", author_title, this.Item.language);
                    if (this.state.transform.abbrevs["default"].classic[author_title]) {
                        this.state.tmp.done_vars.push("title");
                        this.state.output.append(this.state.transform.abbrevs["default"].classic[author_title], "empty", true);
                        blob = this.state.output.pop();
                        this.state.tmp.name_node.top.blobs.pop();
                        this.state.tmp.name_node.top.blobs.push(blob);
                    }
                }
            }
        }

        // Let's try something clever here.
        this._collapseAuthor();

        // For name_SubstituteOnNamesSpanNamesSpanFail
        this.variables = [];
        
        // Reset stop-last after rendering
        this.state.tmp.authority_stop_last = 0;

        //SNIP-START
        if (this.debug) {
            this.state.sys.print("(19)");
        }
        //SNIP-END
    };

    _applyLabels(blob: any, v: string) {
        let txt;
        if (!this.label || !this.label[this.labelVariable]) {
            return blob;
        }
        let plural = 0;
        let num = this.freeters_count[v] + this.institutions_count[v];
        if (num > 1) {
            plural = 1;
        } else {
            for (let i = 0, ilen = this.persons[v].length; i < ilen; i += 1) {
                num += this.persons_count[v][i];
            }
            if (num > 1) {
                plural = 1;
            }
        }
        // Some code duplication here, should be factored out.
        if (this.label[this.labelVariable].before) {
            if ("number" === typeof this.label[this.labelVariable].before.strings.plural) {
                plural = this.label[this.labelVariable].before.strings.plural;
            }
            txt = this._buildLabel(v, plural, "before", this.labelVariable);
            this.state.output.openLevel("empty");
            this.state.output.append(txt, this.label[this.labelVariable].before, true);
            this.state.output.append(blob, "literal", true);
            this.state.output.closeLevel("empty");
            blob = this.state.output.pop();
        } else if (this.label[this.labelVariable].after) {
            if ("number" === typeof this.label[this.labelVariable].after.strings.plural) {
                plural = this.label[this.labelVariable].after.strings.plural;
            }
            txt = this._buildLabel(v, plural, "after", this.labelVariable);
            this.state.output.openLevel("empty");
            this.state.output.append(blob, "literal", true);
            this.state.output.append(txt, this.label[this.labelVariable].after, true);
            this.state.tmp.label_blob = this.state.output.pop();
            this.state.output.append(this.state.tmp.label_blob,"literal",true);
            this.state.output.closeLevel("empty");
            blob = this.state.output.pop();
        }
        return blob;
    };

    _buildLabel(term: string, plural: number, position: string, v: string) {
        if (this.common_term) {
            term = this.common_term;
        }

        let ret = false;
        const node = this.label[v][position];
        if (node) {
            ret = CSL.castLabel(this.state, node, term as string, plural as number, TOLERANT);
        }
        return ret;
    };

    _collapseAuthor() {
        let myqueue, mystr, oldchars;
        // collapse can be undefined, an array of length zero, and probably
        // other things ... ugh.
        if (this.state.tmp.name_node.top.blobs.length === 0) {
            return;
        }
        if (this.nameset_base === 0 && this.Item[this.variables[0]] && !this._first_creator_variable) {
            this._first_creator_variable = this.variables[0];
        }
        if ((this.state[this.state.tmp.area].opt.collapse
                && this.state[this.state.tmp.area].opt.collapse.length)
            || (this.state[this.state.tmp.area].opt.cite_group_delimiter 
                && this.state[this.state.tmp.area].opt.cite_group_delimiter.length)) {

            if (this.state.tmp.authorstring_request) {
                // Avoid running this on every call to getAmbiguousCite()?
                mystr = "";
                myqueue = this.state.tmp.name_node.top.blobs.slice(-1)[0].blobs;
                oldchars = this.state.tmp.offset_characters;
                if (myqueue) {
                    mystr = this.state.output.string(this.state, myqueue, false);
                }
                // Avoid side-effects on character counting: we're only interested
                // in the final rendering.
                this.state.tmp.offset_characters = oldchars;
                this.state.registry.authorstrings[this.Item.id] = mystr;
            } else if (!this.state.tmp.just_looking
                       && !this.state.tmp.suppress_decorations && ((this.state[this.state.tmp.area].opt.collapse && this.state[this.state.tmp.area].opt.collapse.length) || this.state[this.state.tmp.area].opt.cite_group_delimiter && this.state[this.state.tmp.area].opt.cite_group_delimiter)) {
                // XX1 this.state.sys.print("RENDER: "+this.Item.id);
                mystr = "";
                myqueue = this.state.tmp.name_node.top.blobs.slice(-1)[0].blobs;
                oldchars = this.state.tmp.offset_characters;
                if (myqueue) {
                    mystr = this.state.output.string(this.state, myqueue, false);
                }
                if (mystr === this.state.tmp.last_primary_names_string) {
                    if (this.item["suppress-author"] || (this.state[this.state.tmp.area].opt.collapse && this.state[this.state.tmp.area].opt.collapse.length)) {
                        // XX1 this.state.sys.print("    CUT!");
                        this.state.tmp.name_node.top.blobs.pop();
                        this.state.tmp.name_node.children = [];
                        // If popped, avoid side-effects on character counting: we're only interested
                        // in things that actually render.
                        this.state.tmp.offset_characters = oldchars;
                    }
                    // Needed
                    if (this.state[this.state.tmp.area].opt.cite_group_delimiter && this.state[this.state.tmp.area].opt.cite_group_delimiter) {
                        this.state.tmp.use_cite_group_delimiter = true;
                    }
                } else {
                    // XX1 this.state.sys.print("remembering: "+mystr);
                    this.state.tmp.last_primary_names_string = mystr;
                    // XXXXX A little more precision would be nice.
                    // This will clobber variable="author editor" as well as variable="author".

                    if (this.variables.indexOf(this._first_creator_variable as string) > -1 && this.item && this.item["suppress-author"] && this.Item.type !== "legal_case") {
                        this.state.tmp.name_node.top.blobs.pop();
                        this.state.tmp.name_node.children = [];
                        // If popped, avoid side-effects on character counting: we're only interested
                        // in things that actually render.
                        this.state.tmp.offset_characters = oldchars;

                        // A wild guess, but will usually be correct
                        this.state.tmp.term_predecessor = false;
                    }
                    // Arcane and probably unnecessarily complicated?
                    this.state.tmp.have_collapsed = false;
                    // Needed
                    if (this.state[this.state.tmp.area].opt.cite_group_delimiter && this.state[this.state.tmp.area].opt.cite_group_delimiter) {
                        this.state.tmp.use_cite_group_delimiter = false;
                    }
                }
            }
        }
    };

    /* snip
    suppressNames() {
        suppress_condition = suppress_min && display_names.length >= suppress_min;
        if (suppress_condition) {
            continue;
        }
    }
    */

    renderAllNames() {
        // Note that et-al/ellipsis parameters are set on the basis
        // of rendering order through the whole cite.
        let pos;
        for (let i = 0, ilen = this.variables.length; i < ilen; i += 1) {
            const v = this.variables[i];

            if (this.freeters[v].length || this.institutions[v].length) {
                if (!this.state.tmp.group_context.tip.condition) {
                    this.state.tmp.just_did_number = false;
                }
            }
            
            pos = this.nameset_base + i;
            if (this.freeters[v].length) {
                this.freeters[v] = this._renderNames(v, this.freeters[v], pos);
            }
            for (let j = 0, jlen = this.institutions[v].length; j < jlen; j += 1) {
                this.persons[v][j] = this._renderNames(v, this.persons[v][j], pos, j);
            }
        }
        this.renderInstitutionNames();
    };

    renderInstitutionNames() {
        // Institutions are split to string list as
        // this.institutions[v]["long"] and this.institutions[v]["short"]
        for (let i = 0, ilen = this.variables.length; i < ilen; i += 1) {
            const v = this.variables[i];
            for (let j = 0, jlen = this.institutions[v].length; j < jlen; j += 1) {
                let institution;

                let name = this.institutions[v][j];

                // XXX Start here for institutions
                // Figure out the three segments: primary, secondary, tertiary
                let localesets;
                if (this.state.tmp.extension) {
                    localesets = ["sort"];
                } else if (name.isInstitution || name.literal) {
                    // Will never hit this in this function, but preserving
                    // in case we factor this out.
                    localesets = this.state.opt['cite-lang-prefs'].institutions;
                } else {
                    localesets = this.state.opt['cite-lang-prefs'].persons;
                }

                const slot = {primary:'locale-orig',secondary:false,tertiary:false};
                if (localesets) {
                    const slotnames = ["primary", "secondary", "tertiary"];
                    for (let k = 0, klen = slotnames.length; k < klen; k += 1) {
                        if (localesets.length - 1 <  k) {
                            break;
                        }
                        if (localesets[k]) {
                            slot[slotnames[k]] = 'locale-' + localesets[k];
                        }
                    }
                } else {
                    slot.primary = 'locale-translat';
                }
                if (this.state.tmp.area !== "bibliography"
                    && !(this.state.tmp.area === "citation"
                         && this.state.opt.xclass === "note"
                         && this.item && !this.item.position)) {
                    
                    slot.secondary = false;
                    slot.tertiary = false;
                }
                // Get normalized name object for a start.
                // true invokes fallback
                this.setRenderedName(name);

                // XXXX FROM HERE (instututions)
                institution = this._renderInstitutionName(v, name, slot, j);

                //this.institutions[v][j] = this._join(institution, "");
                this.institutions[v][j] = institution;
            }
        }
    };

    _renderInstitutionName(v: string, name: any, slot: { primary: string; secondary?: string | boolean; tertiary?: string | boolean }, j: number) {
        let secondary, tertiary, long_style, short_style, institution, institution_short, institution_long;
        let res = this.getName(name, slot.primary, true);
        let primary = res.name;
        let usedOrig = res.usedOrig;
        if (primary) {
            //print("primary, v, j = "+primary+", "+v+", "+j);
            primary = this.fixupInstitution(primary, v, j);
        }
        secondary = false;
        if (slot.secondary) {
            res = this.getName(name, slot.secondary, false, usedOrig);
            let secondary = res.name;
            usedOrig = res.usedOrig;
            if (secondary) {
                secondary = this.fixupInstitution(secondary, v, j);
            }
        }
        //Zotero.debug("XXX [2] secondary: "+secondary["long"].literal+", slot.secondary: "+slot.secondary);
        tertiary = false;
        if (slot.tertiary) {
            res = this.getName(name, slot.tertiary, false, usedOrig);
            tertiary = res.name;
            if (tertiary) {
                tertiary = this.fixupInstitution(tertiary, v, j);
            }
        }
        const n = {
            l: {
                pri: false,
                sec: false,
                ter: false
            },
            s: {
                pri: false,
                sec: false,
                ter: false
            }
        };
        if (primary) {
            n.l.pri = primary["long"];
            n.s.pri = primary["short"].length ? primary["short"] : primary["long"];
        }
        if (secondary) {
            n.l.sec = secondary["long"];
            n.s.sec = secondary["short"].length ? secondary["short"] : secondary["long"];
        }
        if (tertiary) {
            n.l.ter = tertiary["long"];
            n.s.ter = tertiary["short"].length ? tertiary["short"] : tertiary["long"];
        }
        switch (this.institution.strings["institution-parts"]) {
        case "short":
            // No multilingual for pure short form institution names.
            if (primary["short"].length) {
                short_style = this._getShortStyle();
                institution = [this._composeOneInstitutionPart([n.s.pri, n.s.sec, n.s.ter], slot, short_style, v)];
            } else {
                // Fail over to long.
                long_style = this._getLongStyle(primary, v, j);
                institution = [this._composeOneInstitutionPart([n.l.pri, n.l.sec, n.l.ter], slot, long_style, v)];
            }
            break;
        case "short-long":
            long_style = this._getLongStyle(primary, v, j);
            short_style = this._getShortStyle();
            institution_short = this._renderOneInstitutionPart(primary["short"], short_style);
            // true is to include multilingual supplement
            institution_long = this._composeOneInstitutionPart([n.l.pri, n.l.sec, n.l.ter], slot, long_style, v);
            institution = [institution_short, institution_long];
            break;
        case "long-short":
            long_style = this._getLongStyle(primary, v, j);
            short_style = this._getShortStyle();
            institution_short = this._renderOneInstitutionPart(primary["short"], short_style);
            // true is to include multilingual supplement
            institution_long = this._composeOneInstitutionPart([n.l.pri, n.l.sec, n.l.ter], slot, long_style, v);
            institution = [institution_long, institution_short];
            break;
        default:
            long_style = this._getLongStyle(primary, v, j);
            // true is to include multilingual supplement
            institution = [this._composeOneInstitutionPart([n.l.pri, n.l.sec, n.l.ter], slot, long_style, v)];
            break;
        }
        let blob = this._join(institution, " ");
        if (blob) {
            blob.isInstitution = true;
        }
        this.state.tmp.name_node.children.push(blob);
        return blob;
    };

    _composeOneInstitutionPart(names: any[], slot: { primary: string; secondary?: string | boolean; tertiary?: string | boolean }, style: any, v?: string) {
        let primary = false, secondary = false, tertiary = false, primary_tok, secondary_tok, tertiary_tok;
        if (names[0]) {
            primary_tok = CSL.Util.cloneToken(style);
            if (this.state.opt.citeAffixes[slot.primary]){
                if ("<i>" === this.state.opt.citeAffixes.institutions[slot.primary].prefix) {
                    let hasItalic = false;
                    for (let i = 0, ilen = primary_tok.decorations.length; i < ilen; i += 1) {
                        if (style.decorations[i][0] === "@font-style"
                            && primary_tok.decorations[i][1] === "italic") {
                            hasItalic = true;
                        }
                    }
                    if (!hasItalic) {
                        primary_tok.decorations.push(["@font-style", "italic"]);
                    }
                }
            }
            primary = this._renderOneInstitutionPart(names[0], primary_tok);
         }
        if (names[1]) {
            secondary = this._renderOneInstitutionPart(names[1], style);
        }
        if (names[2]) {
            tertiary = this._renderOneInstitutionPart(names[2], style);
        }
        // Compose
        let institutionblob;
        if (secondary || tertiary) {
            this.state.output.openLevel("empty");

            this.state.output.append(primary);

            secondary_tok = CSL.Util.cloneToken(style);
            if (slot.secondary) {
                secondary_tok.strings.prefix = this.state.opt.citeAffixes.institutions[slot.secondary as string].prefix;
                secondary_tok.strings.suffix = this.state.opt.citeAffixes.institutions[slot.secondary as string].suffix;
                // Add a space if empty
                if (!secondary_tok.strings.prefix) {
                    secondary_tok.strings.prefix = " ";
                }
            }
            const secondary_outer = new CSL.Token();
            secondary_outer.decorations.push(["@font-style", "normal"]);
            secondary_outer.decorations.push(["@font-weight", "normal"]);
            this.state.output.openLevel(secondary_outer);
            this.state.output.append(secondary, secondary_tok);
            this.state.output.closeLevel();

            tertiary_tok = CSL.Util.cloneToken(style);
            if (slot.tertiary) {
                tertiary_tok.strings.prefix = this.state.opt.citeAffixes.institutions[slot.tertiary as string].prefix;
                tertiary_tok.strings.suffix = this.state.opt.citeAffixes.institutions[slot.tertiary as string].suffix;
                // Add a space if empty
                if (!tertiary_tok.strings.prefix) {
                    tertiary_tok.strings.prefix = " ";
                }
            }
            const tertiary_outer = new CSL.Token();
            tertiary_outer.decorations.push(["@font-style", "normal"]);
            tertiary_outer.decorations.push(["@font-weight", "normal"]);
            this.state.output.openLevel(tertiary_outer);
            this.state.output.append(tertiary, tertiary_tok);
            this.state.output.closeLevel();

            this.state.output.closeLevel();

            institutionblob = this.state.output.pop();
        } else {
            institutionblob = primary;
        }
        return institutionblob;
    };

    _renderOneInstitutionPart(blobs: any[], style: any) {
        for (let i = 0, ilen = blobs.length; i < ilen; i += 1) {
            if (blobs[i]) {
                let str = blobs[i];
                // XXXXX Cut-and-paste code in multiple locations. This code block should be
                // collected in a function.
                // Tag: strip-periods-block
                if (this.state.tmp.strip_periods) {
                    str = str.replace(/\./g, "");
                } else {
                    for (let j = 0, jlen = style.decorations.length; j < jlen; j += 1) {
                        if ("@strip-periods" === style.decorations[j][0] && "true" === style.decorations[j][1]) {
                            str = str.replace(/\./g, "");
                            break;
                        }
                    }
                }
                //this.state.output.append(blobs[i], style, true);
                this.state.tmp.group_context.tip.variable_success = true;
                this.state.tmp.can_substitute.replace(false, LITERAL);
                if (str === "!here>>>") {
                    blobs[i] = false;
                } else {
                    this.state.output.append(str, style, true);
                    blobs[i] = this.state.output.pop();
                }
            }
        }
        if ("undefined" === typeof this.institution.strings["part-separator"]) {
            this.institution.strings["part-separator"] = this.state.tmp.name_delimiter;
        }
        return this._join(blobs, this.institution.strings["part-separator"]);
    };

    _renderNames(v: string, values: any[], pos: number, j?: number): any {
        //
        let ret: any = false;
        if (values.length) {
            const names = [];
            for (let i = 0, ilen = values.length; i < ilen; i += 1) {
                let name = values[i];
                
                // XXX We'll start here with attempts.
                // Figure out the three segments: primary, secondary, tertiary
                let ret, localesets;
                
                if (this.state.tmp.extension) {
                    localesets = ["sort"];
                } else if (name.isInstitution || name.literal) {
                    // Will never hit this in this function, but preserving
                    // in case we factor this out.
                    localesets = this.state.opt['cite-lang-prefs'].institutions;
                } else {
                    localesets = this.state.opt['cite-lang-prefs'].persons;
                }
                const slot = {primary:'locale-orig',secondary:false,tertiary:false};
                if (localesets) {
                    const slotnames = ["primary", "secondary", "tertiary"];
                    for (let k = 0, klen = slotnames.length; k < klen; k += 1) {
                        if (localesets.length - 1 <  k) {
                            break;
                        }
                        slot[slotnames[k]] = 'locale-' + localesets[k];
                    }
                } else {
                    slot.primary = 'locale-translat';
                }
                if (this.state.tmp.sort_key_flag || (this.state.tmp.area !== "bibliography"
                    && !(this.state.tmp.area === "citation"
                         && this.state.opt.xclass === "note"
                         && this.item && !this.item.position))) {
                    
                    slot.secondary = false;
                    slot.tertiary = false;
                }

                // primary
                // true is for fallback
                this.setRenderedName(name);

                if (!name.literal && !name.isInstitution) {
                    const nameBlob = this._renderPersonalName(v, name, slot, pos, i, j);
                    const nameToken = CSL.Util.cloneToken(this.name);
                    this.state.output.append(nameBlob, nameToken, true);
                    names.push(this.state.output.pop());
                } else {
                    names.push(this._renderInstitutionName(v, name, slot, j));
                }
            }
            //ret = this._join(names, "");
            ret = this.joinPersons(names, pos, j);
        }
        return ret;
    };


    _renderPersonalName(v: string, name: any, slot: { primary: string; secondary?: string | boolean; tertiary?: string | boolean }, pos: number, i: number, j?: number) {
        // XXXX FROM HERE (persons)

        let res = this.getName(name, slot.primary, true);
        let primary = this._renderOnePersonalName(res.name, pos, i, j);
        let secondary = false;
        if (slot.secondary) {
            res = this.getName(name, slot.secondary, false, res.usedOrig);
            if (res.name) {
                secondary = this._renderOnePersonalName(res.name, pos, i, j);
            }
        }
        let tertiary = false;
        if (slot.tertiary) {
            res = this.getName(name, slot.tertiary, false, res.usedOrig);
            if (res.name) {
                tertiary = this._renderOnePersonalName(res.name, pos, i, j);
            }
        }
        // Now compose them to a unit
        let personblob;
        if (secondary || tertiary) {

            this.state.output.openLevel("empty");

            this.state.output.append(primary);

            let secondary_tok = new CSL.Token();
            if (slot.secondary) {
                secondary_tok.strings.prefix = this.state.opt.citeAffixes.persons[slot.secondary as string].prefix;
                secondary_tok.strings.suffix = this.state.opt.citeAffixes.persons[slot.secondary as string].suffix;
                // Add a space if empty
                if (!secondary_tok.strings.prefix) {
                    secondary_tok.strings.prefix = " ";
                }
            }
            this.state.output.append(secondary, secondary_tok);

            let tertiary_tok = new CSL.Token();
            if (slot.tertiary) {
                tertiary_tok.strings.prefix = this.state.opt.citeAffixes.persons[slot.tertiary as string].prefix;
                tertiary_tok.strings.suffix = this.state.opt.citeAffixes.persons[slot.tertiary as string].suffix;
                // Add a space if empty
                if (!tertiary_tok.strings.prefix) {
                    tertiary_tok.strings.prefix = " ";
                }
            }
            this.state.output.append(tertiary, tertiary_tok);

            this.state.output.closeLevel();

            personblob = this.state.output.pop();
        } else {
            personblob = primary;
        }
        return personblob;
    };

    /** Japanese */
    _isJapanese(name: CslName) 
    {
        /**
        0: Not japanese
        1: Japanese
        */
        let ret = 0;
        let top_locale;
        if(name.multi && name.multi.main) {
            top_locale = name.multi.main.slice(0, 2);
        } else if (this.Item.language) {
            top_locale = this.Item.language.slice(0, 2);
        }
        if(top_locale==="ja") {
            ret = 1;
        }
        return ret;
    }

    _isKatakana(name: CslName) {
        // 0 =　katakana + kanji || hiragana => Normal Japanese
        // 1 = katakana or katakana + initial.
        let ret = 0;
        let fullname = name.family.replace(/\"/g, '');
        if(name.given)
        {
            fullname = name.family.replace(/\"/g, '')+name.given.replace(/\"/g, '');
        }
        
        if(fullname.match(KATAKANA_REGEXP)) {
            ret = 1;
        }
        else if(name.family.replace(/\"/g, '').match(KATAKANA_REGEXP) && name.given.match(STARTSWITH_KATAKANA_REGEXP))
        {
            /**
            Initial in given name
            */
            ret = 1;
        }
        return ret;
    }

    /***/

    _isRomanesque(name: CslName) {
        // 0 = entirely non-romanesque
        // 1 = mixed content
        // 2 = pure romanesque
        let ret = 2;
        if (!name.family.replace(/\"/g, '').match(ROMANESQUE_REGEXP)) {
            ret = 0;
        }
        if (!ret && name.given && name.given.match(STARTSWITH_ROMANESQUE_REGEXP)) {
            ret = 1;
        }
        let top_locale;
        
        if (ret == 2) {
            if (name.multi && name.multi.main) {
                top_locale = name.multi.main.slice(0, 2);
            } else if (this.Item.language) {
                top_locale = this.Item.language.slice(0, 2);
            }
            if (["ja", "zh"].indexOf(top_locale) > -1) {
                ret = 1;
            }
        }
        //print("name: "+name.given+", multi: "+name.multi+", ret: "+ret);
        return ret;
    };

    /**
    It would be great if this function was renamed something like _renderCJK(language, name, non_dropping_particle, given, family, sort_sep) in the future. Japanese should work as long as family and given are provided.
    */
    _renderJapaneseName(japanese: number, katakana: number, family: any, given: any, i: number, j: number | undefined, sort_sep: string) {
        let blob;
        /**
        katakana-display
        "legacy-order": セイメイ 
        "normal-order": メイ、セイ and セイ・メイ (Family, Given and Given・Family)
        */
        
        /**
        Take care of "and", which will not be displayed for Japanese. It will be likely "symbol", used for English names
        Leave delimiter only
        This is a hacky way to override "name.and". Looking for a better idea.
        */
        this.name.and.single.strings.prefix="";
        this.name.and.single.strings.suffix="";
        this.name.and.single.blobs=this.name.strings.delimiter;
        
        this.name.and.multiple.blobs=this.name.strings.delimiter;
        this.name.and.multiple.strings.prefix="";
        this.name.and.multiple.strings.suffix="";
        
        if(katakana===1 && this.state.opt["katakana-display"]!=="legacy-order")
        {
            if (this.state.inheritOpt(this.name, "name-as-sort-order") === "all" || (this.state.inheritOpt(this.name, "name-as-sort-order") === "first" && i === 0 && (j === 0 || "undefined" === typeof j)))
            {
                blob = this._join([family, given], sort_sep);
            }
            else
            {
                blob = this._join([given, family], "・");
            }
        }
        
        /**
        1. Some styles in Japanese require space between Family and Given. We should allow affixing in Japanese too.
        2. This should be the default but if it leads to issues for existing Japanese styles, we could add a global option to activate it as well. e.g. kanji-display: ["legacy-order", "normal-order"]. It depends on how much we can "pollute" the global options :D 
        */
        else if(japanese===1)
        {
            /*
            Romanesque names will not lead here even if language-name is ja
            */
            
            if(this.family && this.family.strings) {
                family.strings.prefix = this.family.strings.prefix;
                family.strings.suffix = this.family.strings.suffix;
            }
            if(this.given && this.given.strings) {
                given.strings.prefix = this.given.strings.prefix;
                given.strings.suffix = this.given.strings.suffix;
            }
            blob = this._join([family, given], "");
        }
        return blob;
    }

    _renderOnePersonalName(value: any, pos: number, i: number, j?: number) {
        let name = value;
        let dropping_particle = this._droppingParticle(name, pos, j);
        let family = this._familyName(name);
        const non_dropping_particle = this._nonDroppingParticle(name);
        const givenInfo = this._givenName(name, pos, i);
        const given = givenInfo.blob;
        let suffix = this._nameSuffix(name);
        if (given === false) {
            dropping_particle = false;
            suffix = false;
        }
        let sort_sep = this.state.inheritOpt(this.name, "sort-separator");
        
        if (!sort_sep) {
            sort_sep = "";
        }
        let suffix_sep;
        if (name["comma-suffix"]) {
            suffix_sep = ", ";
        } else {
            suffix_sep = " ";
        }
        let romanesque = this._isRomanesque(name);
        const katakana = this._isKatakana(name);
        let japanese = this._isJapanese(name);
        
        function hasJoiningPunctuation(blob: any) {
            if (!blob) {
                return false;
            } else if ("string" === typeof blob.blobs) {
                if (["\u2019", "\'", "-", " "].indexOf(blob.blobs.slice(-1)) > -1) {
                    return true;
                } else {
                    return false;
                }
            } else {
                return hasJoiningPunctuation(blob.blobs[blob.blobs.length-1]);
            }
        }
        
        const has_hyphenated_non_dropping_particle = hasJoiningPunctuation(non_dropping_particle);

        let nbspace;
        if (["fr", "ru", "cs"].indexOf(this.state.opt["default-locale"][0].slice(0, 2)) > -1) {
            nbspace = "\u00a0";
        } else {
            nbspace = " ";
        }
        
        /**
        Keep roman rendering if name is Romanesque but language is Japanese
        The style may still depend on language to render other parts
        */
        if((romanesque===2 || romanesque===1) && japanese===1){
            japanese = 0;
            romanesque = 2;
        }
        
        let blob, merged, first, second;
            
        if (romanesque === 0) {
            if((katakana===1 && this.state.opt["katakana-display"]!=="legacy-order") || japanese===1){
                blob = this._renderJapaneseName(japanese, katakana, family, given, i, j, sort_sep);
            } else {
                // XXX handle affixes for given and family
                blob = this._join([non_dropping_particle, family, given], "");
            }
        }
        else if((katakana===1 && this.state.opt["katakana-display"]!=="legacy-order") || japanese===1){
            /*
            Sometimes katakana can be partially romanesque when mixed with initials.
            Initializing katakana is difficult programatically.
            */
            blob = this._renderJapaneseName(japanese, katakana, family, given, i, j, sort_sep);
        } else if (romanesque === 1 || name["static-ordering"]) { // entry likes sort order
            merged = this._join([non_dropping_particle, family], nbspace);
            blob = this._join([merged, given], " ");
        } else if (name["reverse-ordering"]) { // entry likes reverse order
            merged = this._join([non_dropping_particle, family], nbspace);
            blob = this._join([given, merged], " ");
        } else if (this.state.tmp.sort_key_flag) {
            // ok with no affixes here
            if (this.state.opt["demote-non-dropping-particle"] === "never") {
                merged = this._join([non_dropping_particle, family], nbspace);
                merged = this._join([merged, dropping_particle], " ");
                merged = this._join([merged, given], this.state.opt.sort_sep);
                blob = this._join([merged, suffix], " ");
            } else {
                second = this._join([given, dropping_particle, non_dropping_particle], " ");
                merged = this._join([family, second], this.state.opt.sort_sep);
                blob = this._join([merged, suffix], " ");
            }
        } else if (this.state.inheritOpt(this.name, "name-as-sort-order") === "all" || (this.state.inheritOpt(this.name, "name-as-sort-order") === "first" && i === 0 && (j === 0 || "undefined" === typeof j))) {
            //
            // Discretionary sort ordering and inversions
            //
            if (["Lord", "Lady"].indexOf(name.given) > -1) {
                sort_sep = ", ";
            }

            // XXX Needs a more robust solution than this
            // XXX See https://forums.zotero.org/discussion/30974/any-idea-why-an-a-author-comes-last-in-the-bibliography/#Item_30

            //if (["always", "display-and-sort"].indexOf(this.state.opt["demote-non-dropping-particle"]) > -1 && !has_hyphenated_non_dropping_particle) {
            if (["always", "display-and-sort"].indexOf(this.state.opt["demote-non-dropping-particle"]) > -1) {
                // Drop non-dropping particle
                //second = this._join([given, dropping_particle, non_dropping_particle], " ");
                second = this._join([given, dropping_particle], (name["comma-dropping-particle"] + " "));
            
                // This would be a problem with al-Ghazali. Avoided by has_hyphenated_non_dropping_particle check above.
                second = this._join([second, non_dropping_particle], " ");
                if (second && this.given) {
                    second.strings.prefix = this.given.strings.prefix;
                    second.strings.suffix = this.given.strings.suffix;
                }
                if (family && this.family) {
                    family.strings.prefix = this.family.strings.prefix;
                    family.strings.suffix = this.family.strings.suffix;
                }
                merged = this._join([family, second], sort_sep);
                blob = this._join([merged, suffix], sort_sep);
            } else {
                // Don't drop particle.
                // Don't do this
                //if (this.state.tmp.area === "bibliography" && !this.state.tmp.term_predecessor && non_dropping_particle) {
                //    if (!has_hyphenated_non_dropping_particle) {
                //        non_dropping_particle.blobs = CSL.Output.Formatters["capitalize-first"](this.state, non_dropping_particle.blobs)
                //    }
                //}
                if (has_hyphenated_non_dropping_particle) {
                    first = this._join([non_dropping_particle, family], "");
                } else {
                    first = this._join([non_dropping_particle, family], nbspace);
                }
                if (first && this.family) {
                    first.strings.prefix = this.family.strings.prefix;
                    first.strings.suffix = this.family.strings.suffix;
                }

                second = this._join([given, dropping_particle], (name["comma-dropping-particle"] + " "));
                //second = this._join([given, dropping_particle], " ");
                if (second && this.given) {
                    second.strings.prefix = this.given.strings.prefix;
                    second.strings.suffix = this.given.strings.suffix;
                }

                merged = this._join([first, second], sort_sep);
                blob = this._join([merged, suffix], sort_sep);
            }
            blob.isInverted = true;
        } else { // plain vanilla
            if (name["dropping-particle"] && name.family && !name["non-dropping-particle"]) {
                let dp = name["dropping-particle"];
                const apostrophes = ["'","\u02bc","\u2019","-"];
                if (apostrophes.indexOf(dp.slice(-1)) > -1 && dp.slice(0, -1) !== "de") {
                    family = this._join([dropping_particle, family], "");
                    dropping_particle = false;
                }
            }

            if (has_hyphenated_non_dropping_particle) {
                second = this._join([non_dropping_particle, family], "");
                second = this._join([dropping_particle, second], nbspace);
            } else {
                second = this._join([dropping_particle, non_dropping_particle, family], nbspace);
            }
            second = this._join([second, suffix], suffix_sep);
            if (second && this.family) {
                second.strings.prefix = this.family.strings.prefix;
                second.strings.suffix = this.family.strings.suffix;
            }
            if (given && this.given) {
                given.strings.prefix = this.given.strings.prefix;
                given.strings.suffix = this.given.strings.suffix;
            }
            if (second.strings.prefix) {
                name["comma-dropping-particle"] = "";
            }

            let space;
            if (this.state.inheritOpt(this.name, "initialize-with")
                && this.state.inheritOpt(this.name, "initialize-with").match(/[\u00a0\ufeff]/)
                && givenInfo.initializationLevel === 1) {
                
                space = nbspace;
            } else {
                space = " ";
            }
            blob = this._join([given, second], (name["comma-dropping-particle"] + space));
        }
        // XXX Just generally assume for the present that personal names render something
        this.state.tmp.group_context.tip.variable_success = true;
        this.state.tmp.can_substitute.replace(false, LITERAL);
        this.state.tmp.term_predecessor = true;
        // notSerious
        //this.state.output.append(blob, "literal", true);
        //let ret = this.state.output.pop();
        this.state.tmp.name_node.children.push(blob);
        return blob;
    };

    /*
            // Do not include given name, dropping particle or suffix in strict short form of name

            // initialize if appropriate
    */

    // Input names should be touched by _normalizeNameInput()
    // exactly once: this is not idempotent.
    _normalizeNameInput(value: any) {
        let name = {
            literal:value.literal,
            family:value.family,
            isInstitution:value.isInstitution,
            given:value.given,
            suffix:value.suffix,
            "comma-suffix":value["comma-suffix"],
            "non-dropping-particle":value["non-dropping-particle"],
            "dropping-particle":value["dropping-particle"],
            "static-ordering":value["static-ordering"],
            "static-particles":value["static-particles"],
            "reverse-ordering":value["reverse-ordering"],
            "full-form-always": value["full-form-always"],
            "parse-names":value["parse-names"],
            "comma-dropping-particle": "",
            block_initialize:value.block_initialize,
            multi:value.multi
        };
        this._parseName(name);
        return name;
    };

    // _transformNameset() replaced with enhanced transform.name().

    _stripPeriods(tokname: any, str: any) {
        const decor_tok = this[tokname + "_decor"];
        if (str) {
            if (this.state.tmp.strip_periods) {
                str = str.replace(/\./g, "");
            } else  if (decor_tok) {
                for (let i = 0, ilen = decor_tok.decorations.length; i < ilen; i += 1) {
                    if ("@strip-periods" === decor_tok.decorations[i][0] && "true" === decor_tok.decorations[i][1]) {
                        str = str.replace(/\./g, "");
                        break;
                    }
                }
            }
        }
        return str;
    };

    _nonDroppingParticle(name: any) {
        let ndp = name["non-dropping-particle"];
        if (ndp && this.state.tmp.sort_key_flag) {
            ndp = ndp.replace(/[\'\u2019]/, "");
        }
        let str = this._stripPeriods("family", ndp);
        if (this.state.output.append(str, this.family_decor, true)) {
            return this.state.output.pop();
        }
        return false;
    };

    _droppingParticle(name: any, pos: any, j: any) {
        let dp = name["dropping-particle"];
        if (dp && this.state.tmp.sort_key_flag) {
            dp = dp.replace(/[\'\u2019]/, "");
        }
        let str = this._stripPeriods("given", dp);
        if (name["dropping-particle"] && name["dropping-particle"].match(/^et.?al[^a-z]$/)) {
            if (this.state.inheritOpt(this.name, "et-al-use-last")) {
                if ("undefined" === typeof j) { 
                    this.etal_spec[pos].freeters = 2;
                } else {
                    this.etal_spec[pos].persons = 2;
                }
            } else {
                if ("undefined" === typeof j) { 
                    this.etal_spec[pos].freeters = 1;
                } else {
                    this.etal_spec[pos].persons = 1;
                }
            }
            name["comma-dropping-particle"] = "";
        } else if (this.state.output.append(str, this.given_decor, true)) {
            return this.state.output.pop();
        }
        return false;
    };

    _familyName(name: any) {
        let str = this._stripPeriods("family", name.family);
        if (this.state.output.append(str, this.family_decor, true)) {
            return this.state.output.pop();
        }
        return false;
    };

    _givenName(name: any, pos: any, i: any) {
        let ret;
        // citation
        //   use disambig as-is
        // biblography
        //   use disambig only if it boosts over the default
        //   SO WHAT IS THE DEFAULT?
        //   A: If "form" is short, it's 0.
        //      If "form" is long, initialize-with exists (and initialize is not false) it's 1
        //      If "form" is long, and initialize_with does not exist, it's 2.
        const formIsShort = this.state.inheritOpt(this.name, "form", "name-form", "long") !== "long";
        const initializeIsTurnedOn = this.state.inheritOpt(this.name, "initialize") !== false;
        let hasInitializeWith = "string" === typeof this.state.inheritOpt(this.name, "initialize-with") && !name.block_initialize;
        let defaultLevel;
        let useLevel;
        if (name["full-form-always"]) {
            useLevel = 2;
        } else {
            if (formIsShort) {
                defaultLevel = 0;
            } else if (hasInitializeWith) {
                defaultLevel = 1;
            } else {
                defaultLevel = 2;
            }
            const requestedLevel = this.state.tmp.disambig_settings.givens[pos][i];
            if (requestedLevel > defaultLevel) {
                useLevel = requestedLevel;
            } else {
                useLevel = defaultLevel;
            }
        }
        const gdropt = this.state.citation.opt["givenname-disambiguation-rule"];
       if (gdropt && gdropt.slice(-14) === "-with-initials") {
            hasInitializeWith = true;
        }
        if (name.family && useLevel === 1) {
            if (hasInitializeWith) {
                const initialize_with = this.state.inheritOpt(this.name, "initialize-with", false, "");
                name.given = CSL.Util.Names.initializeWith(this.state, name.given, initialize_with, !initializeIsTurnedOn);
            } else {
                name.given = CSL.Util.Names.unInitialize(this.state, name.given);
            }
        } else if (useLevel === 0) {
            return {
                blob: false
            }
        } else if (useLevel === 2) {
            name.given = CSL.Util.Names.unInitialize(this.state, name.given);
        }

        let str = this._stripPeriods("given", name.given);
        const rendered = this.state.output.append(str, this.given_decor, true);
        if (rendered) {
            ret = this.state.output.pop();
            return {
                blob: ret,
                initializationLevel: useLevel
            };
        }
        return {
            blob: false
        };
    };

    _nameSuffix(name: any) {

        let str = name.suffix, ret;

        if (str && "string" === typeof this.state.inheritOpt(this.name, "initialize-with")) {
            str = CSL.Util.Names.initializeWith(this.state, str, this.state.inheritOpt(this.name, "initialize-with"), true);
        }

        str = this._stripPeriods("family", str);
        let toSuffix = '';
        if (str && str.slice(-1) === '.') {
            str = str.slice(0, -1);
            toSuffix = '.';
        }
        const rendered = this.state.output.append(str, "empty", true);
        if (rendered) {
            ret = this.state.output.pop();
            ret.strings.suffix = toSuffix + ret.strings.suffix;
            return ret;
        }
        return false;
    };

    _getLongStyle(name: any, v?: any, j?: any) {
        let long_style;
        if (name["short"].length) {
            if (this.institutionpart["long-with-short"]) {
                long_style = this.institutionpart["long-with-short"];
            } else {
                long_style = this.institutionpart["long"];
            }
        } else {
            long_style = this.institutionpart["long"];
        }
        if (!long_style) {
            long_style = new CSL.Token();
        }
        return long_style;
    };

    _getShortStyle() {
        let short_style;
        if (this.institutionpart["short"]) {
            short_style = this.institutionpart["short"];
        } else {
            short_style = new CSL.Token();
        }
        return short_style;
    };

    _parseName(name: any) {
        if (!name["parse-names"] && "undefined" !== typeof name["parse-names"]) {
            return name;
        }
        if (name.family && !name.given && name.isInstitution) {
            name.literal = name.family;
            name.family = undefined;
            name.isInstitution = undefined;
        }
        let noparse;
        if (name.family 
            && (name.family.slice(0, 1) === '"' && name.family.slice(-1) === '"')
            || (!name["parse-names"] && "undefined" !== typeof name["parse-names"])) {

            name.family = name.family.slice(1, -1);
            noparse = true;
            name["parse-names"] = 0;
        } else {
            noparse = false;
        }
        if (this.state.opt.development_extensions.parse_names) {
            if (!name["non-dropping-particle"] && name.family && !noparse && name.given) {
                if (!name["static-particles"]) {
                    CSL.parseParticles(name, true);
                }
            }
        }
    };

    /*
     * Return a single name object
      */

    // The interface is a mess, but this should serve.

    getName(name: any, slotLocaleset: any, fallback: any, stopOrig?: any) {

        // Needs to tell us whether we used orig or not.
        
        if (stopOrig && slotLocaleset === 'locale-orig') {
            return {name:false,usedOrig:stopOrig};
        }

        // Normalize to string
        if (!name.family) {
            name.family = "";
        }
        if (!name.given) {
            name.given = "";
        }

        // Recognized params are:
        //  block-initialize
        //  transliterated
        //  static-ordering
        //  full-form-always
        // All default to false, except for static-ordering, which is initialized
        // with a sniff.
        let name_params: any = {};
        // Determines the default static-order setting based on the characters
        // used in the headline field. Will be overridden by locale-based
        // parameters evaluated against explicit lang tags set on the (sub)field.
        name_params["static-ordering"] = this.getStaticOrder(name);

        let foundTag = true;
        let langTag;
        if (slotLocaleset !== 'locale-orig') {
            foundTag = false;
            if (name.multi) {
                const langTags = this.state.opt[slotLocaleset];
                for (let i = 0, ilen = langTags.length; i < ilen; i += 1) {
                    langTag = langTags[i];
                    if (name.multi._key[langTag]) {
                        foundTag = true;
                        const isInstitution = name.isInstitution;
                        name = name.multi._key[langTag];
                        name.isInstitution = isInstitution;
                        // Set name formatting params
                        name_params = this.getNameParams(langTag);
                        name_params.transliterated = true;
                        break;
                    }
                }
            }
        }

        if (!foundTag) {
            langTag = false;
            if (name.multi && name.multi.main) {
                langTag = name.multi.main;
            } else if (this.Item.language) {
                langTag = this.Item.language;
            }
            if (langTag) {
                name_params = this.getNameParams(langTag);
            }
        }

        if (!fallback && !foundTag) {
            return {name:false,usedOrig:stopOrig};
        }
        
        // Normalize to string (again)
        if (!name.family) {
            name.family = "";
        }
        if (!name.given) {
            name.given = "";
        }
        if (name.literal) {
            delete name.family;
            delete name.given;
        }
        // let clone the item before writing into it
        name = {
            family:name.family,
            given:name.given,
            "non-dropping-particle":name["non-dropping-particle"],
            "dropping-particle":name["dropping-particle"],
            suffix:name.suffix,
            "static-ordering":name_params["static-ordering"],
            "static-particles":name["static-particles"],
            "reverse-ordering":name_params["reverse-ordering"],
            "full-form-always": name_params["full-form-always"],
            "parse-names":name["parse-names"],
            "comma-suffix":name["comma-suffix"],
            "comma-dropping-particle":name["comma-dropping-particle"],
            transliterated: name_params.transliterated,
            block_initialize: name_params["block-initialize"],
            literal:name.literal,
            isInstitution:name.isInstitution,
            multi:name.multi
        };
        
        if (!name.literal && (!name.given && name.family && name.isInstitution)) {
            name.literal = name.family;
        }
        if (name.literal) {
            delete name.family;
            delete name.given;
        }
        name = this._normalizeNameInput(name);
        let usedOrig;
        if (stopOrig) {
            usedOrig = stopOrig;
        } else {
            usedOrig = !foundTag;
        }
        return {name:name,usedOrig:usedOrig};
    };

    getNameParams(langTag: any) {
        let ret = {};
        const langspec = CSL.localeResolve(this.Item.language, this.state.opt["default-locale"][0]);
        const try_locale = this.state.locale[langspec.best] ? langspec.best : this.state.opt["default-locale"][0];
        const name_as_sort_order = this.state.locale[try_locale].opts["name-as-sort-order"];
        const name_as_reverse_order = this.state.locale[try_locale].opts["name-as-reverse-order"];
        const name_never_short = this.state.locale[try_locale].opts["name-never-short"];
        const field_lang_bare = langTag.split("-")[0];
        if (name_as_sort_order && name_as_sort_order[field_lang_bare]) {
            ret["static-ordering"] = true;
            ret["reverse-ordering"] = false;
        }
        if (name_as_reverse_order && name_as_reverse_order[field_lang_bare]) {
            ret["reverse-ordering"] = true;
            ret["static-ordering"] = false;
        }
        if (name_never_short && name_never_short[field_lang_bare]) {
            ret["full-form-always"] = true;
        }
        
        if (ret["static-ordering"]) {
            ret["block-initialize"] = true;
        }
        return ret;
    };

    setRenderedName(name: any) {
        if (this.state.tmp.area === "bibliography") {
            let strname = "";
            for (let j=0,jlen=NAME_PARTS.length;j<jlen;j+=1) {
                if (name[NAME_PARTS[j]]) {
                    strname += name[NAME_PARTS[j]];
                }
            }
            this.state.tmp.rendered_name.push(strname);
        }
    };

    fixupInstitution(name: any, varname: any, listpos: any) {
        if (!name.literal && name.family) {
            name.literal = name.family;
            delete name.family;
        }
        let longNameStr = name.literal;
        let shortNameStr = longNameStr;
        let ret = {
            "long": longNameStr.split(/\s*\|\s*/),
            "short": shortNameStr.split(/\s*\|\s*/),
        };
        if (this.state.sys.getAbbreviation) {
            // Normalize longNameStr and shortNameStr
            if (this.institution.strings.form === "short") {
                let jurisdiction = this.Item.jurisdiction;
                jurisdiction = this.state.transform.loadAbbreviation(jurisdiction, "institution-entire", longNameStr, this.Item.language);
                if (this.state.transform.abbrevs[jurisdiction]["institution-entire"][longNameStr]) {
                    longNameStr = this.state.transform.abbrevs[jurisdiction]["institution-entire"][longNameStr];
                } else {
                    jurisdiction = this.Item.jurisdiction;
                    jurisdiction = this.state.transform.loadAbbreviation(jurisdiction, "institution-part", longNameStr, this.Item.language);
                    if (this.state.transform.abbrevs[jurisdiction]["institution-part"][longNameStr]) {
                        longNameStr = this.state.transform.abbrevs[jurisdiction]["institution-part"][longNameStr];
                    }
                }
                longNameStr = this._quashChecks(jurisdiction, longNameStr);
            }
            if (["short", "short-long", "long-short"].indexOf(this.institution.strings["institution-parts"]) > -1) {
                let jurisdiction = this.Item.jurisdiction;
                jurisdiction = this.state.transform.loadAbbreviation(jurisdiction, "institution-part", shortNameStr, this.Item.language);
                if (this.state.transform.abbrevs[jurisdiction]["institution-part"][shortNameStr]) {
                    shortNameStr = this.state.transform.abbrevs[jurisdiction]["institution-part"][shortNameStr];
                }
                shortNameStr = this._quashChecks(jurisdiction, shortNameStr);
                if (["short-long", "long-short"].indexOf(this.institution.strings["institution-parts"]) > -1) {
                    if (shortNameStr === longNameStr) {
                        shortNameStr = "";
                    }
                }
            }
            // Split abbreviated strings
            // For pure long, split and we're done.
            ret["long"] = longNameStr.split(/\s*\|\s*/);
            // For short, split and then try abbrev with institution-part on each element
            ret["short"] = shortNameStr.split(/\s*\|\s*/);
            if (["short", "short-long", "long-short"].indexOf(this.institution.strings["institution-parts"]) > -1) {
                for (let j=ret["short"].length-1; j>-1; j--) {
                    let jurisdiction = this.Item.jurisdiction;
                    const abbrevKey = ret["short"][j];
                    jurisdiction = this.state.transform.loadAbbreviation(jurisdiction, "institution-part", abbrevKey, this.Item.language);
                    if (this.state.transform.abbrevs[jurisdiction]["institution-part"][abbrevKey]) {
                        ret["short"][j] = this.state.transform.abbrevs[jurisdiction]["institution-part"][abbrevKey];
                    }
                    if (ret["short"][j].indexOf("|") > -1) {
                        let retShort = ret["short"];
                        let splitShort = retShort[j].split(/\s*\|\s*/);
                        ret["short"] = retShort.slice(0, j).concat(splitShort).concat(retShort.slice(j+1));
                    }
                }
            }
            if (this.state.opt.development_extensions.legacy_institution_name_ordering) {
                ret["short"].reverse();
            }
            ret["short"] = this._trimInstitution(ret["short"]);
            if (this.institution.strings["reverse-order"]) {
                ret["short"].reverse();
            }
            // trimmer is not available in getAmbiguousCite
            if (!this.state.tmp.just_looking) {
                if (this.Item.jurisdiction) {
                    let jurisdiction = this.Item.jurisdiction;
                    const trimmer = this.state.tmp.abbrev_trimmer;
                    if (trimmer && trimmer[jurisdiction] && trimmer[jurisdiction][varname]) {
                        for (let i=0,ilen=ret["short"].length;i<ilen;i++) {
                            const frag = ret["short"][i];
                            ret["short"][i] = frag.replace(trimmer[jurisdiction][varname], "").trim();
                        }
                    }
                }
            }
        }
        if (this.state.opt.development_extensions.legacy_institution_name_ordering) {
            ret["long"].reverse();
        }
        ret["long"] = this._trimInstitution(ret["long"]);
        if (this.institution.strings["reverse-order"]) {
            ret["long"].reverse();
        }

        return ret;
    };


    getStaticOrder(name: any, refresh?: any) {
        let static_ordering_val = false;
        if (!refresh && name["static-ordering"]) {
            static_ordering_val = true;
        } else if (this._isRomanesque(name) === 0) {
            static_ordering_val = true;
        } else if ((!name.multi || !name.multi.main) && this.Item.language && ['vi', 'hu'].indexOf(this.Item.language) > -1) {
            static_ordering_val = true;
        } else if (name.multi && name.multi.main && ['vi', 'hu'].indexOf(name.multi.main.slice(0,2)) > -1) {
            static_ordering_val = true;
        } else {
            if (this.state.opt['auto-vietnamese-names']
                && (VIETNAMESE_NAMES.exec(name.family + " " + name.given)
                    && VIETNAMESE_SPECIALS.exec(name.family + name.given))) {
                
                static_ordering_val = true;
            }
        }
        return static_ordering_val;
    };

    _quashChecks(jurisdiction: any, str: any) {
        str = this.state.transform.quashCheck(jurisdiction, str);
        // If the abbreviation has date cut-offs, find the most recent
        // abbreviation within scope.
        const lst = str.split(/>>[0-9]{4}>>/);
        let m = str.match(/>>([0-9]{4})>>/);
        str = lst.pop();
        let date = this.Item["original-date"] ? this.Item["original-date"] : this.Item["issued"];
        if (date) {
            date = parseInt(date.year, 10);
            date = isNaN(date) ? false : date;
        }
        if (date) {
            if (lst.length > 0) {
                for (let k=m.length-1; k>0; k--) {
                    if (date >= parseInt(m[k], 10)) {
                        break;
                    }
                    str = lst.pop();
                }
            }
            str = str.replace(/\s*\|\s*/g, "|");
        }
        return str;
    }

    _trimInstitution(subunits: any) {
        // Oh! Good catch in the tests. This happens before abbrevs.
        // Won't work that way. Need to do abbrev substitute first,
        // and apply this separately to long and to short.
        let use_first: any = false;
        let stop_last: any = false;
        let use_last: any = false;
        let stop_first: any = false;
        let s = subunits.slice();
        if (this.institution) {
            // If use_first, apply stop_last, then apply use_first;
            // If use_last, apply stop_first, then apply use_last;
            if ("undefined" !== typeof this.institution.strings["use-first"]) {
                // this.state.sys.print("use-first OK");
                use_first = this.institution.strings["use-first"];
            }
            if ("undefined" !== typeof this.institution.strings["use-last"]) {
                // this.state.sys.print("use-last OK");
                use_last = this.institution.strings["use-last"];
            }
            if ("undefined" !== typeof this.institution.strings["stop-first"]) {
                // this.state.sys.print("stop-first OK");
                stop_first = this.institution.strings["stop-first"];
            }
            if ("undefined" !== typeof this.institution.strings["stop-last"]) {
                stop_last = this.institution.strings["stop-last"];
            }

            if (use_first) {
                if (stop_last) {
                    s = s.slice(0, stop_last * -1);
                }
                s = s.slice(0, use_first);
            }
            
            if (use_last) {
                let ss = subunits.slice();
                if (use_first) {
                    stop_first = use_first;
                } else {
                    s = [];
                }
                if (stop_first) {
                    ss = ss.slice(stop_first);
                }
                ss = ss.slice(use_last * -1);
                s = s.concat(ss);
            }
            subunits = s;
        }
        return subunits;
    };
}
