/**
 * Style token.
 * <p>This class provides the tokens that define
 * the runtime version of the style.  The tokens are
 * instantiated by {@link CSL.Core.Build}, but the token list
 * must be post-processed with
 * {@link CSL.Core.Configure} before it can be used to generate
 * citations.</p>
 */
type Decoration = [string, string, string?];
type TokenStrings = { delimiter?: string; prefix?: string; suffix?: string; form?: string; plural?: number; term?: string; value?: string; gender?: string; [key: string]: string | number | undefined };

export class Token {
    public name: string | undefined;
    public strings: TokenStrings;
    public decorations: Decoration[];
    public variables: string[];
    public execs: ((state: any, Item?: any, item?: any) => void)[];
    public tokentype: number | undefined;
    // Conditional branching fields (populated at runtime)
    public evaluator: any;
    public tests: any[];
    public test: any;
    public succeed: any;
    public fail: any;
    public next: any;
    public juris?: any;
    public dateparts?: any;
    public postponed_macro?: string;
    public range_prefix?: string;
    public successor_prefix?: string;
    public splice_prefix?: string;
    public formatter?: any;
    public gender?: string;
    public default_locale?: string;
    public requireMatch?: string;
    public isJurisLocatorLabel?: boolean;

    constructor(name?: string, tokentype?: number, conditional?: any) {
        /**
         * Name of the element.
         * <p>This corresponds to the element name of the
         * relevant tag in the CSL file.</p>
         */
        this.name = name;
        /**
         * Strings and other static content specific to the element.
         */
        this.strings = {};
        this.strings.delimiter = undefined;
        this.strings.prefix = "";
        this.strings.suffix = "";
        /**
         * Formatting parameters.
         */
        this.decorations = [];
        this.variables = [];
        /**
         * Element functions.
         */
        this.execs = [];
        /**
         * Token type.
         */
        this.tokentype = tokentype;
        // Conditional attributes added to bare tokens at runtime
        this.evaluator = false;
        this.tests = [];
        this.succeed = false;
        this.fail = false;
        this.next = false;
    }
}

export function Util_cloneToken(token: Token): Token {
    let newtok: Token, key: string, pos: number, len: number;
    if ("string" === typeof token) {
        return token as any;
    }
    newtok = new Token(token.name, token.tokentype);
    for (let key in token.strings) {
        if (token.strings.hasOwnProperty(key)) {
            newtok.strings[key] = token.strings[key];
        }
    }
    if (token.decorations) {
        newtok.decorations = [];
        for (let pos = 0, len = token.decorations.length; pos < len; pos += 1) {
            newtok.decorations.push(token.decorations[pos].slice() as any);
        }
    }
    if (token.variables) {
        newtok.variables = token.variables.slice();
    }
    if (token.execs) {
        newtok.execs = token.execs.slice();
        if (token.tests) {
            newtok.tests = token.tests.slice();
        }
    }
    return newtok;
}
