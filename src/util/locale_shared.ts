export function normalizeLocaleStr(str: string): string | undefined {
    if (!str) {
        return;
    }
    let lst = str.split('-');
    lst[0] = lst[0].toLowerCase();
    if (lst[1]) {
        lst[1] = lst[1].toUpperCase();
    }
    return lst.join("-");
}

export function toLocaleUpperCase(state: any, str: string): string {
    const arr = state.tmp.lang_array;
    try {
        str = str.toLocaleUpperCase(arr);
    } catch (e) {
        str = str.toUpperCase();
    }
    return str;
}

export function toLocaleLowerCase(state: any, str: string): string {
    const arr = state.tmp.lang_array;
    try {
        str = str.toLocaleLowerCase(arr);
    } catch (e) {
        str = str.toLowerCase();
    }
    return str;
}

export function getAbbrevsDomain(state: any, country: string, lang: string): string | null {
    let domain = null;
    if (state.opt.availableAbbrevDomains && country && country !== "default") {
        const globalDomainPreference = state.locale[state.opt.lang].opts["jurisdiction-preference"];
        let itemDomainPreference = null;
        if (state.locale[lang]) {
            itemDomainPreference = state.locale[lang].opts["jurisdiction-preference"];
        }
        if (itemDomainPreference) {
            for (let j=itemDomainPreference.length-1; j > -1; j--) {
                if (state.opt.availableAbbrevDomains[country].indexOf(itemDomainPreference[j]) > -1) {
                    domain = itemDomainPreference[j];
                    break;
                }
            }
        }
        if (!domain && globalDomainPreference) {
            for (let j=globalDomainPreference.length-1; j > -1; j--) {
                if (state.opt.availableAbbrevDomains[country].indexOf(globalDomainPreference[j]) > -1) {
                    domain = globalDomainPreference[j];
                    break;
                }
            }
        }
    }
    return domain;
}

export function AbbreviationSegments(this: any): void {
    this["container-title"] = {};
    this["collection-title"] = {};
    this["institution-entire"] = {};
    this["institution-part"] = {};
    this.nickname = {};
    this.number = {};
    this.title = {};
    this.place = {};
    this.hereinafter = {};
    this.classic = {};
    this["container-phrase"] = {};
    this["title-phrase"] = {};
}
