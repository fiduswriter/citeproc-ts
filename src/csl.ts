'use strict';

import * as Core from './constants/core';
import * as Regex from './constants/regex';
import * as Statute from './constants/statute';

import { checkPrefixSpaceAppend, checkSuffixSpacePrepend, checkIgnorePredecessor } from './util/affix';
import { TITLE_FIELD_SPLITS, TITLE_SPLIT, demoteNoiseWords, extractTitleAndSubtitle, titlecaseSentenceOrNormal } from './util/title';
import { normalizeLocaleStr, toLocaleUpperCase, toLocaleLowerCase, getAbbrevsDomain, AbbreviationSegments } from './util/locale_shared';
import { Conditions } from './util/conditions';
import { Doppeler, substituteOne, substituteTwo, setDecorations, Mode } from './util/processor';

import { Output_formatters } from './output/formatters';
import {
    checkNestedBrace,
    parseLocator,
    parseNoteFieldHacks,
    getSafeEscape,
    UPDATE_GROUP_CONTEXT_CONDITION,
    EVALUATE_GROUP_CONDITION,
    GET_COURT_CLASS,
    SET_COURT_CLASSES,
    INIT_JURISDICTION_MACROS
} from './util/csl-shared';
import { internals } from './util/internals';
import { localeResolve } from './util/locale';
import { makeBuilder } from './engine/build';
import { getAmbiguousCite, getSpliceDelimiter, getCitationCluster, getCite, citeStart, citeEnd } from './engine/cite';
import { getBibliographyEntries } from './engine/bibliography';


export const CSL: CSLNamespace = {
    ...Core,
    ...Regex,
    ...Statute,

    normalizeLocaleStr,
    toLocaleUpperCase,
    toLocaleLowerCase,
    getAbbrevsDomain,
    AbbreviationSegments,
    Conditions,
    Doppeler,
    substituteOne,
    substituteTwo,
    setDecorations,
    Mode,

    checkPrefixSpaceAppend,
    checkSuffixSpacePrepend,
    checkIgnorePredecessor,

    TITLE_FIELD_SPLITS,
    TITLE_SPLIT,
    demoteNoiseWords,
    extractTitleAndSubtitle,
    titlecaseSentenceOrNormal: function (this: any, state: any, Item: any, seg: string, lang: string | false, sentenceCase: boolean): string {
        return titlecaseSentenceOrNormal(state, Item, seg, lang, sentenceCase, Output_formatters as any);
    },

    checkNestedBrace,
    parseLocator,
    parseNoteFieldHacks,
    getSafeEscape,
    UPDATE_GROUP_CONTEXT_CONDITION,
    EVALUATE_GROUP_CONDITION,
    GET_COURT_CLASS,
    SET_COURT_CLASSES,
    INIT_JURISDICTION_MACROS,

    localeResolve,
    makeBuilder,
    getAmbiguousCite,
    getSpliceDelimiter,
    getCitationCluster,
    getCite,
    citeStart,
    citeEnd,
    getBibliographyEntries
};

CSL.internals = internals;
CSL.Node = internals.Node;

Object.defineProperty(CSL, 'ITERATION', {
    get: () => internals.ITERATION,
    set: (v) => { internals.ITERATION = v; },
    enumerable: true,
    configurable: true
});

Object.defineProperty(CSL, 'stringCompare', {
    get: () => internals.stringCompare,
    set: (v) => { internals.stringCompare = v; },
    enumerable: true,
    configurable: true
});

Object.defineProperty(CSL, 'VARIABLE_WRAPPER_PREPUNCT_REX', {
    get: () => internals.VARIABLE_WRAPPER_PREPUNCT_REX,
    set: (v) => { internals.VARIABLE_WRAPPER_PREPUNCT_REX = v; },
    enumerable: true,
    configurable: true
});

Object.defineProperty(CSL, 'debug', {
    get: () => internals.debug,
    set: (v) => { internals.debug = v; },
    enumerable: true,
    configurable: true
});

Object.defineProperty(CSL, 'error', {
    get: () => internals.error,
    set: (v) => { internals.error = v; },
    enumerable: true,
    configurable: true
});

Object.defineProperty(CSL, 'getSortKeys', {
    get: () => internals.getSortKeys,
    set: (v) => { internals.getSortKeys = v; },
    enumerable: true,
    configurable: true
});
