/*global CSL: true */

/**
 * Shared data shapes (CSL-JSON input and the processor runtime).
 *
 * These interfaces describe the stable public data that flows through the
 * processor.  They are the foundation of the TypeScript migration: as more
 * modules are ported, their parameter and return types are expressed in
 * terms of these names instead of ``any``.
 */

interface CslName {
    family?: string;
    given?: string;
    "non-dropping-particle"?: string;
    "dropping-particle"?: string;
    suffix?: string;
    "comma-suffix"?: number | boolean;
    "static-order"?: string;
    [key: string]: any;
}

interface CslDate {
    "date-parts"?: number[][];
    season?: string | number;
    literal?: string;
    [key: string]: any;
}

interface CslItem {
    id: string;
    type: string;
    [key: string]: any;
}

/**
 * A parsed CSL node instance.  This is the ``this`` of every
 * ``CSL.Node.<name>.build``/``configure``/``configure_`` function.  Only the
 * members read by the migrated leaf builders are pinned down; everything else
 * falls through the index signature until the owning modules are migrated.
 */
interface CslNode {
    tokentype?: string;
    name?: string;
    match?: string;
    strings?: { [key: string]: any };
    tests?: any[];
    execs?: Array<(state: CslState, Item?: CslItem, item?: any) => void>;
    [key: string]: any;
}

/** The ``sys`` object supplied by the host application. */
interface Sys {
    retrieveLocale(lang: string): string | boolean;
    retrieveItem(id: string): CslItem;
    [key: string]: any;
}

/** A text formatter registered against token decorations. */
type Formatter = (state: CslState, str: string) => string;

type TextCaseConfig = {
    quoteState?: any;
    capitaliseWords: (str: string, ...rest: any[]) => string;
    skipWordsRex: any;
    tagState: any[];
    afterPunct: any;
    isFirst: any;
    lastWordPos?: any;
    doppel?: any;
    origStrings?: any;
    [key: string]: any;
};

/**
 * The per-render ``state`` object threaded through the engine.  Only the
 * most heavily used members are pinned down here; everything else falls
 * through the index signature until the modules that own it are migrated.
 */
interface CslState {
    sys: Sys;
    opt: { lang: string; nodenames: any[]; [key: string]: any };
    locale: { [lang: string]: any };
    tmp: { [key: string]: any };
    registry: any;
    mode: string;
    fresh?(clear?: boolean): void;
    getTerm(term: string, form?: string, plural?: number | boolean, gender?: number | boolean, mode?: number | boolean, forceDefaultLocale?: boolean): any;
    [key: string]: any;
}

/**
 * The single global ``CSL`` namespace.  Migrated modules add precisely typed
 * members; the index-signature escape hatch keeps not-yet-migrated code
 * compiling (those references resolve to ``any``).
 */
interface CSLNamespace {
    // --- migrated modules (typed) ---
    // These are optional because ``load.ts`` opens the ``CSL`` object before
    // the modules that populate these members have run.
    Stack?: any;
    Token?: any;
    Blob?: any;
    NumericBlob?: any;
    AmbigConfig?: any;
    getSortCompare?: (default_locale?: string) => (a: string, b: string) => number;
    Util?: {
        cloneToken?(token: any): any;
        encodeDoiForUrl?(doi: string): string;
        Match?: any;
        [key: string]: any;
    };
    Output?: {
        Formatters?: Record<string, Formatter>;
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
declare const console: { log(...args: any[]): void; [key: string]: any };
declare function dump(...args: any[]): void;
declare const Zotero: any;
declare const Components: any;

/**
 * Host-runtime globals (Rhino/Narwhal/SpiderMonkey) used by a handful of
 * modules.  They are never present in the bundled browser/CommonJS builds, so
 * they are typed as ``any``.
 */
declare let DOMParser: any;
declare const ActiveXObject: any;
declare const XMLHttpRequest: any;
declare const marknote: any;
declare function XML(str: string): any;
declare function readFile(...args: any[]): any;
declare function snarf(...args: any[]): any;
declare function read(...args: any[]): any;
declare const load: any;
declare function print(...args: any[]): void;
