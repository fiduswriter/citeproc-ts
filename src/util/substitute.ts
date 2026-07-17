import { Blob } from '../obj/blob';
import { Token } from '../obj/token';

import { Node_choose } from '../node/choose';

import { DISPLAY_CLASSES, END, SINGLETON, START } from '../constants/core';
export function Util_substituteStart(state, target) {
    let element_trace, display, bib_first, func, choose_start, if_start, nodetypes;
    func = function (state, Item, item) {
        for (let i = 0, ilen = this.decorations.length; i < ilen; i += 1) {
            if ("@strip-periods" === this.decorations[i][0] && "true" === this.decorations[i][1]) {
                state.tmp.strip_periods += 1;
                break;
            }
        }
    };
    this.execs.push(func);
    if (this.decorations && state.opt.development_extensions.csl_reverse_lookup_support) {
        this.decorations.reverse();
        this.decorations.push(["@showid","true", this.cslid]);
        this.decorations.reverse();
    }

    nodetypes = ["number", "date", "names"];
    if (("text" === this.name && !this.postponed_macro) || nodetypes.indexOf(this.name) > -1) {
        element_trace = function (state, Item, item) {
            if (state.tmp.element_trace.value() === "author" || "names" === this.name) {
                if (!state.tmp.just_looking && item && item["author-only"] && state.tmp.area !== "intext") {
                    if (!state.tmp.probably_rendered_something) {
                    } else {
                        state.tmp.element_trace.push("suppress-me");
                    }
                }
                if (!state.tmp.just_looking && item && item["suppress-author"]) {
                    if (!state.tmp.probably_rendered_something) {
                        state.tmp.element_trace.push("suppress-me");
                    }
                }
            }
            else if ("date" === this.name) {
                if (!state.tmp.just_looking && item && item["author-only"] && state.tmp.area !== "intext") {
                    if (state.tmp.probably_rendered_something) {
                        state.tmp.element_trace.push("suppress-me");
                    }
                }
            } else {
                if (!state.tmp.just_looking && item && item["author-only"] && state.tmp.area !== "intext") {
                    if (!state.tmp.probably_rendered_something && state.tmp.can_block_substitute) {
                    } else {
                        state.tmp.element_trace.push("suppress-me");
                    }
                } else if (item && item["suppress-author"]) {
                    state.tmp.element_trace.push("do-not-suppress-me");
                }
            }
        };
        this.execs.push(element_trace);
    }
    display = this.strings.cls;
    this.strings.cls = false;
    if (state.build.render_nesting_level === 0) {
        if (state.build.area === "bibliography" && state.bibliography.opt["second-field-align"]) {
            bib_first = new Token("group", START);
            bib_first.decorations = [["@display", "left-margin"]];
            func = function (state, Item) {
                if (!state.tmp.render_seen) {
                    bib_first.strings.first_blob = Item.id;
                    state.output.startTag("bib_first", bib_first);
                }
            };
            bib_first.execs.push(func);
            target.push(bib_first);
        } else if (DISPLAY_CLASSES.indexOf(display) > -1) {
            bib_first = new Token("group", START);
            bib_first.decorations = [["@display", display]];
            func = function (state, Item) {
                bib_first.strings.first_blob = Item.id;
                state.output.startTag("bib_first", bib_first);
            };
            bib_first.execs.push(func);
            target.push(bib_first);
        }
        state.build.cls = display;
    }
    state.build.render_nesting_level += 1;
    if (state.build.substitute_level.value() === 1) {
        choose_start = new Token("choose", START);
        Node_choose.build.call(choose_start, state, target);
        if_start = new Token("if", START);
        func = function () {
            if (state.tmp.can_substitute.value()) {
                return true;
            }
            return false;
        };
        if_start.tests ? {} : if_start.tests = [];
        if_start.tests.push(func);
        if_start.test = state.fun.match.any(this, state, if_start.tests);
        target.push(if_start);
    }

    if (state.sys.variableWrapper
        && this.variables_real
        && this.variables_real.length) {

        func = function (state, Item, item) {
            if (!state.tmp.just_looking && !state.tmp.suppress_decorations) {
                const variable_entry = new Token("text", START);
                variable_entry.decorations = [["@showid", "true"]];
                state.output.startTag("variable_entry", variable_entry);
                let position = null;
                if (item) {
                    position = item.position;
                }
                if (!position) {
                    position = 0;
                }
                const positionMap = [
                    "first",
                    "container-subsequent",
                    "subsequent",
                    "ibid",
                    "ibid-with-locator"
                ];
                let noteNumber = 0;
                if (item && item.noteIndex) {
                    noteNumber = item.noteIndex;
                }
                let firstReferenceNoteNumber = 0;
                if (item && item['first-reference-note-number']) {
                    firstReferenceNoteNumber = item['first-reference-note-number'];
                }
                let firstContainerReferenceNoteNumber = 0;
                if (item && item['first-container-reference-note-number']) {
                    firstContainerReferenceNoteNumber = item['first-container-reference-note-number'];
                }
                let citationNumber = 0;
                if (item && item['citation-number']) {
                    citationNumber = item['citation-number'];
                }
                let index = 0;
                if (item && item.index) {
                    index = item.index;
                }
                const params = {
                    itemData: Item,
                    variableNames: this.variables,
                    context: state.tmp.area,
                    xclass: state.opt.xclass,
                    position: positionMap[position],
                    "note-number": noteNumber,
                    "first-reference-note-number": firstReferenceNoteNumber,
                    "first-container-reference-note-number": firstContainerReferenceNoteNumber,
                    "citation-number": citationNumber,
                    "index": index,
                    "mode": state.opt.mode
                };
                state.output.current.value().params = params;
            }
        };
        this.execs.push(func);
    }
};


