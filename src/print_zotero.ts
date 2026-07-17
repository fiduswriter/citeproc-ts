/*global CSL: true, Zotero: true */
import { internals } from './util/internals';

internals.debug = function (str: string): void {
    Zotero.debug("CSL: " + str);
};

internals.error = function (str: string): void {
    Zotero.debug("CSL error: " + str);
};
