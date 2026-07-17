import { TITLE_SPLIT_REGEXP } from '../constants/regex';

export function TITLE_FIELD_SPLITS(seg: string): Record<string, string> {
    const keys = ["title", "short", "main", "sub", "subjoin"];
    let ret: Record<string, string> = {};
    for (let i=0,ilen=keys.length;i<ilen;i++) {
        ret[keys[i]] = seg + "title" + (keys[i] === "title" ? "" : "-" + keys[i]);
    }
    return ret;
}

export function TITLE_SPLIT(str: string): string[] {
    if (!str) {
        return [];
    }
    let m = str.match(TITLE_SPLIT_REGEXP.match) as string[];
    let lst = str.split(TITLE_SPLIT_REGEXP.split);
    for (let i=lst.length-2; i>-1; i--) {
        lst[i] = lst[i].trim();
        if (lst[i] && lst[i].slice(-1).toLowerCase() !== lst[i].slice(-1)) {
            lst[i] = lst[i] + m[i] + lst[i+1];
            lst = lst.slice(0, i+1).concat(lst.slice(i+2))
        } else {
            lst = lst.slice(0, i+1).concat([m[i]]).concat(lst.slice(i+1))
        }
    }
    return lst;
}

export function demoteNoiseWords(state: any, fld: string, drop_or_demote: string): string {
    const SKIP_WORDS = state.locale[state.opt.lang].opts["leading-noise-words"];
    if (fld && drop_or_demote) {
        const parts = fld.split(/\s+/);
        parts.reverse();
        const toEnd: string[] = [];
        for (let j = parts.length - 1; j > -1; j += -1) {
            if (SKIP_WORDS.indexOf(parts[j].toLowerCase()) > -1) {
                toEnd.push(parts.pop() as string);
            } else {
                break;
            }
        }
        parts.reverse();
        const start = parts.join(" ");
        const end = toEnd.join(" ");
        if ("drop" === drop_or_demote || !end) {
            fld = start;
        } else if ("demote" === drop_or_demote) {
            fld = [start, end].join(", ");
        }
    }
    return fld;
}

