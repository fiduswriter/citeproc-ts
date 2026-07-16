/*global CSL: true */

export const Util_Dates: {
    year: Record<string, (state: CslState, num: number | string | boolean, end?: boolean) => string>;
    month: Record<string, (state: CslState, num: number | string, gender?: string | boolean, forceDefaultLocale?: boolean) => string | number>;
    day: Record<string, (state: CslState, num: number | string, gender?: string) => string>;
    normalizeMonth: (num: number | string, useSeason?: boolean) => any;
} = {} as any;

Util_Dates.year = {};

Util_Dates.year["long"] = function (state: CslState, num: number | string | boolean): string {
    if (!num) {
        if ("boolean" === typeof num) {
            num = "";
        } else {
            num = 0;
        }
    }
    return num.toString();
};

Util_Dates.year.imperial = function (state: CslState, num: number | string | boolean, end?: boolean): string {
    let year = "";
    if (!num) {
        if ("boolean" === typeof num) {
            num = "";
        } else {
            num = 0;
        }
    }
    const endSuffix = end ? "_end" : "";
    let month = state.tmp.date_object["month" + endSuffix];
    month = month ? "" + month : "1";
    while (month.length < 2) {
        month = "0" + month;
    }
    let day = state.tmp.date_object["day" + endSuffix];
    day = day ? "" + day : "1";
    while (day.length < 2) {
        day = "0" + day;
    }
    const date = parseInt(num + month + day, 10);
    let label: string;
    let offset: number;
    if (date >= 18680908 && date < 19120730) {
        label = "\u660e\u6cbb";
        offset = 1867;
    } else if (date >= 19120730 && date < 19261225) {
        label = "\u5927\u6b63";
        offset = 1911;
    } else if (date >= 19261225 && date < 19890108) {
        label = "\u662d\u548c";
        offset = 1925;
    } else if (date >= 19890108) {
        label = "\u5e73\u6210";
        offset = 1988;
    }
    if (label && offset) {
        let normalizedKey = label;
        if (state.sys.normalizeAbbrevsKey) {
            normalizedKey = state.sys.normalizeAbbrevsKey("number", label);
        }
        if (!state.transform.abbrevs["default"]["number"][normalizedKey]) {
            state.transform.loadAbbreviation("default", "number", normalizedKey, null);
        }
        if (state.transform.abbrevs["default"]["number"][normalizedKey]) {
            label = state.transform.abbrevs["default"]["number"][normalizedKey];
        }
        year = label + (Number(num) - offset);
    }
    return year;
};

Util_Dates.year["short"] = function (state: CslState, num: number | string): string {
    num = num.toString();
    if (num && num.length === 4) {
        return num.substr(2);
    }
    return num;
};

Util_Dates.year.numeric = function (state: CslState, num: number | string): string {
    let m: RegExpMatchArray | null, pre: string;
    num = "" + num;
    const m2 = num.match(/([0-9]*)$/);
    if (m2) {
        pre = num.slice(0, m2[1].length * -1);
        num = m2[1];
    } else {
        pre = num;
        num = "";
    }
    while (num.length < 4) {
        num = "0" + num;
    }
    return (pre + num);
};

Util_Dates.normalizeMonth = function (num: number | string, useSeason?: boolean): number | { stub: string; num: number } {
    let ret: number | { stub: string; num: number };
    if (!num) {
        num = 0;
    }
    const numStr = "" + num;
    if (!numStr.match(/^[0-9]+$/)) {
        num = 0;
    } else {
        num = parseInt(numStr, 10);
    }
    if (useSeason) {
        const res = { stub: "month-", num: num };
        if (res.num < 1 || res.num > 24) {
            res.num = 0;
        } else {
            while (res.num > 16) {
                res.num = res.num - 4;
            }
            if (res.num > 12) {
                res.stub = "season-";
                res.num = res.num - 12;
            }
        }
        ret = res;
    } else {
        if (num < 1 || num > 12) {
            num = 0;
        }
        ret = num;
    }
    return ret;
};

Util_Dates.month = {};

Util_Dates.month.numeric = function (state: CslState, num: number | string): number | string {
    let num2: number | string = Util_Dates.normalizeMonth(num) as number;
    if (!num2) {
        num2 = "";
    }
    return num2;
};

Util_Dates.month["numeric-leading-zeros"] = function (state: CslState, num: number | string): string {
    let num2: number | string = Util_Dates.normalizeMonth(num) as number;
    if (!num2) {
        num2 = "";
    } else {
        num2 = "" + num2;
        while ((num2 as string).length < 2) {
            num2 = "0" + num2;
        }
    }
    return num2 as string;
};

Util_Dates.month["long"] = function (state: CslState, num: number | string, gender?: string | boolean, forceDefaultLocale?: boolean): string {
    const res = Util_Dates.normalizeMonth(num, true) as { stub: string; num: number };
    let num2: number | string = res.num;
    if (!num2) {
        num2 = "";
    } else {
        num2 = "" + num2;
        while ((num2 as string).length < 2) {
            num2 = "0" + num2;
        }
        num2 = state.getTerm(res.stub + num2, "long", 0, 0, false, forceDefaultLocale);
    }
    return num2 as string;
};

Util_Dates.month["short"] = function (state: CslState, num: number | string, gender?: string | boolean, forceDefaultLocale?: boolean): string {
    const res = Util_Dates.normalizeMonth(num, true) as { stub: string; num: number };
    let num2: number | string = res.num;
    if (!num2) {
        num2 = "";
    } else {
        num2 = "" + num2;
        while ((num2 as string).length < 2) {
            num2 = "0" + num2;
        }
        num2 = state.getTerm(res.stub + num2, "short", 0, 0, false, forceDefaultLocale);
    }
    return num2 as string;
};

Util_Dates.day = {};

Util_Dates.day.numeric = function (state: CslState, num: number): string {
    return num.toString();
};

Util_Dates.day["long"] = Util_Dates.day.numeric;

Util_Dates.day["numeric-leading-zeros"] = function (state: CslState, num: number | string): string {
    if (!num) {
        num = 0;
    }
    num = num.toString();
    while (num.length < 2) {
        num = "0" + num;
    }
    return num.toString();
};

Util_Dates.day.ordinal = function (state: CslState, num: number, gender?: string): string {
    return state.fun.ordinalizer.format(num, gender);
};
