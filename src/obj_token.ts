/*global CSL: true */

/**
 * Style token.
 * <p>This class provides the tokens that define
 * the runtime version of the style.  The tokens are
 * instantiated by {@link CSL.Core.Build}, but the token list
 * must be post-processed with
 * {@link CSL.Core.Configure} before it can be used to generate
 * citations.</p>
 */
class Token {
    public name: any;
    public strings: any;
    public decorations: any[];
    public variables: any[];
    public execs: any[];
    public tokentype: any;
    // Conditional branching fields (populated at runtime)
    public evaluator: any;
    public tests: any[];
    public succeed: any;
    public fail: any;
    public next: any;

    constructor(name: any, tokentype: any, conditional?: any) {
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

CSL.Token = Token;

function cloneToken(token: any): any {
    let newtok: any, key: any, pos: number, len: number;
    if ("string" === typeof token) {
        return token;
    }
    newtok = new CSL.Token(token.name, token.tokentype);
    for (key in token.strings) {
        if (token.strings.hasOwnProperty(key)) {
            newtok.strings[key] = token.strings[key];
        }
    }
    if (token.decorations) {
        newtok.decorations = [];
        for (pos = 0, len = token.decorations.length; pos < len; pos += 1) {
            newtok.decorations.push(token.decorations[pos].slice());
        }
    }
    if (token.variables) {
        newtok.variables = token.variables.slice();
    }
    // Probably overkill; this is only used for cloning formatting
    // tokens.
    if (token.execs) {
        newtok.execs = token.execs.slice();
        if (token.tests) {
            newtok.tests = token.tests.slice();
        }
    }
    return newtok;
}

CSL.Util.cloneToken = cloneToken;
