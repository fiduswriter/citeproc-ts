/*global CSL: true */

/**
 * A blob is a unit of rendered output, carrying its own formatting
 * strings, decorations and nested child blobs.
 */
export class Blob {
    public levelname: any;
    public strings: any;
    public decorations: any[];
    public blobs: any;
    public alldecor: any[];

    constructor(str: any, token?: any, levelname?: any) {
        this.levelname = levelname;
        if (token) {
            this.strings = { "prefix": "", "suffix": "" };
            for (const key in token.strings) {
                if (token.strings.hasOwnProperty(key)) {
                    this.strings[key] = token.strings[key];
                }
            }
            this.decorations = [];
            let len: number;
            if (token.decorations === undefined) {
                len = 0;
            } else {
                len = token.decorations.length;
            }
            for (let pos = 0; pos < len; pos += 1) {
                this.decorations.push(token.decorations[pos].slice());
            }
        } else {
            this.strings = {};
            this.strings.prefix = "";
            this.strings.suffix = "";
            this.strings.delimiter = "";
            this.decorations = [];
        }
        if ("string" === typeof str) {
            this.blobs = str;
        } else if (str) {
            this.blobs = [str];
        } else {
            this.blobs = [];
        }
        this.alldecor = [this.decorations];
    }

    public push(blob: any): void {
        if ("string" === typeof this.blobs) {
            CSL.error("Attempt to push blob onto string object");
        } else if (false !== blob) {
            blob.alldecor = blob.alldecor.concat(this.alldecor);
            this.blobs.push(blob);
        }
    }
}