export function extractTitleAndSubtitle(state: any, Item: any, narrowSpaceLocale: boolean): void {
    const narrowSpace = narrowSpaceLocale ? "\u202f" : "";
    const segments = [""];
    if (state.opt.development_extensions.split_container_title) {
        segments.push("container-");
    }
    for (let i=0,ilen=segments.length;i<ilen;i++) {
        const seg = segments[i];
        const title = TITLE_FIELD_SPLITS(seg);
        const langs: any[] = [false];
        if (Item.multi) {
            for (let lang in Item.multi._keys[title.short]) {
                langs.push(lang);
            }
        }
        for (let j=0,jlen=langs.length;j<jlen;j++) {
            const lang = langs[j];
            const vals: Record<string, any> = {};
            if (lang) {
                if (Item.multi._keys[title.title]) {
                    vals[title.title] = Item.multi._keys[title.title][lang];
                }
                if (Item.multi._keys[title["short"]]) {
                    vals[title["short"]] = Item.multi._keys[title["short"]][lang];
                }
            } else {
                vals[title.title] = Item[title.title];
                vals[title["short"]] = Item[title["short"]];
            }
            vals[title.main] = vals[title.title];
            vals[title.sub] = false;
            const shortTitle = vals[title["short"]];
            if (vals[title.title]) {
                if (shortTitle && shortTitle.toLowerCase() === vals[title.title].toLowerCase()) {
                    vals[title.main] = vals[title.title];
                    vals[title.subjoin] = "";
                    vals[title.sub] = "";
                } else if (shortTitle) {
                    const tail = vals[title.title].slice(shortTitle.replace(/[\?\!]+$/, "").length);
                    const top = vals[title.title].replace(tail.replace(/^[\?\!]+/, ""), "").trim();
                    let m = TITLE_SPLIT_REGEXP.matchfirst.exec(tail);
                    if (m && top.toLowerCase() === shortTitle.toLowerCase()) {
                        vals[title.main] = top;
                        vals[title.subjoin] = m[1].replace(/[\?\!]+(\s*)$/, "$1");
                        vals[title.sub] = tail.replace(TITLE_SPLIT_REGEXP.matchfirst, "");
                        if (state.opt.development_extensions.force_short_title_casing_alignment) {
                            vals[title["short"]] = vals[title.main];
                        }
                    } else {
                        const splitTitle = TITLE_SPLIT(vals[title.title]);
                        if (splitTitle.length == 3) {
                            vals[title.main] = splitTitle[0];
                            vals[title.subjoin] = splitTitle[1];
                            vals[title.sub] = splitTitle[2];
                        } else {
                            vals[title.main] = vals[title.title];
                            vals[title.subjoin] = "";
                            vals[title.sub] = "";
                        }
                    }
                } else {
                    const splitTitle = TITLE_SPLIT(vals[title.title]);
                    if (splitTitle.length == 3) {
                        vals[title.main] = splitTitle[0];
                        vals[title.subjoin] = splitTitle[1];
                        vals[title.sub] = splitTitle[2];
                        if (state.opt.development_extensions.implicit_short_title && Item.type !== "legal_case") {
                            if (!Item[title.short] && !vals[title.main].match(/^[\-\.[0-9]+$/)) {
                                let punct = vals[title.subjoin].trim();
                                if (["?", "!"].indexOf(punct) === -1) {
                                    punct = "";
                                }
                                vals[title.short] = vals[title.main] + punct;
                            }
                        }
                    } else {
                        vals[title.main] = vals[title.title];
                        vals[title.subjoin] = "";
                        vals[title.sub] = "";
                    }
                }
                if (vals[title.subjoin]) {
                    if (vals[title.subjoin].match(/([\?\!])/)) {
                        let m = vals[title.subjoin].match(/(\s*)$/)
                        vals[title.main] = vals[title.main] + narrowSpace +vals[title.subjoin].trim();
                        vals[title.subjoin] = m[1];
                    }
                }
            }
            if (vals[title.subjoin]) {
                if (vals[title.subjoin].indexOf(":") > -1) {
                    vals[title.subjoin] = narrowSpace + ": ";
                }
                if (vals[title.subjoin].indexOf("-") > -1 || vals[title.subjoin].indexOf("—") > -1) {
                    vals[title.subjoin] = "—";
                }
            }
            if (lang) {
                for (let key in vals) {
                    if (!Item.multi._keys[key]) {
                        Item.multi._keys[key] = {};
                    }
                    Item.multi._keys[key][lang] = vals[key];
                }
            } else {
                for (let key in vals) {
                    Item[key] = vals[key];
                }
            }
        }
    }
}

export function titlecaseSentenceOrNormal(state: any, Item: any, seg: string, lang: string | false, sentenceCase: boolean, formatters?: Record<string, Function>): string {
    const title = TITLE_FIELD_SPLITS(seg);
    const vals: Record<string, any> = {};
    if (lang && Item.multi) {
        if (Item.multi._keys[title.title]) {
            vals[title.title] = Item.multi._keys[title.title][lang];
        }
        if (Item.multi._keys[title.main]) {
            vals[title.main] = Item.multi._keys[title.main][lang];
        }
        if (Item.multi._keys[title.sub]) {
            vals[title.sub] = Item.multi._keys[title.sub][lang];
        }
        if (Item.multi._keys[title.subjoin]) {
            vals[title.subjoin] = Item.multi._keys[title.subjoin][lang];
        }
    } else {
        vals[title.title] = Item[title.title];
        vals[title.main] = Item[title.main];
        vals[title.sub] = Item[title.sub];
        vals[title.subjoin] = Item[title.subjoin];
    }
    const fmt = formatters || (typeof CSL !== 'undefined' ? (CSL as any).Output?.Formatters : undefined);
    if (vals[title.main] && vals[title.sub]) {
        let mainTitle = vals[title.main];
        const subJoin = vals[title.subjoin];
        let subTitle = vals[title.sub];
        if (sentenceCase && fmt) {
            mainTitle = fmt.sentence(state, mainTitle);
            subTitle = fmt.sentence(state, subTitle);
        } else if (!sentenceCase && state.opt.development_extensions.uppercase_subtitles && fmt) {
            subTitle = fmt["capitalize-first"](state, subTitle);
        }
        return [mainTitle, subJoin, subTitle].join("");
    } else if (vals[title.title]) {
        if (sentenceCase && fmt) {
            return fmt.sentence(state, vals[title.title]);
        } else if (!sentenceCase && state.opt.development_extensions.uppercase_subtitles && fmt) {
            const splits = TITLE_SPLIT(vals[title.title]) as string[];
            for (let i=0,ilen=splits.length; i<ilen; i += 2) {
                splits[i] = fmt["capitalize-first"](state, splits[i]);
            }
            for (let i=1, ilen=splits.length-1; i < ilen; i += 2) {
                let m = splits[i].match(/([:\?\!] )/);
                if (m) {
                    const narrowSpace = state.opt["default-locale"][0].slice(0, 2).toLowerCase() === "fr" ? "\u202f" : "";
                    splits[i] = narrowSpace + m[1];
                }
                if (splits[i].indexOf("-") > -1 || splits[i].indexOf("—") > -1) {
                    splits[i] = "—";
                }
            }
            vals[title.title] = splits.join("");
            return vals[title.title];
        } else {
            return vals[title.title];
        }
    } else {
        return "";
    }
}
