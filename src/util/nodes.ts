import { internals } from './internals';
import { makeBuilder } from '../engine/build';

import { Token } from '../obj/token';
import { setDecorations } from '../util/processor';
import { Attributes } from '../attributes/attributes';
import { Node_group } from '../node/group';

import { DATE_VARIABLES, END, MODULE_MACROS, POSITION, SINGLETON, START } from '../constants/core';
import { debug, error } from '../logger';
/* For node execution pretty-printing (see below) */

/*
var INDENT = "";
*/

export function tokenExec(token, Item, item) {
    let next, maybenext, exec, debug;
    debug = false;
    next = token.next;
    maybenext = false;

    const record = function (result) {
        if (result) {
            this.tmp.jump.replace("succeed");
            return token.succeed;
        } else {
            this.tmp.jump.replace("fail");
            return token.fail;
        }
    };
    if (token.test) {
        next = record.call(this,token.test(Item, item));
    }
    for (let i=0,ilen=token.execs.length;i<ilen;i++) {
        exec = token.execs[i];
        maybenext = exec.call(token, this, Item, item);
        if (maybenext) {
            next = maybenext;
        }
    }
    if (debug) {
        debug(token.name + " (" + token.tokentype + ") ---> done");
    }
    return next;
};

/**
 * Macro expander.
 * <p>Called on the state object.</p>
 */
export function expandMacro(macro_key_token, target) {
    let mkey, macro_nodes, end_of_macro, func;

    mkey = macro_key_token.postponed_macro;

    const sort_direction = macro_key_token.strings.sort_direction;
    
    macro_key_token = new Token("group", START);
    
    let hasDate = false;
    let macroid = false;
    macro_nodes = this.cslXml.getNodesByName(this.cslXml.dataObj, 'macro', mkey);
    if (macro_nodes.length) {
        macroid = this.cslXml.getAttributeValue(macro_nodes[0],'cslid');
        hasDate = this.cslXml.getAttributeValue(macro_nodes[0], "macro-has-date");
    }
    if (hasDate) {
        mkey = mkey + "@" + this.build.current_default_locale;
        func = function (state) {
            if (state.tmp.extension) {
                state.tmp["doing-macro-with-date"] = true;
            }
        };
        macro_key_token.execs.push(func);
    }

    if (this.build.macro_stack.indexOf(mkey) > -1) {
        error("CSL processor error: call to macro \"" + mkey + "\" would cause an infinite loop");
    } else {
        this.build.macro_stack.push(mkey);
    }

    macro_key_token.cslid = macroid;

    if (MODULE_MACROS[mkey]) {
        macro_key_token.juris = mkey;
        this.opt.update_mode = POSITION;
    }
    // Macro group is treated as a real node in the style
    Node_group.build.call(macro_key_token, this, target, true);

    if (!this.cslXml.getNodeValue(macro_nodes)) {
        error("CSL style error: undefined macro \"" + mkey + "\"");
    }

    let mytarget = getMacroTarget.call(this, mkey);
    if (mytarget) {
        buildMacro.call(this, mytarget, macro_nodes);
        configureMacro.call(this, mytarget);
    }
    if (this.build.extension) {
        let func = (function(macro_name) {
            return function (state, Item, item) {
                let next = 0;
                while (next < state.sort_macros[macro_name].length) {
                    next = tokenExec.call(state, state.sort_macros[macro_name][next], Item, item);
                }
            };
        }(mkey));
        const text_node = new Token("text", SINGLETON);
        text_node.execs.push(func);
        target.push(text_node);
    } else {
        let func = (function(macro_name) {
            return function (state, Item, item) {
                let next = 0;
                while (next < state.macros[macro_name].length) {
                    next = tokenExec.call(state, state.macros[macro_name][next], Item, item);
                }
            };
        }(mkey));
        const text_node = new Token("text", SINGLETON);
        text_node.execs.push(func);
        target.push(text_node);
    }

    end_of_macro = new Token("group", END);
    end_of_macro.strings.sort_direction = sort_direction;
    
    if (hasDate) {
        func = function (state) {
            if (state.tmp.extension) {
                state.tmp["doing-macro-with-date"] = false;
            }
        };
        end_of_macro.execs.push(func);
    }
    if (macro_key_token.juris) {
        end_of_macro.juris = mkey;
     }
    Node_group.build.call(end_of_macro, this, target, true);

    this.build.macro_stack.pop();
};

export function getMacroTarget(mkey) {
    let mytarget: any = false;
    if (this.build.extension) {
        if (!this.sort_macros) {
            this.sort_macros = {};
        }
        if (!this.sort_macros[mkey]) {
            mytarget = [];
            this.sort_macros[mkey] = mytarget;
        }
    } else if (!this.macros[mkey]) {
        mytarget = [];
        this.macros[mkey] = mytarget;
    }
    return mytarget;
};

export function buildMacro(mytarget, macro_nodes) {
    const builder = makeBuilder(this, mytarget);
    let mynode;
    if ("undefined" === typeof macro_nodes.length) {
        mynode = macro_nodes;
    } else {
        mynode = macro_nodes[0];
    }
    builder(mynode);
};

export function configureMacro(mytarget) {
    this.configureTokenList(mytarget);
};

/**
 * Convert XML node to token.
 */
export function XmlToToken(state, tokentype, explicitTarget, var_stack) {
    let name, txt, attrfuncs, attributes, decorations, token, key, target;
    name = state.cslXml.nodename(this);
    if (state.build.skip && state.build.skip !== name) {
        return;
    }
    if (!name) {
        txt = state.cslXml.content(this);
        if (txt) {
            state.build.text = txt;
        }
        return;
    }
    if (!internals.Node[state.cslXml.nodename(this)]) {
        error("Undefined node name \"" + name + "\".");
    }
    attrfuncs = [];
    attributes = state.cslXml.attributes(this);
    decorations = setDecorations.call(this, state, attributes);
    token = new Token(name, tokentype);
    if (tokentype !== END || name === "if" || name === "else-if" || name === "layout") {
        for (let key in attributes) {
            if (attributes.hasOwnProperty(key)) {
                if (tokentype === END && key !== "@language" && key !== "@locale") {
                    continue;
                }
                if (attributes.hasOwnProperty(key)) {
                    if (Attributes[key]) {
                        try {
                            Attributes[key].call(token, state, "" + attributes[key]);
                        } catch (e) {
                            error(key + " attribute: " + e);
                        }
                    } else {
                        debug("warning: undefined attribute \""+key+"\" in style");
                    }
                }
            }
        }
        token.decorations = decorations;
        if (DATE_VARIABLES.indexOf(attributes['@variable']) > -1) {
            var_stack.push(token.variables);
        }
    } else if (tokentype === END && attributes['@variable']) {
        token.hasVariable = true;
        if (DATE_VARIABLES.indexOf(attributes['@variable']) > -1) {
            token.variables = var_stack.pop();
        }
    }
    if (explicitTarget) {
        target = explicitTarget;
    } else {
        target = state[state.build.area].tokens;
    }
    internals.Node[name].build.call(token, state, target, true);
};
