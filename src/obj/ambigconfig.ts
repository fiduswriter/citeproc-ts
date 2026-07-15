/*global CSL: true */

/**
 * Ambiguous Cite Configuration Object
 */
export class AmbigConfig {
    public maxvals: any[];
    public minval: number;
    public names: any[];
    public givens: any[];
    public year_suffix: boolean;
    public disambiguate: number;

    constructor() {
        this.maxvals = [];
        this.minval = 1;
        this.names = [];
        this.givens = [];
        this.year_suffix = false;
        this.disambiguate = 0;
    }
}
