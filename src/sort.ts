/*global CSL: true */

/**
 * Returns a comparison function for sorting, honouring any
 * processor-supplied ``CSL.stringCompare`` and locale collation rules.
 */
function getSortCompare(default_locale?: string): (a: string, b: string) => number {
    if (CSL.stringCompare) {
        return CSL.stringCompare;
    }
    const me: any = this;
    const strcmp_opts = {
        sensitivity: "base",
        ignorePunctuation: true,
        numeric: true
    };
    // In order, attempt the following:
    //   (1) Set locale collation from processor language
    //   (2) Use localeCompare()
    if (!default_locale) {
        default_locale = "en-US";
    }
    const strcmp = function (a: string, b: string): number {
        return CSL.toLocaleLowerCase.call(me, a).localeCompare(CSL.toLocaleLowerCase.call(me, b), default_locale as string, strcmp_opts);
    };
    const stripPunct = function (str: string): string {
        return str.replace(/^[\[\]\'\"]*/g, "");
    };
    const getBracketPreSort = function (): ((a: string, b: string) => number) | false {
        if (!strcmp("[x", "x")) {
            return false;
        } else {
            return function (a: string, b: string): number {
                return strcmp(stripPunct(a), stripPunct(b));
            };
        }
    };
    const bracketPreSort = getBracketPreSort();
    return function (a: string, b: string): number {
        if (bracketPreSort) {
            return bracketPreSort(a, b);
        } else {
            return strcmp(a, b);
        }
    };
}

CSL.getSortCompare = getSortCompare;
