import path from "path";
import { options } from "./options.js";

export function styleCapabilities(txt: string) {
    const styleCap: Record<string, any> = {
        styleID: null,
        styleName: null,
        bibliography: false,
        jurisdictionPreference: [] as string[],
        defaultLocale: "en",
        log: []
    };
    let start = txt.indexOf("<id>");
    let end = txt.indexOf("</id>");
    if (start === -1 || end === -1) {
        throw new Error("File \"" + options.watch[0] + "\" does not contain a CSL style ID");
    }
    styleCap.styleID = txt.slice(start + 4, end);
    styleCap.styleName = path.basename(styleCap.styleID);
    start = txt.indexOf("<bibliography");
    end = txt.indexOf("</bibliography>");
    if (start > -1 && end > -1) {
        styleCap.bibliography = true;
    }
    let ibid = txt.indexOf("position=\"ibid");
    if (ibid === -1) {
        ibid = txt.indexOf("position=\'ibid");
    }
    if (ibid > -1) {
        styleCap.ibid = true;
    }
    let position = txt.indexOf("position=");
    if (position > -1) {
        styleCap.position = true;
    }
    let backref = txt.indexOf("first-reference-note-number");
    if (backref > -1) {
        styleCap.backref = true;
    }
    let jprefStart = txt.indexOf("jurisdiction-preference");
    if (jprefStart > -1) {
        let jprefOpenQuote = txt.slice(jprefStart+1).indexOf("\"")+1;
        let jprefCloseQuote = txt.slice(jprefStart+jprefOpenQuote+1).indexOf("\"")+1;
        let jprefsRaw = txt.slice(jprefStart+jprefOpenQuote+1, jprefStart+jprefOpenQuote+jprefCloseQuote);
        let jprefs = jprefsRaw.split(/\s+/);
        styleCap.jurisdictionPreference = jprefs;
    }
    let localePrefStart = txt.indexOf("default-locale");
    if (localePrefStart > -1) {
        let localePrefOpenQuote = txt.slice(localePrefStart+1).indexOf("\"")+1;
        let localePrefCloseQuote = txt.slice(localePrefStart+localePrefOpenQuote+1).indexOf("\"")+1;
        let localePref = txt.slice(localePrefStart+localePrefOpenQuote+1, localePrefStart+localePrefOpenQuote+localePrefCloseQuote);
        styleCap.defaultLocale = localePref;
    }
    return styleCap;
}
