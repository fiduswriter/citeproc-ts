import { error } from '../logger';

type Decoration = [string, string, string?];

interface BlobStrings {
    prefix: string;
    suffix: string;
    delimiter: string;
    "text-case"?: string;
    "first_blob"?: string;
    plural?: number;
    form?: string;
    [key: string]: string | number | undefined;
}

export class Blob {
    public levelname: string | undefined;
    public strings: BlobStrings;
    public decorations: Decoration[];
    public blobs: string | Blob[];
    public alldecor: Decoration[][];
    public num?: number;
    public particle?: string;
    public status?: number;
    public formatter?: any;
    public gender?: string;
    public successor_prefix?: string;
    public range_prefix?: string;
    public splice_prefix?: string;
    public punctuation_in_quote?: boolean;
    public new_locale?: string;
    public old_locale?: string;
    public isInstitution?: boolean;
    public suppress_splice_prefix?: boolean;
    public UGLY_DELIMITER_SUPPRESS_HACK?: boolean;
    public checkNext?: (next: any, start?: boolean) => void;
    public checkLast?: (last: any) => boolean;
    public params?: any;

    constructor(str?: string | Blob, token?: { strings?: Record<string, string | undefined>; decorations?: Decoration[] }, levelname?: string) {
        this.levelname = levelname;
        if (token) {
            this.strings = { "prefix": "", "suffix": "", "delimiter": "" };
            for (const key in token.strings) {
                if (token.strings.hasOwnProperty(key)) {
                    (this.strings as any)[key] = token.strings[key];
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
                this.decorations.push(token.decorations[pos].slice() as Decoration);
            }
        } else {
            this.strings = { prefix: "", suffix: "", delimiter: "" };
            this.decorations = [];
        }
        if ("string" === typeof str) {
            (this.blobs as string) = str;
        } else if (str) {
            this.blobs = [str as Blob];
        } else {
            this.blobs = [];
        }
        this.alldecor = [this.decorations];
    }

    public push(blob: any): void {
        if ("string" === typeof this.blobs) {
            error("Attempt to push blob onto string object");
        } else if (false !== blob) {
            blob.alldecor = blob.alldecor.concat(this.alldecor);
            (this.blobs as Blob[]).push(blob);
        }
    }
}
