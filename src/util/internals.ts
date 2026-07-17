import { debug, error } from '../logger';
import { getAmbiguousCite, getSpliceDelimiter, getCitationCluster, getCite, citeStart, citeEnd } from '../engine/cite';
import { getBibliographyEntries } from '../engine/bibliography';
import { getSortKeys } from '../registry/registry';

export const internals: Record<string, any> = {
    Node: {},
    ITERATION: 0,
    debug,
    error,
    getAmbiguousCite,
    getSpliceDelimiter,
    getCitationCluster,
    getCite,
    citeStart,
    citeEnd,
    getBibliographyEntries,
    getSortKeys
};
