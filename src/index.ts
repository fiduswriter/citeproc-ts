import { CSL } from './csl';

// Source modules, imported in dependency order.
import { XmlJSON, stripXmlProcessingInstruction, parseXml } from './xml/xmljson';
CSL.XmlJSON = XmlJSON;
CSL.stripXmlProcessingInstruction = stripXmlProcessingInstruction;
CSL.parseXml = parseXml;
import { XmlDOM } from './xml/xmldom';
CSL.XmlDOM = XmlDOM;
import { setupXml } from './system';
CSL.setupXml = setupXml;
import { getLocaleNames } from './util/locale_sniff';
CSL.getLocaleNames = getLocaleNames;
import { Match, encodeDoiForUrl } from './util/util';
CSL.Util = CSL.Util || {};
CSL.Util.Match = Match;
CSL.Util.encodeDoiForUrl = encodeDoiForUrl;
import { Transform } from './util/transform';
CSL.Transform = Transform;
import { getSortCompare } from './sort';
CSL.getSortCompare = getSortCompare;
import { ambigConfigDiff, cloneAmbigConfig, getAmbigConfig, getMaxVals, getMinVal } from './util/disambig';
CSL.ambigConfigDiff = ambigConfigDiff;
CSL.cloneAmbigConfig = cloneAmbigConfig;
CSL.getAmbigConfig = getAmbigConfig;
CSL.getMaxVals = getMaxVals;
CSL.getMinVal = getMinVal;
import { tokenExec, expandMacro, getMacroTarget, buildMacro, configureMacro, XmlToToken } from './util/nodes';
CSL.tokenExec = tokenExec;
CSL.expandMacro = expandMacro;
CSL.getMacroTarget = getMacroTarget;
CSL.buildMacro = buildMacro;
CSL.configureMacro = configureMacro;
CSL.XmlToToken = XmlToToken;
import { dateParserInstance } from './util/dateparser';
CSL.DateParser = dateParserInstance;
import { Engine } from './engine/build';
CSL.Engine = Engine;
import { remapSectionVariable, setNumberLabels } from './util/static_locator';
import { normalDecorIsOrphan } from './util/processor';
import { getCitationLabel, getTrigraphParams } from './util/citationlabel';
import { setOutputFormat, getSortFunc, setLangTagsForCslSort, setLangTagsForCslTransliteration, setLangTagsForCslTranslation, setLangPrefsForCites, setLangPrefsForCiteAffixes, setAutoVietnameseNamesOption, setAbbreviations, setSuppressTrailingPunctuation } from './engine/control';
import { Queue } from './output/queue';
CSL.Output = CSL.Output || {};
CSL.Output.Queue = Queue;
import { Opt, Tmp, Fun, Build, Configure, Citation, Bibliography, BibliographySort, CitationSort, InText } from './engine/state';
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
import { previewCitationCluster, appendCitationCluster, processCitationCluster, process_CitationCluster, makeCitationCluster, getAmbiguousCite, getSpliceDelimiter, getCitationCluster, getCite, citeStart, citeEnd } from './engine/cite';
import { getBibliographyEntries, makeBibliography } from './engine/bibliography';
import { setCitationId } from './util/integration';
import { rebuildProcessorState, restoreProcessorState, updateItems, updateUncitedItems } from './engine/update';
import { localeConfigure, localeSet } from './util/locale';
import { EngineCondition } from './util/conditions';
CSL.Conditions = CSL.Conditions || {};
CSL.Conditions.Engine = EngineCondition;
import { Node_bibliography } from './node/bibliography';
CSL.Node = CSL.Node || {};
CSL.Node.bibliography = Node_bibliography;
import { Node_choose } from './node/choose';
CSL.Node.choose = Node_choose;
import { Node_citation } from './node/citation';
CSL.Node.citation = Node_citation;
import { Node_comment } from './node/comment';
CSL.Node["#comment"] = Node_comment;
import { Node_date } from './node/date';
CSL.Node.date = Node_date;
import { Node_date_part } from './node/datepart';
CSL.Node["date-part"] = Node_date_part;
import { Node_else_if } from './node/elseif';
CSL.Node["else-if"] = Node_else_if;
import { Node_else } from './node/else';
CSL.Node["else"] = Node_else;
import { Node_et_al } from './node/etal';
CSL.Node["et-al"] = Node_et_al;
import { Node_group } from './node/group';
CSL.Node.group = Node_group;
import { Node_if } from './node/if';
CSL.Node["if"] = Node_if;
import { Node_conditions } from './node/conditions';
CSL.Node.conditions = Node_conditions;
import { Node_condition } from './node/condition';
CSL.Node.condition = Node_condition;
import { Node_info } from './node/info';
CSL.Node.info = Node_info;
import { Node_institution } from './node/institution';
CSL.Node.institution = Node_institution;
import { Node_institution_part } from './node/institutionpart';
CSL.Node["institution-part"] = Node_institution_part;
import { Node_key } from './node/key';
CSL.Node.key = Node_key;
import { Node_label } from './node/label';
CSL.Node.label = Node_label;
import { Node_layout } from './node/layout';
CSL.Node.layout = Node_layout;
import { Node_macro } from './node/macro';
CSL.Node.macro = Node_macro;
import { Node_alternative } from './node/alternative';
CSL.Node.alternative = Node_alternative;
import { Node_alternative_text } from './node/alternativetext';
CSL.Node["alternative-text"] = Node_alternative_text;
import { NameOutput } from './util/names/output';
CSL.NameOutput = NameOutput;
import { isPerson } from './util/names/tests';
import { truncatePersonalNameLists, _truncateNameList } from './util/names/truncate';
import { divideAndTransliterateNames, _normalizeVariableValue, _getFreeters, _getPersonsAndInstitutions, _clearValues, _checkNickname } from './util/names/divide';
import { _purgeEmptyBlobs, joinPersons, joinInstitutionSets, joinPersonsAndInstitutions, joinFreetersAndInstitutionSets, _getAfterInvertedName, _getAndJoin, _joinEtAl, _joinEllipsis, _joinAnd, _join, _getToken } from './util/names/join';
import { checkCommonAuthor, setCommonTerm, _compareNamesets } from './util/names/common';
import { constrainNames, _imposeNameConstraints } from './util/names/constraints';
import { disambigNames, _runDisambigNames } from './util/names/disambig';
import { getEtAlConfig } from './util/names/etalconfig';
import { setEtAlParameters, _setEtAlParameter } from './util/names/etal';
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
import { PublisherOutput } from './util/publishers';
CSL.PublisherOutput = PublisherOutput;
import { evaluateLabel, castLabel } from './util/label';
CSL.evaluateLabel = evaluateLabel;
CSL.castLabel = castLabel;
import { Node_name } from './node/name';
CSL.Node = CSL.Node || {};
CSL.Node.name = Node_name;
import { Node_name_part } from './node/namepart';
CSL.Node["name-part"] = Node_name_part;
import { Node_names } from './node/names';
CSL.Node.names = Node_names;
import { Node_number } from './node/number';
CSL.Node.number = Node_number;
import { Node_sort } from './node/sort';
CSL.Node.sort = Node_sort;
import { Node_substitute } from './node/substitute';
CSL.Node.substitute = Node_substitute;
import { Node_text, Node_checkNonEnglishTitleCase } from './node/text';
CSL.Node.text = Node_text;
CSL.checkNonEnglishTitleCase = Node_checkNonEnglishTitleCase;
import { Node_intext } from './node/intext';
CSL.Node.intext = Node_intext;
import { Attributes } from './attributes/attributes';
CSL.Attributes = Attributes;
import { Stack } from './stack';
CSL.Stack = Stack;
import { Parallel } from './util/parallel';
CSL.Parallel = Parallel;
import { Token, Util_cloneToken } from './obj/token';
CSL.Token = Token;
CSL.Util = CSL.Util || {};
CSL.Util.cloneToken = Util_cloneToken;
import { AmbigConfig } from './obj/ambigconfig';
CSL.AmbigConfig = AmbigConfig;
import { Blob } from './obj/blob';
CSL.Blob = Blob;
import { NumericBlob, Output_DefaultFormatter } from './obj/number';
CSL.NumericBlob = NumericBlob;
CSL.Output = CSL.Output || {};
CSL.Output.DefaultFormatter = Output_DefaultFormatter;
import { Util_fixDateNode } from './util/datenode';
CSL.Util = CSL.Util || {};
CSL.Util.fixDateNode = Util_fixDateNode;
import { dateMacroAsSortKey, dateAsSortKey, dateParseArray } from './util/date';
CSL.dateMacroAsSortKey = dateMacroAsSortKey;
CSL.dateAsSortKey = dateAsSortKey;
import { Util_Names } from './util/names/index';
CSL.Util = CSL.Util || {};
CSL.Util.Names = Util_Names;
import { Util_Dates } from './util/dates';
CSL.Util = CSL.Util || {};
CSL.Util.Dates = Util_Dates;
import { Util_Sort } from './util/sort';
CSL.Util = CSL.Util || {};
CSL.Util.Sort = Util_Sort;
import { Util_substituteStart, Util_substituteEnd } from './util/substitute';
CSL.Util = CSL.Util || {};
CSL.Util.substituteStart = Util_substituteStart;
CSL.Util.substituteEnd = Util_substituteEnd;
import { processNumber, LongOrdinalizer, Ordinalizer, Romanizer, Suffixator, padding, outputNumericField } from './util/number';
CSL.Util = CSL.Util || {};
CSL.Util.padding = padding;
CSL.Util.outputNumericField = outputNumericField;
CSL.Util.LongOrdinalizer = LongOrdinalizer;
CSL.Util.Ordinalizer = Ordinalizer;
CSL.Util.Romanizer = Romanizer;
CSL.Util.Suffixator = Suffixator;
import { Util_PageRangeMangler } from './util/page';
CSL.Util = CSL.Util || {};
CSL.Util.PageRangeMangler = Util_PageRangeMangler;
import { Util_FlipFlopper } from './util/flipflop';
CSL.Util = CSL.Util || {};
CSL.Util.FlipFlopper = Util_FlipFlopper;
import { Output_formatters } from './output/formatters';
CSL.Output = CSL.Output || {};
CSL.Output.Formatters = Output_formatters;
import { Output_formats } from './output/formats';
CSL.Output = CSL.Output || {};
CSL.Output.Formats = Output_formats;
import { debug, error } from './logger';
import { getSortKeys, Registry, Comparifier } from './registry/registry';
import { internals } from './util/internals';
internals.debug = debug;
internals.error = error;
internals.getAmbiguousCite = getAmbiguousCite;
internals.getSpliceDelimiter = getSpliceDelimiter;
internals.getCitationCluster = getCitationCluster;
internals.getCite = getCite;
internals.citeStart = citeStart;
internals.citeEnd = citeEnd;
internals.getBibliographyEntries = getBibliographyEntries;
internals.getSortKeys = getSortKeys;
CSL.getSortKeys = getSortKeys;
CSL.Registry = Registry;
CSL.Registry.Comparifier = Comparifier;
import { Disambiguation } from './disambig/cites';
CSL.Disambiguation = Disambiguation;
import { NameReg } from './disambig/names';
CSL.NameReg = NameReg;
import { CitationReg } from './disambig/citations';
CSL.CitationReg = CitationReg;
import { getJurisdictionList, loadStyleModule, retrieveAllStyleModules } from './util/modules';
import { ParticleList, parseParticles } from './util/name_particles';
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

export = CSL;
