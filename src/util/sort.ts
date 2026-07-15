/*global CSL: true */

export const Util_Sort: any = {};

Util_Sort.strip_prepositions = function (str: string): string {
    let m: RegExpMatchArray | null = null;
    if ("string" === typeof str) {
        m = str.match(/^(([aA]|[aA][nN]|[tT][hH][eE])\s+)/);
    }
    if (m) {
        str = str.substr(m[1].length);
    }
    return str;
};
