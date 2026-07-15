/**
 * Matcher used by conditional (if/else-if) branching tags to combine the
 * result of a set of test functions with ``any``/``all``/``none``/``nand``
 * semantics.
 */
export class Match {
    constructor() {
        // A bare <if> with no match attribute falls back to "all".
        (this as any)["undefined"] = this.all;
    }

    public any(token: any, state: any, tests: Array<(Item: CslItem, item: any) => boolean>): (Item: CslItem, item: any) => boolean {
        return (Item: CslItem, item: any): boolean => {
            for (let i = 0, ilen = tests.length; i < ilen; i += 1) {
                if (tests[i](Item, item)) {
                    return true;
                }
            }
            return false;
        };
    }

    public none(token: any, state: any, tests: Array<(Item: CslItem, item: any) => boolean>): (Item: CslItem, item: any) => boolean {
        return (Item: CslItem, item: any): boolean => {
            for (let i = 0, ilen = tests.length; i < ilen; i += 1) {
                if (!tests[i](Item, item)) {
                    return false;
                }
            }
            return true;
        };
    }

    public all(token: any, state: any, tests: Array<(Item: CslItem, item: any) => boolean>): (Item: CslItem, item: any) => boolean {
        return (Item: CslItem, item: any): boolean => {
            for (let i = 0, ilen = tests.length; i < ilen; i += 1) {
                if (!tests[i](Item, item)) {
                    return false;
                }
            }
            return true;
        };
    }

    public nand(token: any, state: any, tests: Array<(Item: CslItem, item: any) => boolean>): (Item: CslItem, item: any) => boolean {
        return (Item: CslItem, item: any): boolean => {
            for (let i = 0, ilen = tests.length; i < ilen; i += 1) {
                if (!tests[i](Item, item)) {
                    return true;
                }
            }
            return false;
        };
    }
}

export function encodeDoiForUrl(doi: string): string {
    return doi.replace(/[\u0000-\u0020"#%<>?[\\\]^`{|}\u007F-\u009F]/g, encodeURIComponent);
}
