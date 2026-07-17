import { CSL } from '../csl';
import { encodeDoiForUrl } from '../util/util';
import { Output_formatters } from './formatters';

import { SWAPPING_PUNCTUATION } from '../constants/core';
import { SUPERSCRIPTS, SUPERSCRIPTS_REGEXP } from '../constants/regex';
/**
 * Output specifications.
 * @class
 */
class OutputFormats {
    [key: string]: any;
}

/**
 * HTML output format specification.
 */
(OutputFormats.prototype as Record<string, any>).html = {
    "text_escape": function (text?: string): string {
        if (!text) {
            text = "";
        }
        return text.replace(/&/g, "&#38;")
            .replace(/</g, "&#60;")
            .replace(/>/g, "&#62;")
            .replace(/\s\s/g, "\u00A0 ")
            .replace(SUPERSCRIPTS_REGEXP,
                function (aChar: string) {
                    return "<sup>" + SUPERSCRIPTS[aChar] + "</sup>";
                });
    },
    "bibstart": "<div class=\"csl-bib-body\">\n",
    "bibend": "</div>",
    "@font-style/italic": "<i>%%STRING%%</i>",
    "@font-style/oblique": "<em>%%STRING%%</em>",
    "@font-style/normal": "<span style=\"font-style:normal;\">%%STRING%%</span>",
    "@font-variant/small-caps": "<span style=\"font-variant:small-caps;\">%%STRING%%</span>",
    "@passthrough/true": Output_formatters.passthrough,
    "@font-variant/normal": "<span style=\"font-variant:normal;\">%%STRING%%</span>",
    "@font-weight/bold": "<b>%%STRING%%</b>",
    "@font-weight/normal": "<span style=\"font-weight:normal;\">%%STRING%%</span>",
    "@font-weight/light": false,
    "@text-decoration/none": "<span style=\"text-decoration:none;\">%%STRING%%</span>",
    "@text-decoration/underline": "<span style=\"text-decoration:underline;\">%%STRING%%</span>",
    "@vertical-align/sup": "<sup>%%STRING%%</sup>",
    "@vertical-align/sub": "<sub>%%STRING%%</sub>",
    "@vertical-align/baseline": "<span style=\"baseline\">%%STRING%%</span>",
    "@strip-periods/true": Output_formatters.passthrough,
    "@strip-periods/false": Output_formatters.passthrough,
    "@quotes/true": function (state: CslState, str?: string): string | false {
        if ("undefined" === typeof str) {
            return state.getTerm("open-quote");
        }
        return state.getTerm("open-quote") + str + state.getTerm("close-quote");
    },
    "@quotes/inner": function (state: CslState, str?: string): string | false {
        if ("undefined" === typeof str) {
            return "\u2019";
        }
        return state.getTerm("open-inner-quote") + str + state.getTerm("close-inner-quote");
    },
    "@quotes/false": false,
    "@cite/entry": function (state: CslState, str: string): string {
        return state.sys.wrapCitationEntry(str, this.item_id, this.locator_txt, this.suffix_txt);
    },
    "@bibliography/entry": function (state: CslState, str: string): string {
        let insert = "";
        if (state.sys.embedBibliographyEntry) {
            insert = state.sys.embedBibliographyEntry(this.item_id) + "\n";
        }
        return "  <div class=\"csl-entry\">" + str + "</div>\n" + insert;
    },
    "@display/block": function (state: CslState, str: string): string {
        return "\n\n    <div class=\"csl-block\">" + str + "</div>\n";
    },
    "@display/left-margin": function (state: CslState, str: string): string {
        return "\n    <div class=\"csl-left-margin\">" + str + "</div>";
    },
    "@display/right-inline": function (state: CslState, str: string): string {
        return "<div class=\"csl-right-inline\">" + str + "</div>\n  ";
    },
    "@display/indent": function (state: CslState, str: string): string {
        return "<div class=\"csl-indent\">" + str + "</div>\n  ";
    },
    "@showid/true": function (state: CslState, str: string, cslid?: any): string {
        if (!state.tmp.just_looking && !state.tmp.suppress_decorations) {
            if (cslid) {
                return "<span class=\"" + state.opt.nodenames[cslid] + "\" cslid=\"" + cslid + "\">" + str + "</span>";
            } else if (this.params && "string" === typeof str) {
                let prePunct = "";
                if (str) {
                    const m = str.match(CSL.VARIABLE_WRAPPER_PREPUNCT_REX);
                    prePunct = m[1];
                    str = m[2];
                }
                let postPunct = "";
                if (str && SWAPPING_PUNCTUATION.indexOf(str.slice(-1)) > -1) {
                    postPunct = str.slice(-1);
                    str = str.slice(0, -1);
                }
                return state.sys.variableWrapper(this.params, prePunct, str, postPunct);
            } else {
                return str;
            }
        } else {
            return str;
        }
    },
    "@URL/true": function (state: CslState, str: string): string {
        return "<a href=\"" + str + "\">" + str + "</a>";
    },
    "@DOI/true": function (state: CslState, str: string): string {
        let doiurl = str;
        if (!str.match(/^https?:\/\//)) {
            doiurl = "https://doi.org/" + encodeDoiForUrl(str);
        }
        return "<a href=\"" + doiurl + "\">" + str + "</a>";
    }
};

/** Plain text output specification. */
(OutputFormats.prototype as Record<string, any>).text = {
    "text_escape": function (text?: string): string {
        if (!text) {
            text = "";
        }
        return text;
    },
    "bibstart": "",
    "bibend": "",
    "@font-style/italic": false,
    "@font-style/oblique": false,
    "@font-style/normal": false,
    "@font-variant/small-caps": false,
    "@passthrough/true": Output_formatters.passthrough,
    "@font-variant/normal": false,
    "@font-weight/bold": false,
    "@font-weight/normal": false,
    "@font-weight/light": false,
    "@text-decoration/none": false,
    "@text-decoration/underline": false,
    "@vertical-align/baseline": false,
    "@vertical-align/sup": false,
    "@vertical-align/sub": false,
    "@strip-periods/true": Output_formatters.passthrough,
    "@strip-periods/false": Output_formatters.passthrough,
    "@quotes/true": function (state: CslState, str?: string): string | false {
        if ("undefined" === typeof str) {
            return state.getTerm("open-quote");
        }
        return state.getTerm("open-quote") + str + state.getTerm("close-quote");
    },
    "@quotes/inner": function (state: CslState, str?: string): string | false {
        if ("undefined" === typeof str) {
            return "\u2019";
        }
        return state.getTerm("open-inner-quote") + str + state.getTerm("close-inner-quote");
    },
    "@quotes/false": false,
    "@cite/entry": function (state: CslState, str: string): string {
        return state.sys.wrapCitationEntry(str, this.item_id, this.locator_txt, this.suffix_txt);
    },
    "@bibliography/entry": function (state: CslState, str: string): string {
        return str + "\n";
    },
    "@display/block": function (state: CslState, str: string): string {
        return "\n" + str;
    },
    "@display/left-margin": function (state: CslState, str: string): string {
        return str + " ";
    },
    "@display/right-inline": function (state: CslState, str: string): string {
        return str;
    },
    "@display/indent": function (state: CslState, str: string): string {
        return "\n    " + str;
    },
    "@showid/true": function (state: CslState, str: string): string {
        return str;
    },
    "@URL/true": function (state: CslState, str: string): string {
        return str;
    },
    "@DOI/true": function (state: CslState, str: string): string {
        return str;
    }
};

/** RTF output specification. */
(OutputFormats.prototype as Record<string, any>).rtf = {
    "text_escape": function (text?: string): string {
        if (!text) {
            text = "";
        }
        return text
            .replace(/([\\{}])/g, "\\$1")
            .replace(SUPERSCRIPTS_REGEXP,
                function (aChar: string) {
                    return "\\super " + SUPERSCRIPTS[aChar] + "\\nosupersub{}";
                })
            .replace(/[\u007F-\uFFFF]/g,
                function (aChar: string) { return "\\uc0\\u" + aChar.charCodeAt(0).toString() + "{}"; })
            .split("\t").join("\\tab{}");
    },
    "@passthrough/true": Output_formatters.passthrough,
    "@font-style/italic": "{\\i{}%%STRING%%}",
    "@font-style/normal": "{\\i0{}%%STRING%%}",
    "@font-style/oblique": "{\\i{}%%STRING%%}",
    "@font-variant/small-caps": "{\\scaps %%STRING%%}",
    "@font-variant/normal": "{\\scaps0{}%%STRING%%}",
    "@font-weight/bold": "{\\b{}%%STRING%%}",
    "@font-weight/normal": "{\\b0{}%%STRING%%}",
    "@font-weight/light": false,
    "@text-decoration/none": false,
    "@text-decoration/underline": "{\\ul{}%%STRING%%}",
    "@vertical-align/baseline": false,
    "@vertical-align/sup": "\\super %%STRING%%\\nosupersub{}",
    "@vertical-align/sub": "\\sub %%STRING%%\\nosupersub{}",
    "@strip-periods/true": Output_formatters.passthrough,
    "@strip-periods/false": Output_formatters.passthrough,
    "@quotes/true": function (state: CslState, str?: string): string | false {
        if ("undefined" === typeof str) {
            return Output_formats.rtf.text_escape(state.getTerm("open-quote"));
        }
        return Output_formats.rtf.text_escape(state.getTerm("open-quote")) + str + Output_formats.rtf.text_escape(state.getTerm("close-quote"));
    },
    "@quotes/inner": function (state: CslState, str?: string): string | false {
        if ("undefined" === typeof str) {
            return Output_formats.rtf.text_escape("\u2019");
        }
        return Output_formats.rtf.text_escape(state.getTerm("open-inner-quote")) + str + Output_formats.rtf.text_escape(state.getTerm("close-inner-quote"));
    },
    "@quotes/false": false,
    "bibstart": "{\\rtf ",
    "bibend": "}",
    "@display/block": "\\line{}%%STRING%%\\line\r\n",
    "@cite/entry": function (state: CslState, str: string): string {
        return state.sys.wrapCitationEntry(str, this.item_id, this.locator_txt, this.suffix_txt);
    },
    "@bibliography/entry": function (state: CslState, str: string): string {
        return str;
    },
    "@display/left-margin": function (state: CslState, str: string): string {
        return str + "\\tab ";
    },
    "@display/right-inline": function (state: CslState, str: string): string {
        return str + "\r\n";
    },
    "@display/indent": function (state: CslState, str: string): string {
        return "\n\\tab " + str + "\\line\r\n";
    },
    "@showid/true": function (state: CslState, str: string): string {
        if (!state.tmp.just_looking && !state.tmp.suppress_decorations) {
            let prePunct = "";
            if (str) {
                const m = str.match(CSL.VARIABLE_WRAPPER_PREPUNCT_REX);
                prePunct = m[1];
                str = m[2];
            }
            let postPunct = "";
            if (str && SWAPPING_PUNCTUATION.indexOf(str.slice(-1)) > -1) {
                postPunct = str.slice(-1);
                str = str.slice(0, -1);
            }
            return state.sys.variableWrapper(this.params, prePunct, str, postPunct);
        } else {
            return str;
        }
    },
    "@URL/true": function (state: CslState, str: string): string {
        return str;
    },
    "@DOI/true": function (state: CslState, str: string): string {
        return str;
    }
};

/** AsciiDoc output specification. */
(OutputFormats.prototype as Record<string, any>).asciidoc = {
    "text_escape": function (text?: string): string {
        if (!text) {
            text = "";
        }
        return text.replace("*", "pass:[*]")
            .replace("_", "pass:[_]")
            .replace("#", "pass:[#]")
            .replace("^", "pass:[^]")
            .replace("~", "pass:[~]")
            .replace("[[", "pass:[[[]")
            .replace("  ", "&#160; ")
            .replace(SUPERSCRIPTS_REGEXP, function (aChar: string) {
                return "^" + SUPERSCRIPTS[aChar] + "^";
            });
    },
    "bibstart": "",
    "bibend": "",
    "@passthrough/true": Output_formatters.passthrough,
    "@font-style/italic": "__%%STRING%%__",
    "@font-style/oblique": "__%%STRING%%__",
    "@font-style/normal": false,
    "@font-variant/small-caps": "[small-caps]#%%STRING%%#",
    "@font-variant/normal": false,
    "@font-weight/bold": "**%%STRING%%**",
    "@font-weight/normal": false,
    "@font-weight/light": false,
    "@text-decoration/none": false,
    "@text-decoration/underline": "[underline]##%%STRING%%##",
    "@vertical-align/sup": "^^%%STRING%%^^",
    "@vertical-align/sub": "~~%%STRING%%~~",
    "@vertical-align/baseline": false,
    "@strip-periods/true": Output_formatters.passthrough,
    "@strip-periods/false": Output_formatters.passthrough,
    "@quotes/true": function (state: CslState, str?: string): string | false {
        if ("undefined" === typeof str) {
            return "``";
        }
        return "``" + str + "''";
    },
    "@quotes/inner": function (state: CslState, str?: string): string | false {
        if ("undefined" === typeof str) {
            return "`";
        }
        return "`" + str + "'";
    },
    "@quotes/false": false,
    "@cite/entry": function (state: CslState, str: string): string {
        return state.sys.wrapCitationEntry(str, this.item_id, this.locator_txt, this.suffix_txt);
    },
    "@bibliography/entry": function (state: CslState, str: string): string {
        return str + "\n";
    },
    "@display/block": function (state: CslState, str: string): string {
        return str;
    },
    "@display/left-margin": function (state: CslState, str: string): string {
        return str;
    },
    "@display/right-inline": function (state: CslState, str: string): string {
        return " " + str;
    },
    "@display/indent": function (state: CslState, str: string): string {
        return " " + str;
    },
    "@showid/true": function (state: CslState, str: string): string {
        if (!state.tmp.just_looking && !state.tmp.suppress_decorations && this.params && "string" === typeof str) {
            let prePunct = "";
            if (str) {
                const m = str.match(CSL.VARIABLE_WRAPPER_PREPUNCT_REX);
                prePunct = m[1];
                str = m[2];
            }
            let postPunct = "";
            if (str && SWAPPING_PUNCTUATION.indexOf(str.slice(-1)) > -1) {
                postPunct = str.slice(-1);
                str = str.slice(0, -1);
            }
            return state.sys.variableWrapper(this.params, prePunct, str, postPunct);
        } else {
            return str;
        }
    },
    "@URL/true": function (state: CslState, str: string): string {
        return str;
    },
    "@DOI/true": function (state: CslState, str: string): string {
        let doiurl = str;
        if (!str.match(/^https?:\/\//)) {
            doiurl = "https://doi.org/" + encodeDoiForUrl(str);
        }
        return doiurl + "[" + str + "]";
    }
};

/** XSL-FO output specification. */
(OutputFormats.prototype as Record<string, any>).fo = {
    "text_escape": function (text?: string): string {
        if (!text) {
            text = "";
        }
        return text.replace(/&/g, "&#38;")
            .replace(/</g, "&#60;")
            .replace(/>/g, "&#62;")
            .replace("  ", "&#160; ")
            .replace(SUPERSCRIPTS_REGEXP, function (aChar: string) {
                return "<fo:inline vertical-align=\"super\">" + SUPERSCRIPTS[aChar] + "</fo:inline>";
            });
    },
    "bibstart": "",
    "bibend": "",
    "@passthrough/true": Output_formatters.passthrough,
    "@font-style/italic": "<fo:inline font-style=\"italic\">%%STRING%%</fo:inline>",
    "@font-style/oblique": "<fo:inline font-style=\"oblique\">%%STRING%%</fo:inline>",
    "@font-style/normal": "<fo:inline font-style=\"normal\">%%STRING%%</fo:inline>",
    "@font-variant/small-caps": "<fo:inline font-variant=\"small-caps\">%%STRING%%</fo:inline>",
    "@font-variant/normal": "<fo:inline font-variant=\"normal\">%%STRING%%</fo:inline>",
    "@font-weight/bold": "<fo:inline font-weight=\"bold\">%%STRING%%</fo:inline>",
    "@font-weight/normal": "<fo:inline font-weight=\"normal\">%%STRING%%</fo:inline>",
    "@font-weight/light": "<fo:inline font-weight=\"lighter\">%%STRING%%</fo:inline>",
    "@text-decoration/none": "<fo:inline text-decoration=\"none\">%%STRING%%</fo:inline>",
    "@text-decoration/underline": "<fo:inline text-decoration=\"underline\">%%STRING%%</fo:inline>",
    "@vertical-align/sup": "<fo:inline vertical-align=\"super\">%%STRING%%</fo:inline>",
    "@vertical-align/sub": "<fo:inline vertical-align=\"sub\">%%STRING%%</fo:inline>",
    "@vertical-align/baseline": "<fo:inline vertical-align=\"baseline\">%%STRING%%</fo:inline>",
    "@strip-periods/true": Output_formatters.passthrough,
    "@strip-periods/false": Output_formatters.passthrough,
    "@quotes/true": function (state: CslState, str?: string): string | false {
        if ("undefined" === typeof str) {
            return state.getTerm("open-quote");
        }
        return state.getTerm("open-quote") + str + state.getTerm("close-quote");
    },
    "@quotes/inner": function (state: CslState, str?: string): string | false {
        if ("undefined" === typeof str) {
            return "\u2019";
        }
        return state.getTerm("open-inner-quote") + str + state.getTerm("close-inner-quote");
    },
    "@quotes/false": false,
    "@cite/entry": function (state: CslState, str: string): string {
        return state.sys.wrapCitationEntry(str, this.item_id, this.locator_txt, this.suffix_txt);
    },
    "@bibliography/entry": function (state: CslState, str: string): string {
        let indent = "";
        if (state.bibliography && state.bibliography.opt && state.bibliography.opt.hangingindent) {
            const hi = state.bibliography.opt.hangingindent;
            indent = " start-indent=\"" + hi + "em\" text-indent=\"-" + hi + "em\"";
        }
        let insert = "";
        if (state.sys.embedBibliographyEntry) {
            insert = state.sys.embedBibliographyEntry(this.item_id) + "\n";
        }
        return "<fo:block id=\"" + this.system_id + "\"" + indent + ">" + str + "</fo:block>\n" + insert;
    },
    "@display/block": function (state: CslState, str: string): string {
        return "\n  <fo:block>" + str + "</fo:block>\n";
    },
    "@display/left-margin": function (state: CslState, str: string): string {
        return "\n  <fo:table table-layout=\"fixed\" width=\"100%\">\n    " +
            "<fo:table-column column-number=\"1\" column-width=\"$$$__COLUMN_WIDTH_1__$$$\"/>\n    " +
            "<fo:table-column column-number=\"2\" column-width=\"proportional-column-width(1)\"/>\n    " +
            "<fo:table-body>\n      " +
            "<fo:table-row>\n        " +
            "<fo:table-cell>\n          " +
            "<fo:block>" + str + "</fo:block>\n        " +
            "</fo:table-cell>\n        ";
    },
    "@display/right-inline": function (state: CslState, str: string): string {
        return "<fo:table-cell>\n          " +
            "<fo:block>" + str + "</fo:block>\n        " +
            "</fo:table-cell>\n      " +
            "</fo:table-row>\n    " +
            "</fo:table-body>\n  " +
            "</fo:table>\n";
    },
    "@display/indent": function (state: CslState, str: string): string {
        return "<fo:block margin-left=\"2em\">" + str + "</fo:block>\n";
    },
    "@showid/true": function (state: CslState, str: string): string {
        if (!state.tmp.just_looking && !state.tmp.suppress_decorations && this.params && "string" === typeof str) {
            let prePunct = "";
            if (str) {
                const m = str.match(CSL.VARIABLE_WRAPPER_PREPUNCT_REX);
                prePunct = m[1];
                str = m[2];
            }
            let postPunct = "";
            if (str && SWAPPING_PUNCTUATION.indexOf(str.slice(-1)) > -1) {
                postPunct = str.slice(-1);
                str = str.slice(0, -1);
            }
            return state.sys.variableWrapper(this.params, prePunct, str, postPunct);
        } else {
            return str;
        }
    },
    "@URL/true": function (state: CslState, str: string): string {
        return "<fo:basic-link external-destination=\"url('" + str + "')\">" + str + "</fo:basic-link>";
    },
    "@DOI/true": function (state: CslState, str: string): string {
        let doiurl = str;
        if (!str.match(/^https?:\/\//)) {
            doiurl = "https://doi.org/" + str;
        }
        return "<fo:basic-link external-destination=\"url('" + doiurl + "')\">" + str + "</fo:basic-link>";
    }
};

/** LaTeX .bbl output. */
(OutputFormats.prototype as Record<string, any>).latex = {
    "text_escape": function (text?: string): string {
        if (!text) {
            text = "";
        }
        return text;
    },
    "bibstart": "\\begin{thebibliography}{4}",
    "bibend": "\\end{thebibliography}",
    "@font-style/italic": "{\\em %%STRING%%}",
    "@font-style/oblique": false,
    "@font-style/normal": false,
    "@font-variant/small-caps": false,
    "@passthrough/true": Output_formatters.passthrough,
    "@font-variant/normal": false,
    "@font-weight/bold": "{\\bf %%STRING%%}",
    "@font-weight/normal": false,
    "@font-weight/light": false,
    "@text-decoration/none": false,
    "@text-decoration/underline": false,
    "@vertical-align/baseline": false,
    "@vertical-align/sup": false,
    "@vertical-align/sub": false,
    "@strip-periods/true": Output_formatters.passthrough,
    "@strip-periods/false": Output_formatters.passthrough,
    "@quotes/true": function (state: CslState, str?: string): string | false {
        if ("undefined" === typeof str) {
            return state.getTerm("open-quote");
        }
        return state.getTerm("open-quote") + str + state.getTerm("close-quote");
    },
    "@quotes/inner": function (state: CslState, str?: string): string | false {
        if ("undefined" === typeof str) {
            return "\u2019";
        }
        return state.getTerm("open-inner-quote") + str + state.getTerm("close-inner-quote");
    },
    "@quotes/false": false,
    "@cite/entry": function (state: CslState, str: string): string {
        return state.sys.wrapCitationEntry(str, this.item_id, this.locator_txt, this.suffix_txt);
    },
    "@bibliography/entry": function (state: CslState, str: string): string {
        return "\\bibitem{" + state.sys.embedBibliographyEntry(this.item_id) + "}\n";
    },
    "@display/block": function (state: CslState, str: string): string {
        return "\n" + str;
    },
    "@display/left-margin": function (state: CslState, str: string): string {
        return str;
    },
    "@display/right-inline": function (state: CslState, str: string): string {
        return str;
    },
    "@display/indent": function (state: CslState, str: string): string {
        return "\n    " + str;
    },
    "@showid/true": function (state: CslState, str: string, cslid?: any): string {
        return str;
    },
    "@URL/true": function (state: CslState, str: string): string {
        return str;
    },
    "@DOI/true": function (state: CslState, str: string): string {
        return str;
    }
};

export const Output_formats = new OutputFormats();
