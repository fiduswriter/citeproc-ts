import { CSL } from '../csl';

export function setOutputFormat(this: any, mode: string): void {
    this.opt.mode = mode;
    this.fun.decorate = CSL.Mode(mode);
    if (!this.output[mode]) {
        this.output[mode] = {};
        this.output[mode].tmp = {};
    }
}

export function getSortFunc(this: any): (a: string, b: string) => number {
    return function (a: any, b: any) {
        a = a.split("-");
        b = b.split("-");
        if (a.length < b.length) {
            return 1;
        } else if (a.length > b.length) {
            return -1;
        } else {
            a = a.slice(-1)[0];
            b = b.slice(-1)[0];
            if (a.length < b.length) {
                return 1;
            } else if (a.length > b.length) {
                return -1;
            } else {
                return 0;
            }
        }
    };
}

export function setLangTagsForCslSort(this: any, tags: string[]): void {
    let i, ilen;
    if (tags) {
        this.opt['locale-sort'] = [];
        for (let i = 0, ilen = tags.length; i < ilen; i += 1) {
            this.opt['locale-sort'].push(tags[i]);
        }
    }
    this.opt['locale-sort'].sort(this.getSortFunc());
}
    
export function setLangTagsForCslTransliteration(this: any, tags: string[]): void {
    let i, ilen;
    this.opt['locale-translit'] = [];
    if (tags) {
        for (let i = 0, ilen = tags.length; i < ilen; i += 1) {
            this.opt['locale-translit'].push(tags[i]);
        }
    }
    this.opt['locale-translit'].sort(this.getSortFunc());
}
    
export function setLangTagsForCslTranslation(this: any, tags: string[]): void {
    let i, ilen;
    this.opt['locale-translat'] = [];
    if (tags) {
        for (let i = 0, ilen = tags.length; i < ilen; i += 1) {
            this.opt['locale-translat'].push(tags[i]);
        }
    }
    this.opt['locale-translat'].sort(this.getSortFunc());
}

export function setLangPrefsForCites(this: any, obj: Record<string, any>, conv?: (key: string) => string): void {
    const opt = this.opt['cite-lang-prefs'];
    if (!conv) {
        conv = function (key) {
            return key.toLowerCase();
        };
    }
    const segments = ['Persons', 'Institutions', 'Titles', 'Journals', 'Publishers', 'Places'];
    for (let i = 0, ilen = segments.length; i < ilen; i += 1) {
        const clientSegment = conv(segments[i]);
        const citeprocSegment = segments[i].toLowerCase();
        if (!obj[clientSegment]) {
            continue;
        }
        const supplements = [];
        while (obj[clientSegment].length > 1) {
            supplements.push(obj[clientSegment].pop());
        }
        const sortval = {orig:1,translit:2,translat:3};
        if (supplements.length === 2 && sortval[supplements[0]] < sortval[supplements[1]]) {
            supplements.reverse();
        }
        while (supplements.length) {
            obj[clientSegment].push(supplements.pop());
        }
        const lst = opt[citeprocSegment];
        while (lst.length) {
            lst.pop();
        }
        for (let j = 0, jlen = obj[clientSegment].length; j < jlen; j += 1) {
            lst.push(obj[clientSegment][j]);
        }
    }
}

export function setLangPrefsForCiteAffixes(this: any, affixList: any): void {
    if (affixList && affixList.length === 48) {
        const affixes = this.opt.citeAffixes;
        let count = 0;
        const settings = ["persons", "institutions", "titles", "journals", "publishers", "places"];
        const forms = ["translit", "orig", "translit", "translat"];
        let value;
        for (let i = 0, ilen = settings.length; i < ilen; i += 1) {
            for (let j = 0, jlen = forms.length; j < jlen; j += 1) {
                value = "";
                if ((count % 8) === 4) {
                    if (!affixes[settings[i]]["locale-"+forms[j]].prefix
                        && !affixes[settings[i]]["locale-"+forms[j]].suffix) {

                        value = affixList[count] ? affixList[count] : "";
                        affixes[settings[i]]["locale-" + forms[j]].prefix = value;
                        value = affixList[count] ? affixList[count + 1] : "";
                        affixes[settings[i]]["locale-" + forms[j]].suffix = value;
                    }
                } else {
                    value = affixList[count] ? affixList[count] : "";
                    affixes[settings[i]]["locale-" + forms[j]].prefix = value;
                    value = affixList[count] ? affixList[count + 1] : "";
                    affixes[settings[i]]["locale-" + forms[j]].suffix = value;
                }
                count += 2;
            }
        }
        this.opt.citeAffixes = affixes;
    }
}

export function setAutoVietnameseNamesOption(this: any, arg: any): void {
    if (arg) {
        this.opt["auto-vietnamese-names"] = true;
    } else {
        this.opt["auto-vietnamese-names"] = false;
    }
}

export function setAbbreviations(this: any, arg: any): void {
    if (this.sys.setAbbreviations) {
        this.sys.setAbbreviations(arg);
    }
}

export function setSuppressTrailingPunctuation(this: any, arg: any): void {
    this.citation.opt.suppressTrailingPunctuation = !!arg;
}
