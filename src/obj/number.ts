import { CSL } from '../csl';

import { END, SEEN, START, SUCCESSOR, SUCCESSOR_OF_SUCCESSOR, SUPPRESS } from '../constants/core';

type Decoration = [string, string, string?];

interface NumericStrings {
    prefix: string;
    suffix: string;
    "text-case"?: string;
    [key: string]: string | undefined;
}

/**
 * An output instance object representing a number or a range
 *
 * with attributes next and start, and
 * methods isRange(), renderStart(), renderEnd() and renderRange().
 * At render time, the output queue will perform optional
 * collapsing of these objects in the queue, according to
 * configurable options, and apply any decorations registered
 * in the object to the output elements.
 */
export class NumericBlob {
    public id: string | undefined;
    public alldecor: Decoration[][];
    public num: number;
    public particle: string;
    public blobs: string;
    public status: number;
    public strings: NumericStrings;
    public gender: string | undefined;
    public decorations: Decoration[];
    public successor_prefix: string;
    public range_prefix: string;
    public splice_prefix: string;
    public formatter: any;
    public type: string | undefined;
    public UGLY_DELIMITER_SUPPRESS_HACK?: boolean;
    public suppress_splice_prefix?: boolean;

    constructor(state: any, particle: string, num: number, mother_token: any, id: string | undefined) {
        // item id is used to assure that prefix delimiter is invoked only
        // when joining blobs across items
        this.id = id;
        this.alldecor = [];
        this.num = num;
        this.particle = particle;
        this.blobs = num.toString();
        this.status = START;
        this.strings = {} as NumericStrings;
        if (mother_token) {
            if (mother_token.strings["text-case"]) {
                const textCase = mother_token.strings["text-case"];
                this.particle = CSL.Output.Formatters[textCase](state, this.particle);
                this.blobs = CSL.Output.Formatters[textCase](state, this.blobs);
            }
            this.gender = mother_token.gender;
            this.decorations = mother_token.decorations;
            this.strings.prefix = mother_token.strings.prefix;
            this.strings.suffix = mother_token.strings.suffix;
            this.strings["text-case"] = mother_token.strings["text-case"];
            this.successor_prefix = mother_token.successor_prefix;
            this.range_prefix = mother_token.range_prefix;
            this.splice_prefix = mother_token.splice_prefix;
            this.formatter = mother_token.formatter;
            if (!this.formatter) {
                this.formatter = new CSL.Output.DefaultFormatter();
            }
            if (this.formatter) {
                this.type = this.formatter.format(1);
            }
        } else {
            this.decorations = [];
            this.strings.prefix = "";
            this.strings.suffix = "";
            this.successor_prefix = "";
            this.range_prefix = "";
            this.splice_prefix = "";
            this.formatter = new CSL.Output.DefaultFormatter();
        }
    }

    public setFormatter(formatter: { format(num: number): string }): void {
        this.formatter = formatter;
        this.type = this.formatter.format(1);
    }

    public checkNext(next: any, start?: any): void {
        if (start) {
            this.status = START;
            if ("object" === typeof next) {
                if (next.num === (this.num + 1)) {
                    next.status = SUCCESSOR;
                } else {
                    next.status = SEEN;
                }
            }
        } else if (!next || !next.num || this.type !== next.type || next.num !== (this.num + 1)) {
            if (this.status === SUCCESSOR_OF_SUCCESSOR) {
                this.status = END;
            }
            if ("object" === typeof next) {
                next.status = SEEN;
            }
        } else { // next number is in the sequence
            if (this.status === START || this.status === SEEN) {
                next.status = SUCCESSOR;
            } else if (this.status === SUCCESSOR || this.status === SUCCESSOR_OF_SUCCESSOR) {
                if (this.range_prefix) {
                    next.status = SUCCESSOR_OF_SUCCESSOR;
                    this.status = SUPPRESS;
                } else {
                    next.status = SUCCESSOR;
                }
            }
        }
    }

    public checkLast(last: any): boolean {
        // Used to adjust final non-range join
        if (this.status === SEEN
            || (last.num !== (this.num - 1) && this.status === SUCCESSOR)) {
            this.status = SUCCESSOR;
            return true;
        }
        return false;
    }
}

export class Output_DefaultFormatter {
    public format(num: number): string {
        return num.toString();
    }
}
