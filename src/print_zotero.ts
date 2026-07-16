/*global CSL: true, Zotero: true */
import { CSL } from './csl';

CSL.debug = function (str: string): void {
    Zotero.debug("CSL: " + str);
};

CSL.error = function (str: string): void {
    Zotero.debug("CSL error: " + str);
};
