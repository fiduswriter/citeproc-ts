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
    getTerm(term: string, form?: string, plural?: boolean, gender?: number, mode?: number, forceDefaultLocale?: boolean): any;
    [key: string]: any;
}

/**
 * The single global ``CSL`` namespace.  Migrated modules add precisely typed
 * members; the index-signature escape hatch keeps not-yet-migrated code
 * compiling (those references resolve to ``any``).
 */
interface CSLNamespace {
    // --- migrated modules (typed) ---
    Stack: typeof Stack;
    Token: typeof Token;
    Blob: typeof Blob;
    NumericBlob: typeof NumericBlob;
    AmbigConfig: typeof AmbigConfig;
    getSortCompare: (default_locale?: string) => (a: string, b: string) => number;
    Util: {
        cloneToken?(token: any): any;
        encodeDoiForUrl?(doi: string): string;
        Match?: any;
        [key: string]: any;
    };
    Output: {
        Formatters: Record<string, Formatter>;
        [key: string]: any;
    };

    // --- escape hatch for not-yet-migrated code ---
    [key: string]: any;
}

declare const CSL: CSLNamespace;