export function Util_substituteEnd(state, target) {
    let func, bib_first_end, bib_other, if_end, choose_end, author_substitute, str;

    if (state.sys.variableWrapper
        && (this.hasVariable || (this.variables_real && this.variables_real.length))) {
        
        func = function (state) {
            if (!state.tmp.just_looking && !state.tmp.suppress_decorations) {
                state.output.endTag("variable_entry");
            }
        };
        this.execs.push(func);
    }

    func = function (state) {
        for (let i = 0, ilen = this.decorations.length; i < ilen; i += 1) {
            if ("@strip-periods" === this.decorations[i][0] && "true" === this.decorations[i][1]) {
                state.tmp.strip_periods += -1;
                break;
            }
        }
    };
    this.execs.push(func);

    state.build.render_nesting_level += -1;
    if (state.build.render_nesting_level === 0) {
        if (state.build.cls) {
            func = function (state) {
                state.output.endTag("bib_first");
            };
            this.execs.push(func);
            state.build.cls = false;
        } else if (state.build.area === "bibliography" && state.bibliography.opt["second-field-align"]) {
            bib_first_end = new Token("group", END);
            func = function (state) {
                if (!state.tmp.render_seen) {
                    state.output.endTag("bib_first");
                }
            };
            bib_first_end.execs.push(func);
            target.push(bib_first_end);
            bib_other = new Token("group", START);
            bib_other.decorations = [["@display", "right-inline"]];
            func = function (state) {
                if (!state.tmp.render_seen) {
                    state.tmp.render_seen = true;
                    state.output.startTag("bib_other", bib_other);
                }
            };
            bib_other.execs.push(func);
            target.push(bib_other);
        }
    }
    if (state.build.substitute_level.value() === 1) {
        if_end = new Token("if", END);
        target.push(if_end);
        choose_end = new Token("choose", END);
        Node_choose.build.call(choose_end, state, target);
    }

    if ("names" === this.name || ("text" === this.name && this.variables_real !== "title")) {
        author_substitute = new Token("text", SINGLETON);
        const substitution_name = this.name;
        func = function (state, Item) {
            if (state.tmp.area !== "bibliography") {
                return;
            }
            if ("string" !== typeof state.bibliography.opt["subsequent-author-substitute"]) {
                return;
            }
            if (this.variables_real && !Item[this.variables_real]) {
                return;
            }
            if (this.variables_real && substitution_name === "names") {
                return;
            }

            const subrule = state.bibliography.opt["subsequent-author-substitute-rule"];
            let i, ilen;
            const printing = !state.tmp.suppress_decorations;
            if (printing && state.tmp.subsequent_author_substitute_ok) {
                if (state.tmp.rendered_name) {
                    if ("partial-each" === subrule || "partial-first" === subrule) {
                        let dosub = true;
                        let rendered_name = [];
                        for (let i = 0, ilen = state.tmp.name_node.children.length; i < ilen; i += 1) {
                            const name = state.tmp.rendered_name[i];
                            if (dosub
                                && state.tmp.last_rendered_name && state.tmp.last_rendered_name.length > (i - 1)
                                && name && !name.localeCompare(state.tmp.last_rendered_name[i])) {
                                str = new Blob(state[state.tmp.area].opt["subsequent-author-substitute"]);
                                state.tmp.name_node.children[i].blobs = [str];
                                if ("partial-first" === subrule) {
                                    dosub = false;
                                }
                            } else {
                                dosub = false;
                            }
                            rendered_name.push(name);
                        }
                        state.tmp.last_rendered_name = rendered_name;
                    } else if ("complete-each" === subrule) {
                        let rendered_name = state.tmp.rendered_name.join(",");
                        if (rendered_name) {
                            if (state.tmp.last_rendered_name && !rendered_name.localeCompare(state.tmp.last_rendered_name)) {
                                for (let i = 0, ilen = state.tmp.name_node.children.length; i < ilen; i += 1) {
                                    str = new Blob(state[state.tmp.area].opt["subsequent-author-substitute"]);
                                    state.tmp.name_node.children[i].blobs = [str];
                                }
                            }
                            state.tmp.last_rendered_name = rendered_name;
                        }
                    } else {
                        let rendered_name = state.tmp.rendered_name.join(",");
                        if (rendered_name) {
                            if (state.tmp.last_rendered_name && !rendered_name.localeCompare(state.tmp.last_rendered_name)) {
                                str = new Blob(state[state.tmp.area].opt["subsequent-author-substitute"]);
                                if (state.tmp.label_blob) {
                                    state.tmp.name_node.top.blobs = [str,state.tmp.label_blob];
                                } else if (state.tmp.name_node.top.blobs.length) {
                                    state.tmp.name_node.top.blobs[0].blobs = [str];
                                } else {
                                    state.tmp.name_node.top.blobs = [str];
                                }
                                state.tmp.substituted_variable = substitution_name;
                            }
                            state.tmp.last_rendered_name = rendered_name;
                        }
                    }
                    state.tmp.subsequent_author_substitute_ok = false;
                }
            }
        };
        this.execs.push(func);
    }

    if (("text" === this.name && !this.postponed_macro) || ["number", "date", "names"].indexOf(this.name) > -1) {
        func = function (state, Item) {
            if (state.tmp.element_trace.mystack.length>1) {
                state.tmp.element_trace.pop();
            }
        };
        this.execs.push(func);
    }
};
