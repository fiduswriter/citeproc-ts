import { CSL } from '../csl';

import { END, SEEN, START, SUCCESSOR, SUCCESSOR_OF_SUCCESSOR, SUPPRESS } from '../constants/core';
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
    public id: any;
    public alldecor: any[];
    public num: any;
    public particle: any;
    public blobs: any;
    public status: any;
    public strings: any;
    public gender: any;
    public decorations: any;
    public successor_prefix: any;
    public range_prefix: any;
    public splice_prefix: any;
    public formatter: any;
    public type: any;

    constructor(state: any, particle: any, num: any, mother_token: any, id: any) {
        // item id is used to assure that prefix delimiter is invoked only
        // when joining blobs across items
        this.id = id;
        this.alldecor = [];
        this.num = num;
        this.particle = particle;
        this.blobs = num.toString();
        this.status = START;
        this.strings = {};
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

    public setFormatter(formatter: any): void {
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
    public format(num: any): string {
        return num.toString();
    }
}
