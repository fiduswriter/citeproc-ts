import { CSL } from '../csl';
/*global CSL: true */

CSL.Output.Formatters = (function () {
    const rexStr = "(?:\u2018|\u2019|\u201C|\u201D| \"| \'|\"|\'|[-\u2010\u2013\u2014\/.,;?!:]|\\[|\\]|\\(|\\)|<span style=\"font-variant: small-caps;\">|<span class=\"no(?:case|decor)\">|<\/span>|<\/?(?:i|sc|b|sub|sup)>)";
    const tagDoppel: any = new CSL.Doppeler(rexStr, function (str: string) {
        return str.replace(/(<span)\s+(class=\"no(?:case|decor)\")[^>]*(>)/g, "$1 $2$3").replace(/(<span)\s+(style=\"font-variant:)\s*(small-caps);?(\")[^>]*(>)/g, "$1 $2 $3;$4$5");
    });
    const rexNameStr = "(?:[-\\s]*<\\/*(?:span\s+class=\"no(?:case|decor)\"|i|sc|b|sub|sup)>[-\\s]*|[-\\s]+)";
    const nameDoppel: any = new CSL.Doppeler(rexNameStr);

    const wordDoppel: any = new CSL.Doppeler("(?:[\u00A0\u0020\u00A0\u2000-\u200B\u205F\u3000]+)");

    const _tagParams: { [tag: string]: string } = {
        "<span style=\"font-variant: small-caps;\">": "</span>",
        "<span class=\"nocase\">": "</span>",
        "<span class=\"nodecor\">": "</span>",
        "<sc>": "</sc>",
        "<sub>": "</sub>",
        "<sup>": "</sup>"
    };

    function _capitalise(word: string): string {
        const m = word.match(/(^\s*)((?:[\0-\t\x0B\f\x0E-\u2027\u202A-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]))(.*)/);
        // Do not uppercase lone Greek letters
        if (m && !(m[2].match(/^[\u0370-\u03FF]$/) && !m[3])) {
            return m[1] + CSL.toLocaleUpperCase.call(this, m[2]) + m[3];
        }
        return word;
    }

    function _textcaseEngine(config: TextCaseConfig, string: string): string {
        if (!string) {
            return "";
        }
        config.doppel = tagDoppel.split(string);
        const quoteParams: { [tag: string]: { opener: string; closer: string } } = {
            " \"": { opener: " \'", closer: "\"" },
            " \'": { opener: " \"", closer: "\'" },
            "\u2018": { opener: "\u2018", closer: "\u2019" },
            "\u201C": { opener: "\u201C", closer: "\u201D" }
        };
        function tryOpen(tag: string, pos: number): boolean | number {
            if (config.quoteState.length === 0 || tag === config.quoteState[config.quoteState.length - 1].opener) {
                config.quoteState.push({
                    opener: quoteParams[tag].opener,
                    closer: quoteParams[tag].closer,
                    pos: pos
                });
                return false;
            } else {
                const prevPos = config.quoteState[config.quoteState.length - 1].pos;
                config.quoteState.pop();
                config.quoteState.push({
                    opener: quoteParams[tag].opener,
                    closer: quoteParams[tag].closer,
                    positions: pos
                });
                return prevPos;
            }
        }
        function tryClose(tag: string, pos: number): number | undefined {
            if (config.quoteState.length > 0 && tag === config.quoteState[config.quoteState.length - 1].closer) {
                config.quoteState.pop();
            } else {
                return pos;
            }
            return undefined;
        }
        function pushQuoteState(tag: string, pos: number): any {
            const isOpener = ["\u201C", "\u2018", " \"", " \'"].indexOf(tag) > -1;
            if (isOpener) {
                return tryOpen(tag, pos);
            } else {
                return tryClose(tag, pos);
            }
        }
        function quoteFix(tag: string, positions: number): any {
            const m = tag.match(/(^(?:\u2018|\u2019|\u201C|\u201D|\"|\')|(?: \"| \')$)/);
            if (m) {
                return pushQuoteState(m[1], positions);
            }
            return undefined;
        }
        // Run state machine
        if (config.doppel.strings.length && config.doppel.strings[0].trim()) {
            config.doppel.strings[0] = config.capitaliseWords(config.doppel.strings[0], 0, config.doppel.tags[0]);
        }

        for (let i = 0, ilen = config.doppel.tags.length; i < ilen; i += 1) {
            const tag = config.doppel.tags[i];
            const str = config.doppel.strings[i + 1];

            if (config.tagState !== null) {
                if (_tagParams[tag]) {
                    config.tagState.push(_tagParams[tag]);
                } else if (config.tagState.length && tag === config.tagState[config.tagState.length - 1]) {
                    config.tagState.pop();
                }
            }

            if (config.afterPunct !== null) {
                if (tag.match(/[\!\?\:]$/)) {
                    config.afterPunct = true;
                }
            }

            if (config.tagState.length === 0) {
                config.doppel.strings[i + 1] = config.capitaliseWords(str, i + 1, config.doppel, config.doppel.tags[i + 1]);
            } else if (config.doppel.strings[i + 1].trim()) {
                config.lastWordPos = null;
            }

            if (config.quoteState !== null) {
                const quotePos = quoteFix(tag, i);
                if (quotePos || quotePos === 0) {
                    const origChar = config.doppel.origStrings[quotePos + 1].slice(0, 1);
                    config.doppel.strings[quotePos + 1] = origChar + config.doppel.strings[quotePos + 1].slice(1);
                    config.lastWordPos = null;
                }
            }

            if (config.isFirst) {
                if (str.trim()) {
                    config.isFirst = false;
                }
            }
            if (config.afterPunct) {
                if (str.trim()) {
                    config.afterPunct = false;
                }
            }
        }
        if (config.quoteState) {
            for (let i = 0, ilen = config.quoteState.length; i < ilen; i += 1) {
                const quotePos = config.quoteState[i].pos;
                if (typeof quotePos !== "undefined") {
                    const origChar = config.doppel.origStrings[quotePos + 1].slice(0, 1);
                    config.doppel.strings[quotePos + 1] = origChar + config.doppel.strings[quotePos + 1].slice(1);
                }
            }
        }
        if (config.lastWordPos) {
            const lastWords = wordDoppel.split(config.doppel.strings[config.lastWordPos.strings]);
            let lastWord = lastWords.strings[config.lastWordPos.words];
            if (lastWord.length > 1 && CSL.toLocaleLowerCase.call(this, lastWord).match(config.skipWordsRex)) {
                lastWord = _capitalise.call(this, lastWord);
                lastWords.strings[config.lastWordPos.words] = lastWord;
            }
            config.doppel.strings[config.lastWordPos.strings] = wordDoppel.join(lastWords);
        }

        return tagDoppel.join(config.doppel);
    }

    /** A noop that just delivers the string. */
    function passthrough(state: CslState, str: string): string {
        return str;
    }

    /** Force all letters in the string to lowercase, skipping nocase spans */
    function lowercase(state: CslState, string: string): string {
        const config: TextCaseConfig = {
            quoteState: null,
            capitaliseWords: function (str: string): string {
                const words = str.split(" ");
                for (let i = 0, ilen = words.length; i < ilen; i += 1) {
                    const word = words[i];
                    if (word) {
                        words[i] = CSL.toLocaleLowerCase.call(state, word);
                    }
                }
                return words.join(" ");
            },
            skipWordsRex: null,
            tagState: [],
            afterPunct: null,
            isFirst: null
        };
        return _textcaseEngine.call(state, config, string);
    }

    /** Force all letters in the string to uppercase. */
    function uppercase(state: CslState, string: string): string {
        const config: TextCaseConfig = {
            quoteState: null,
            capitaliseWords: function (str: string): string {
                const words = str.split(" ");
                for (let i = 0, ilen = words.length; i < ilen; i += 1) {
                    const word = words[i];
                    if (word) {
                        words[i] = CSL.toLocaleUpperCase.call(state, word);
                    }
                }
                return words.join(" ");
            },
            skipWordsRex: null,
            tagState: [],
            afterPunct: null,
            isFirst: null
        };
        return _textcaseEngine.call(state, config, string);
    }

    /** Similar to capitalize_first, but force the subsequent characters to lowercase. */
    function sentence(state: CslState, string: string): string {
        const config: TextCaseConfig = {
            quoteState: [],
            capitaliseWords: function (str: string): string {
                const words = str.split(" ");
                for (let i = 0, ilen = words.length; i < ilen; i += 1) {
                    const word = words[i];
                    if (word) {
                        if (config.isFirst) {
                            words[i] = _capitalise.call(state, word);
                            config.isFirst = false;
                        } else {
                            words[i] = CSL.toLocaleLowerCase.call(state, word);
                        }
                    }
                }
                return words.join(" ");
            },
            skipWordsRex: null,
            tagState: [],
            afterPunct: null,
            isFirst: true
        };
        return _textcaseEngine.call(state, config, string);
    }

    function title(state: CslState, string: string): string {
        const config: TextCaseConfig = {
            quoteState: [],
            capitaliseWords: function (str: string, i: number, followingTag?: any): string {
                if (str.trim()) {
                    const wordle = wordDoppel.split(str);
                    const words = wordle.strings;
                    for (let j = 0, jlen = words.length; j < jlen; j += 1) {
                        const word = words[j];
                        if (!word) {
                            continue;
                        }
                        const lcase = CSL.toLocaleLowerCase.call(state, word);
                        let capitalize = false;
                        if (word.length > 1 && !lcase.match(config.skipWordsRex)) {
                            capitalize = true;
                        } else if (j === (words.length - 1) && followingTag === "-") {
                            capitalize = true;
                        } else if (config.isFirst) {
                            capitalize = true;
                        } else if (config.afterPunct) {
                            capitalize = true;
                        }
                        if (capitalize && word === lcase) {
                            words[j] = _capitalise.call(state, word);
                        }
                        config.afterPunct = false;
                        config.isFirst = false;
                        config.lastWordPos = {
                            strings: i,
                            words: j
                        };
                    }
                    str = wordDoppel.join(wordle);
                }
                return str;
            },
            skipWordsRex: state.locale[state.opt.lang].opts["skip-words-regexp"],
            tagState: [],
            afterPunct: false,
            isFirst: true
        };
        return _textcaseEngine.call(state, config, string);
    }

    /** Force capitalization of the first letter in the string, leave the rest untouched. */
    function capitalizeFirst(state: CslState, string: string): string {
        const config: TextCaseConfig = {
            quoteState: [],
            capitaliseWords: function (str: string): string {
                const wordle = wordDoppel.split(str);
                const words = wordle.strings;
                for (let i = 0, ilen = words.length; i < ilen; i += 1) {
                    const word = words[i];
                    if (word) {
                        if (config.isFirst) {
                            if (word === CSL.toLocaleLowerCase.call(state, word)) {
                                words[i] = _capitalise.call(state, word);
                            }
                            config.isFirst = false;
                            break;
                        }
                    }
                }
                return wordDoppel.join(wordle);
            },
            skipWordsRex: null,
            tagState: [],
            afterPunct: null,
            isFirst: true
        };
        return _textcaseEngine.call(state, config, string);
    }

    /** Force the first letter of each space-delimited word to uppercase. */
    function capitalizeAll(state: CslState, string: string): string {
        const config: TextCaseConfig = {
            quoteState: [],
            capitaliseWords: function (str: string): string {
                const wordle = wordDoppel.split(str);
                const words = wordle.strings;
                for (let i = 0, ilen = words.length; i < ilen; i += 1) {
                    const word = words[i];
                    if (word) {
                        if (word === CSL.toLocaleLowerCase.call(state, word)) {
                            words[i] = _capitalise.call(state, word);
                        }
                    }
                }
                return wordDoppel.join(wordle);
            },
            skipWordsRex: null,
            tagState: [],
            afterPunct: null,
            isFirst: null
        };
        return _textcaseEngine.call(state, config, string);
    }

    return {
        nameDoppel: nameDoppel,
        passthrough: passthrough,
        lowercase: lowercase,
        uppercase: uppercase,
        sentence: sentence,
        title: title,
        "capitalize-first": capitalizeFirst,
        "capitalize-all": capitalizeAll
    };
}());
