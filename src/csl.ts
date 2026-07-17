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

import { XmlJSON, stripXmlProcessingInstruction, parseXml } from './xml/xmljson';
import { XmlDOM } from './xml/xmldom';
import { setupXml } from './system';
import { getLocaleNames } from './util/locale_sniff';
import { Match, encodeDoiForUrl } from './util/util';
import { Transform } from './util/transform';
import { getSortCompare } from './sort';
import { ambigConfigDiff, cloneAmbigConfig, getAmbigConfig, getMaxVals, getMinVal } from './util/disambig';
import { tokenExec, expandMacro, getMacroTarget, buildMacro, configureMacro, XmlToToken } from './util/nodes';
import { dateParserInstance } from './util/dateparser';
import { Engine } from './engine/build';
import { remapSectionVariable, setNumberLabels } from './util/static_locator';
import { normalDecorIsOrphan } from './util/processor';
import { getCitationLabel, getTrigraphParams } from './util/citationlabel';
import { setOutputFormat, getSortFunc, setLangTagsForCslSort, setLangTagsForCslTransliteration, setLangTagsForCslTranslation, setLangPrefsForCites, setLangPrefsForCiteAffixes, setAutoVietnameseNamesOption, setAbbreviations, setSuppressTrailingPunctuation } from './engine/control';
import { Queue } from './output/queue';
import { Opt, Tmp, Fun, Build, Configure, Citation, Bibliography, BibliographySort, CitationSort, InText } from './engine/state';
import { previewCitationCluster, appendCitationCluster, processCitationCluster, process_CitationCluster, makeCitationCluster } from './engine/cite';
import { makeBibliography } from './engine/bibliography';
import { setCitationId } from './util/integration';
import { rebuildProcessorState, restoreProcessorState, updateItems, updateUncitedItems } from './engine/update';
import { localeConfigure, localeSet } from './util/locale';
import { EngineCondition } from './util/conditions';
import { Node_bibliography } from './node/bibliography';
import { Node_choose } from './node/choose';
import { Node_citation } from './node/citation';
import { Node_comment } from './node/comment';
import { Node_date } from './node/date';
import { Node_date_part } from './node/datepart';
import { Node_else_if } from './node/elseif';
import { Node_else } from './node/else';
import { Node_et_al } from './node/etal';
import { Node_group } from './node/group';
import { Node_if } from './node/if';
import { Node_conditions } from './node/conditions';
import { Node_condition } from './node/condition';
import { Node_info } from './node/info';
import { Node_institution } from './node/institution';
import { Node_institution_part } from './node/institutionpart';
import { Node_key } from './node/key';
import { Node_label } from './node/label';
import { Node_layout } from './node/layout';
import { Node_macro } from './node/macro';
import { Node_alternative } from './node/alternative';
import { Node_alternative_text } from './node/alternativetext';
import { NameOutput } from './util/names/output';
import { isPerson } from './util/names/tests';
import { truncatePersonalNameLists, _truncateNameList } from './util/names/truncate';
import { divideAndTransliterateNames, _normalizeVariableValue, _getFreeters, _getPersonsAndInstitutions, _clearValues, _checkNickname } from './util/names/divide';
import { _purgeEmptyBlobs, joinPersons, joinInstitutionSets, joinPersonsAndInstitutions, joinFreetersAndInstitutionSets, _getAfterInvertedName, _getAndJoin, _joinEtAl, _joinEllipsis, _joinAnd, _join, _getToken } from './util/names/join';
import { checkCommonAuthor, setCommonTerm, _compareNamesets } from './util/names/common';
import { constrainNames, _imposeNameConstraints } from './util/names/constraints';
import { disambigNames, _runDisambigNames } from './util/names/disambig';
import { getEtAlConfig } from './util/names/etalconfig';
import { setEtAlParameters, _setEtAlParameter } from './util/names/etal';
import { PublisherOutput } from './util/publishers';
import { evaluateLabel, castLabel } from './util/label';
import { Node_name } from './node/name';
import { Node_name_part } from './node/namepart';
import { Node_names } from './node/names';
import { Node_number } from './node/number';
import { Node_sort } from './node/sort';
import { Node_substitute } from './node/substitute';
import { Node_text, Node_checkNonEnglishTitleCase } from './node/text';
import { Node_intext } from './node/intext';
import { Attributes } from './attributes/attributes';
import { Stack } from './stack';
import { Parallel } from './util/parallel';
import { Token, Util_cloneToken } from './obj/token';
import { AmbigConfig } from './obj/ambigconfig';
import { Blob } from './obj/blob';
import { NumericBlob, Output_DefaultFormatter } from './obj/number';
import { Util_fixDateNode } from './util/datenode';
import { dateMacroAsSortKey, dateAsSortKey, dateParseArray } from './util/date';
import { Util_Names } from './util/names/index';
import { Util_Dates } from './util/dates';
import { Util_Sort } from './util/sort';
import { Util_substituteStart, Util_substituteEnd } from './util/substitute';
import { processNumber, LongOrdinalizer, Ordinalizer, Romanizer, Suffixator, padding, outputNumericField } from './util/number';
import { Util_PageRangeMangler } from './util/page';
import { Util_FlipFlopper } from './util/flipflop';
import { Output_formatters } from './output/formatters';
import { Output_formats } from './output/formats';
import { getSortKeys, Registry, Comparifier } from './registry/registry';
import { Disambiguation } from './disambig/cites';
import { NameReg } from './disambig/names';
import { CitationReg } from './disambig/citations';
import { getJurisdictionList, loadStyleModule, retrieveAllStyleModules } from './util/modules';
import { ParticleList, parseParticles } from './util/name_particles';


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

