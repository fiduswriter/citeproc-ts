/*global CSL: true */

interface AmbigNameConfig {
    suffix?: boolean;
    "long-short"?: boolean;
    "given-initials"?: string;
    "given-long"?: boolean;
    "initials-first"?: boolean;
    "undifferentiated"?: number;
}

/**
 * Ambiguous Cite Configuration Object
 */
export class AmbigConfig {
    public maxvals: number[];
    public minval: number;
    public names: AmbigNameConfig[];
    public givens: AmbigNameConfig[][];
    public year_suffix: boolean | string;
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
