/*global CSL: true */

export const Util_Dates: any = {};

Util_Dates.year = {};

Util_Dates.year["long"] = function (state: CslState, num: any): string {
    if (!num) {
        if ("boolean" === typeof num) {
            num = "";
        } else {
            num = 0;
        }
    }
    return num.toString();
};

Util_Dates.year.imperial = function (state: CslState, num: any, end?: any): string {
    let year = "";
    if (!num) {
        if ("boolean" === typeof num) {
            num = "";
        } else {
            num = 0;
        }
    }
    end = end ? "_end" : "";
    let month = state.tmp.date_object["month" + end];
    month = month ? "" + month : "1";
    while (month.length < 2) {
        month = "0" + month;
    }
    let day = state.tmp.date_object["day" + end];
    day = day ? "" + day : "1";
    while (day.length < 2) {
        day = "0" + day;
    }
    const date = parseInt(num + month + day, 10);
    let label: any;
    let offset: any;
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
        year = label + (num - offset);
    }
    return year;
};

Util_Dates.year["short"] = function (state: CslState, num: any): string {
    num = num.toString();
    if (num && num.length === 4) {
        return num.substr(2);
    }
    return num;
};

Util_Dates.year.numeric = function (state: CslState, num: any): string {
    let m: any, pre: any;
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

Util_Dates.normalizeMonth = function (num: any, useSeason?: any): any {
    let ret: any;
    if (!num) {
        num = 0;
    }
    num = "" + num;
    if (!num.match(/^[0-9]+$/)) {
        num = 0;
    }
    num = parseInt(num, 10);
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

Util_Dates.month.numeric = function (state: CslState, num: any): any {
    let num2 = Util_Dates.normalizeMonth(num);
    if (!num2) {
        num2 = "";
    }
    return num2;
};

Util_Dates.month["numeric-leading-zeros"] = function (state: CslState, num: any): any {
    let num2 = Util_Dates.normalizeMonth(num);
    if (!num2) {
        num2 = "";
    } else {
        num2 = "" + num2;
        while (num2.length < 2) {
            num2 = "0" + num2;
        }
    }
    return num2;
};

Util_Dates.month["long"] = function (state: CslState, num: any, gender?: any, forceDefaultLocale?: any): any {
    const res = Util_Dates.normalizeMonth(num, true);
    let num2 = res.num;
    if (!num2) {
        num2 = "";
    } else {
        num2 = "" + num2;
        while (num2.length < 2) {
            num2 = "0" + num2;
        }
        num2 = state.getTerm(res.stub + num2, "long", 0, 0, false, forceDefaultLocale);
    }
    return num2;
};

Util_Dates.month["short"] = function (state: CslState, num: any, gender?: any, forceDefaultLocale?: any): any {
    const res = Util_Dates.normalizeMonth(num, true);
    let num2 = res.num;
    if (!num2) {
        num2 = "";
    } else {
        num2 = "" + num2;
        while (num2.length < 2) {
            num2 = "0" + num2;
        }
        num2 = state.getTerm(res.stub + num2, "short", 0, 0, false, forceDefaultLocale);
    }
    return num2;
};

Util_Dates.day = {};

Util_Dates.day.numeric = function (state: CslState, num: any): string {
    return num.toString();
};

Util_Dates.day["long"] = Util_Dates.day.numeric;

Util_Dates.day["numeric-leading-zeros"] = function (state: CslState, num: any): string {
    if (!num) {
        num = 0;
    }
    num = num.toString();
    while (num.length < 2) {
        num = "0" + num;
    }
    return num.toString();
};

Util_Dates.day.ordinal = function (state: CslState, num: any, gender?: any): string {
    return state.fun.ordinalizer.format(num, gender);
};