CSL.XmlJSON = XmlJSON;
CSL.stripXmlProcessingInstruction = stripXmlProcessingInstruction;
CSL.parseXml = parseXml;
CSL.XmlDOM = XmlDOM;
CSL.setupXml = setupXml;
CSL.getLocaleNames = getLocaleNames;
CSL.Util = CSL.Util || {};
CSL.Util.Match = Match;
CSL.Util.encodeDoiForUrl = encodeDoiForUrl;
CSL.Transform = Transform;
CSL.getSortCompare = getSortCompare;
CSL.ambigConfigDiff = ambigConfigDiff;
CSL.cloneAmbigConfig = cloneAmbigConfig;
CSL.getAmbigConfig = getAmbigConfig;
CSL.getMaxVals = getMaxVals;
CSL.getMinVal = getMinVal;
CSL.tokenExec = tokenExec;
CSL.expandMacro = expandMacro;
CSL.getMacroTarget = getMacroTarget;
CSL.buildMacro = buildMacro;
CSL.configureMacro = configureMacro;
CSL.XmlToToken = XmlToToken;
CSL.DateParser = dateParserInstance;
CSL.Engine = Engine;
CSL.Output = CSL.Output || {};
CSL.Output.Queue = Queue;
CSL.Engine.Opt = Opt;
CSL.Engine.Tmp = Tmp;
CSL.Engine.Fun = Fun;
CSL.Engine.Build = Build;
CSL.Engine.Configure = Configure;
CSL.Engine.Citation = Citation;
CSL.Engine.Bibliography = Bibliography;
CSL.Engine.BibliographySort = BibliographySort;
CSL.Engine.CitationSort = CitationSort;
CSL.Engine.InText = InText;
CSL.Conditions = CSL.Conditions || {};
CSL.Conditions.Engine = EngineCondition;
CSL.Node = CSL.Node || {};
CSL.Node.bibliography = Node_bibliography;
CSL.Node.choose = Node_choose;
CSL.Node.citation = Node_citation;
CSL.Node["#comment"] = Node_comment;
CSL.Node.date = Node_date;
CSL.Node["date-part"] = Node_date_part;
CSL.Node["else-if"] = Node_else_if;
CSL.Node["else"] = Node_else;
CSL.Node["et-al"] = Node_et_al;
CSL.Node.group = Node_group;
CSL.Node["if"] = Node_if;
CSL.Node.conditions = Node_conditions;
CSL.Node.condition = Node_condition;
CSL.Node.info = Node_info;
CSL.Node.institution = Node_institution;
CSL.Node["institution-part"] = Node_institution_part;
CSL.Node.key = Node_key;
CSL.Node.label = Node_label;
CSL.Node.layout = Node_layout;
CSL.Node.macro = Node_macro;
CSL.Node.alternative = Node_alternative;
CSL.Node["alternative-text"] = Node_alternative_text;
CSL.NameOutput = NameOutput;
Object.assign(CSL.NameOutput.prototype, {
  isPerson,
  truncatePersonalNameLists,
  _truncateNameList,
  divideAndTransliterateNames,
  _normalizeVariableValue,
  _getFreeters,
  _getPersonsAndInstitutions,
  _clearValues,
  _checkNickname,
  _purgeEmptyBlobs,
  joinPersons,
  joinInstitutionSets,
  joinPersonsAndInstitutions,
  joinFreetersAndInstitutionSets,
  _getAfterInvertedName,
  _getAndJoin,
  _joinEtAl,
  _joinEllipsis,
  _joinAnd,
  _join,
  _getToken,
  checkCommonAuthor,
  setCommonTerm,
  _compareNamesets,
  constrainNames,
  _imposeNameConstraints,
  disambigNames,
  _runDisambigNames,
  getEtAlConfig,
  setEtAlParameters,
  _setEtAlParameter,
});
CSL.PublisherOutput = PublisherOutput;
CSL.evaluateLabel = evaluateLabel;
CSL.castLabel = castLabel;
CSL.Node = CSL.Node || {};
CSL.Node.name = Node_name;
CSL.Node["name-part"] = Node_name_part;
CSL.Node.names = Node_names;
CSL.Node.number = Node_number;
CSL.Node.sort = Node_sort;
CSL.Node.substitute = Node_substitute;
CSL.Node.text = Node_text;
CSL.checkNonEnglishTitleCase = Node_checkNonEnglishTitleCase;
CSL.Node.intext = Node_intext;
CSL.Attributes = Attributes;
CSL.Stack = Stack;
CSL.Parallel = Parallel;
CSL.Token = Token;
CSL.Util = CSL.Util || {};
CSL.Util.cloneToken = Util_cloneToken;
CSL.AmbigConfig = AmbigConfig;
CSL.Blob = Blob;
CSL.NumericBlob = NumericBlob;
CSL.Output = CSL.Output || {};
CSL.Output.DefaultFormatter = Output_DefaultFormatter;
CSL.Util = CSL.Util || {};
CSL.Util.fixDateNode = Util_fixDateNode;
CSL.dateMacroAsSortKey = dateMacroAsSortKey;
CSL.dateAsSortKey = dateAsSortKey;
CSL.Util = CSL.Util || {};
CSL.Util.Names = Util_Names;
CSL.Util = CSL.Util || {};
CSL.Util.Dates = Util_Dates;
CSL.Util = CSL.Util || {};
CSL.Util.Sort = Util_Sort;
CSL.Util = CSL.Util || {};
CSL.Util.substituteStart = Util_substituteStart;
CSL.Util.substituteEnd = Util_substituteEnd;
CSL.Util = CSL.Util || {};
CSL.Util.padding = padding;
CSL.Util.outputNumericField = outputNumericField;
CSL.Util.LongOrdinalizer = LongOrdinalizer;
CSL.Util.Ordinalizer = Ordinalizer;
CSL.Util.Romanizer = Romanizer;
CSL.Util.Suffixator = Suffixator;
CSL.Util = CSL.Util || {};
CSL.Util.PageRangeMangler = Util_PageRangeMangler;
CSL.Util = CSL.Util || {};
CSL.Util.FlipFlopper = Util_FlipFlopper;
CSL.Output = CSL.Output || {};
CSL.Output.Formatters = Output_formatters;
CSL.Output = CSL.Output || {};
CSL.Output.Formats = Output_formats;
CSL.getSortKeys = getSortKeys;
CSL.Registry = Registry;
CSL.Registry.Comparifier = Comparifier;
CSL.Disambiguation = Disambiguation;
CSL.NameReg = NameReg;
CSL.CitationReg = CitationReg;
CSL.ParticleList = ParticleList;
CSL.parseParticles = parseParticles;

Object.assign(CSL.Engine.prototype, {
  processNumber,
  dateParseArray,
  remapSectionVariable,
  setNumberLabels,
  normalDecorIsOrphan,
  getJurisdictionList,
  loadStyleModule,
  retrieveAllStyleModules,
  getCitationLabel,
  getTrigraphParams,
  localeConfigure,
  localeSet,
  setCitationId,
  setOutputFormat,
  getSortFunc,
  setLangTagsForCslSort,
  setLangTagsForCslTransliteration,
  setLangTagsForCslTranslation,
  setLangPrefsForCites,
  setLangPrefsForCiteAffixes,
  setAutoVietnameseNamesOption,
  setAbbreviations,
  setSuppressTrailingPunctuation,
  previewCitationCluster,
  appendCitationCluster,
  processCitationCluster,
  process_CitationCluster,
  makeCitationCluster,
  rebuildProcessorState,
  restoreProcessorState,
  updateItems,
  updateUncitedItems,
  makeBibliography,
});
