/*global CSL: true */

/**
 * Shared data shapes (CSL-JSON input and the processor runtime).
 *
 * These interfaces describe the stable public data that flows through the
 * processor.
 */

interface CslName {
    family?: string;
    given?: string;
    "non-dropping-particle"?: string;
    "dropping-particle"?: string;
    suffix?: string;
    "comma-suffix"?: number | boolean;
    "static-order"?: string;
    literal?: string;
    "parse-names"?: boolean;
    isInstitution?: boolean;
    "reverse-ordering"?: boolean;
    "static-ordering"?: boolean;
    "comma-dropping-particle"?: string;
    multi?: { main?: string; _keys?: Record<string, Record<string, string>> };
    language?: string;
    [key: string]: unknown;
}

interface CslDate {
    "date-parts"?: number[][];
    season?: string | number;
    literal?: string;
    [key: string]: unknown;
}

interface CslItem {
    id: string;
    type: string;
    language?: string;
    jurisdiction?: string;
    authority?: string | CslName[];
    "legislation_id"?: string;
    "container_id"?: string;
    "citation-label"?: string;
    "citation-number"?: string;
    "year-suffix"?: string;
    "first-reference-note-number"?: number;
    multi?: { _keys?: Record<string, Record<string, string>> };
    note?: string;
    locator?: string;
    label?: string;
    title?: string;
    "title-short"?: string;
    [key: string]: any;
}

/**
 * A parsed CSL node instance.  This is the ``this`` of every
 * ``CSL.Node.<name>.build``/``configure``/``configure_`` function.  Only the
 * members read by the migrated leaf builders are pinned down; everything else
 * falls through the index signature until the owning modules are migrated.
 */
type Decoration = [string, string, string?];

interface CslNode {
    tokentype?: number;
    name?: string;
    match?: string;
    strings?: Record<string, string | number | undefined>;
    tests?: any[];
    decorations?: Decoration[];
    variables?: string[];
    variables_real?: string[];
    execs?: Array<(state: CslState, Item?: CslItem, item?: any) => void>;
    [key: string]: any;
}

/** The ``sys`` object supplied by the host application. */
interface Sys {
    retrieveLocale(lang: string): string | boolean;
    retrieveItem(id: string): CslItem;
    getAbbreviation?(styleID: string, abbrevs: any, jurisdiction: string, category: string, orig: string): string;
    getHumanForm?(key: string, plural: boolean, article: boolean): string;
    retrieveStyleModule?(jurisdiction: string): string;
    variableWrapper?(citation: any, ...args: any[]): any;
    normalizeAbbrevsKey?(category: string, value: string): string;
    AbbreviationSegments?: new () => any;
    print?(str: string): void;
    [key: string]: any;
}

/** A text formatter registered against token decorations. */
type Formatter = (state: CslState, str: string) => string;

type TextCaseConfig = {
    quoteState?: any;
    capitaliseWords: (str: string, ...rest: any[]) => string;
    skipWordsRex?: any;
    tagState: any[];
    afterPunct?: any;
    isFirst?: any;
    lastWordPos?: any;
    doppel?: any;
    origStrings?: any;
    [key: string]: any;
};

/**
 * The per-render ``state`` object threaded through the engine.  Only the
 * most heavily used members are pinned down here; the rest fall through
 * the index signature.
 */
interface CslState {
    sys: Sys;
    opt: { lang: string; nodenames: string[]; [key: string]: any };
    locale: { [lang: string]: any };
    tmp: { [key: string]: any };
    registry: any;
    mode: string;
    output?: any;
    parallel?: any;
    transform?: any;
    citeproc?: any;
    publisherOutput?: any;
    juris?: any;
    debug?: boolean;
    fresh?(clear?: boolean): void;
    getTerm(term: string, form?: string, plural?: number | boolean, gender?: number | boolean, mode?: number | boolean, forceDefaultLocale?: boolean): string;
    [key: string]: any;
}

/**
 * The single global ``CSL`` namespace.  Migrated modules add precisely typed
 * members; the index-signature escape hatch keeps not-yet-migrated code
 * compiling (those references resolve to ``any``).
 */
interface CSLNamespace {
    Stack?: typeof import('../stack').Stack;
    Token?: typeof import('../obj/token').Token;
    Blob?: typeof import('../obj/blob').Blob;
    NumericBlob?: typeof import('../obj/number').NumericBlob;
    AmbigConfig?: typeof import('../obj/ambigconfig').AmbigConfig;
    XmlJSON?: typeof import('../xml/xmljson').XmlJSON;
    Engine?: any;
    NameOutput?: any;
    PublisherOutput?: any;
    Node?: any;
    Attributes?: any;
    Registry?: any;
    Transform?: any;
    Parallel?: any;
    NameReg?: any;
    CitationReg?: any;
    Disambiguation?: any;
    DateParser?: any;
    ParticleList?: any;
    getSortCompare?: (default_locale?: string) => (a: string, b: string) => number;
    Util?: {
        cloneToken?(token: any): any;
        encodeDoiForUrl?(doi: string): string;
        Match?: any;
        Names?: any;
        Dates?: any;
        Sort?: any;
        padding?(num: string): string;
        outputNumericField?(state: CslState, variable: string, id: string): void;
        LongOrdinalizer?: any;
        Ordinalizer?: any;
        Romanizer?: any;
        Suffixator?: any;
        PageRangeMangler?: any;
        FlipFlopper?: any;
        substituteStart?(state: CslState, target: any[]): void;
        substituteEnd?(state: CslState, target: any[]): void;
        fixDateNode?: any;
        [key: string]: any;
    };
    Output?: {
        Formatters?: Record<string, Formatter>;
        Queue?: any;
        DefaultFormatter?: any;
        Formats?: any;
        [key: string]: any;
    };

    // --- escape hatch for not-yet-migrated code ---
    [key: string]: any;
}

/**
 * Ambient global CSL namespace.  Populated at module-init time by the
 * index module; available in every module that references it.
 */
declare const CSL: CSLNamespace;

/**
 * Ambient globals referenced by environment shims and not provided by the
 * configured lib (``ES2018``).
 */
declare const console: { log(...args: any[]): void; warn?(...args: any[]): void; error?(...args: any[]): void; [key: string]: any };
declare let DOMParser: { new(): any };
declare const Zotero: { [key: string]: any };
declare const Components: { [key: string]: any };
