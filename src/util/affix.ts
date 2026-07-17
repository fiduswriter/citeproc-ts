import { ENDSWITH_ROMANESQUE_REGEXP, STARTSWITH_ROMANESQUE_REGEXP } from '../constants/regex';
import { TERMINAL_PUNCTUATION } from '../constants/core';

export function checkPrefixSpaceAppend(state: any, prefix: string): string {
    if (!prefix) {
        prefix = "";
    }
    let sp = "";
    const test_prefix = prefix.replace(/<[^>]+>/g, "").replace(/["'\u201d\u2019\u00bb\u202f\u00a0 ]+$/g,"");
    const test_char = test_prefix.slice(-1);
    if (test_prefix.match(ENDSWITH_ROMANESQUE_REGEXP)) {
        sp = " ";
    } else if (TERMINAL_PUNCTUATION.slice(0,-1).indexOf(test_char) > -1) {
        sp = " ";
    } else if (test_char.match(/[\)\],0-9]/)) {
        sp = " ";
    }
    prefix = (prefix + sp).replace(/\s+/g, " ");
    return prefix;
}

export function checkIgnorePredecessor(state: any, prefix: string): boolean {
    const test_prefix = prefix.replace(/<[^>]+>/g, "").replace(/["'\u201d\u2019\u00bb\u202f\u00a0 ]+$/g,"");
    const test_char = test_prefix.slice(-1);
    if (TERMINAL_PUNCTUATION.slice(0,-1).indexOf(test_char) > -1 && prefix.trim().indexOf(" ") > -1) {
        state.tmp.term_predecessor = false;
        return true;
    }
    return false;
}

export function checkSuffixSpacePrepend(state: any, suffix: string): string {
    if (!suffix) {
        return "";
    }
    if (suffix.match(STARTSWITH_ROMANESQUE_REGEXP) || ['[','('].indexOf(suffix.slice(0,1)) > -1) {
        suffix = " " + suffix;
    }
    return suffix;
}
