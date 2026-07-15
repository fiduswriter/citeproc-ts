import { CSL } from '../csl';
/*global CSL: true */

/**
 * Date mangling functions.
 * @namespace Date construction utilities
 */
CSL.Util.Dates = {};

/**
 * Year manglers
 * <p>short, long</p>
 */
CSL.Util.Dates.year = {};

/**
 * Convert year to long form
 * <p>This just passes the number back as a string.</p>
 */
CSL.Util.Dates.year["long"] = function (state: CslState, num: any): string {
    if (!num) {
        if ("boolean" === typeof num) {
            num = "";
        } else {
            num = 0;
        }
    }
    return num.toString();
};

/**
 * Crudely convert to Japanese Imperial form.
 * <p>Returns the result as a string.</p>
 */
CSL.Util.Dates.year.imperial = function (state: CslState, num: any, end?: any): string {
    var year = "";
    if (!num) {
        if ("boolean" === typeof num) {
            num = "";
        } else {
            num = 0;
        }
    }
    end = end ? "_end" : "";
    var month = state.tmp.date_object["month" + end];
    month = month ? "" + month : "1";
    while (month.length < 2) {
        month = "0" + month;
    }
    var day = state.tmp.date_object["day" + end];
    day = day ? "" + day : "1";
    while (day.length < 2) {
        day = "0" + day;
    }
    var date = parseInt(num + month + day, 10);
    var label: any;
    var offset: any;
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
        var normalizedKey = label;
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

/**
 * Convert year to short form
 * <p>Just crops any 4-digit year to the last two digits.</p>
 */
CSL.Util.Dates.year["short"] = function (state: CslState, num: any): string {
    num = num.toString();
    if (num && num.length === 4) {
        return num.substr(2);
    }
    return num;
};


/**
 * Convert year to short form
 * <p>Just crops any 4-digit year to the last two digits.</p>
 */
CSL.Util.Dates.year.numeric = function (state: CslState, num: any): string {
    let m: any, pre: any;
    num = "" + num;
    var m2 = num.match(/([0-9]*)$/);
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


/*
 * MONTH manglers
 * normalize
 * long, short, numeric, numeric-leading-zeros
 */
CSL.Util.Dates.normalizeMonth = function (num: any, useSeason?: any): any {
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
        var res = { stub: "month-", num: num };
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

CSL.Util.Dates.month = {};

/**
 * Convert month to numeric form
 * <p>This just passes the number back as a string.</p>
 */
CSL.Util.Dates.month.numeric = function (state: CslState, num: any): any {
    var num2 = CSL.Util.Dates.normalizeMonth(num);
    if (!num2) {
        num2 = "";
    }
    return num2;
};

/**
 * Convert month to numeric-leading-zeros form
 * <p>This just passes the number back as string padded with zeros.</p>
 */
CSL.Util.Dates.month["numeric-leading-zeros"] = function (state: CslState, num: any): any {
    var num2 = CSL.Util.Dates.normalizeMonth(num);
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

/**
 * Convert month to long form
 * <p>This passes back the month of the locale in long form.</p>
 */
CSL.Util.Dates.month["long"] = function (state: CslState, num: any, gender?: any, forceDefaultLocale?: any): any {
    var res = CSL.Util.Dates.normalizeMonth(num, true);
    var num2 = res.num;
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

/**
 * Convert month to long form
 * <p>This passes back the month of the locale in short form.</p>
 */
CSL.Util.Dates.month["short"] = function (state: CslState, num: any, gender?: any, forceDefaultLocale?: any): any {
    var res = CSL.Util.Dates.normalizeMonth(num, true);
    var num2 = res.num;
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

/*
 * DAY manglers
 * numeric, numeric-leading-zeros, ordinal
 */
CSL.Util.Dates.day = {};

/**
 * Convert day to numeric form
 * <p>This just passes the number back as a string.</p>
 */
CSL.Util.Dates.day.numeric = function (state: CslState, num: any): string {
    return num.toString();
};

CSL.Util.Dates.day["long"] = CSL.Util.Dates.day.numeric;

/**
 * Convert day to numeric-leading-zeros form
 * <p>This just passes the number back as a string padded with zeros.</p>
 */
CSL.Util.Dates.day["numeric-leading-zeros"] = function (state: CslState, num: any): string {
    if (!num) {
        num = 0;
    }
    num = num.toString();
    while (num.length < 2) {
        num = "0" + num;
    }
    return num.toString();
};

/**
 * Convert day to ordinal form
 */
CSL.Util.Dates.day.ordinal = function (state: CslState, num: any, gender?: any): string {
    return state.fun.ordinalizer.format(num, gender);
};
