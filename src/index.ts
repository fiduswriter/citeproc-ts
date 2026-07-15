import { CSL } from './csl';

// Source modules, imported in dependency order.
import { XmlJSON, stripXmlProcessingInstruction, parseXml } from './xml/xmljson';
CSL.XmlJSON = XmlJSON;
CSL.stripXmlProcessingInstruction = stripXmlProcessingInstruction;
CSL.parseXml = parseXml;
import './xml/xmldom';
import './system';
import './sort';
import './util/disambig';
import './util/nodes';
import './util/dateparser';
import { Engine } from './engine/build';
CSL.Engine = Engine;
import { remapSectionVariable, setNumberLabels } from './util/static_locator';
import './util/static_locator';
import { normalDecorIsOrphan } from './util/processor';
import './util/processor';
import { getCitationLabel, getTrigraphParams } from './util/citationlabel';
import './util/citationlabel';
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
import { previewCitationCluster, appendCitationCluster, processCitationCluster, process_CitationCluster, makeCitationCluster } from './engine/cite';
import { makeBibliography } from './engine/bibliography';
import { setCitationId } from './util/integration';
import './util/integration';
import { rebuildProcessorState, restoreProcessorState, updateItems, updateUncitedItems } from './engine/update';
import { localeConfigure, localeSet } from './util/locale';
import './util/locale';
import './util/locale_sniff';
import './node/bibliography';
import './node/choose';
import './node/citation';
import './node/comment';
import './node/date';
import './node/datepart';
import './node/elseif';
import './node/else';
import './node/etal';
import './node/group';
import './node/if';
import './node/conditions';
import './node/condition';
import { EngineCondition } from './util/conditions';
CSL.Conditions.Engine = EngineCondition;
import './util/conditions';
import './node/info';
import './node/institution';
import './node/institutionpart';
import './node/key';
import './node/label';
import './node/layout';
import './node/macro';
import './node/alternative';
import './node/alternativetext';
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
import './util/label';
import './node/name';
import './node/namepart';
import './node/names';
import './node/number';
import './node/sort';
import './node/substitute';
import './node/text';
import './node/intext';
import './attributes/attributes';
import './stack';
import { Parallel } from './util/parallel';
CSL.Parallel = Parallel;
import './util/util';
import './util/transform';
import './obj/token';
import './obj/ambigconfig';
import './obj/blob';
import './obj/number';
import './util/datenode';
import { dateParseArray } from './util/date';
import './util/date';
import './util/names/index';
import './util/dates';
import './util/sort';
import './util/substitute';
import { processNumber, LongOrdinalizer, Ordinalizer, Romanizer, Suffixator } from './util/number';
CSL.Util.LongOrdinalizer = LongOrdinalizer;
CSL.Util.Ordinalizer = Ordinalizer;
CSL.Util.Romanizer = Romanizer;
CSL.Util.Suffixator = Suffixator;
import './util/number';
import './util/page';
import './util/flipflop';
import './output/formatters';
import './output/formats';
import { Registry, Comparifier } from './registry/registry';
CSL.Registry = Registry;
CSL.Registry.Comparifier = Comparifier;
import { Disambiguation } from './disambig/cites';
CSL.Disambiguation = Disambiguation;
import './disambig/names';
import './disambig/citations';
import { getJurisdictionList, loadStyleModule, retrieveAllStyleModules } from './util/modules';
import './util/modules';
import './util/name_particles';

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
