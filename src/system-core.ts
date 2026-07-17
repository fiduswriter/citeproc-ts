import { XmlJSON } from './xml/xmljson';

import { error } from './logger';
export function setupXml(xmlObject: string | any): any {
    let dataObj: any = {};
    let parser: any = null;
    if ("undefined" !== typeof xmlObject) {
        if ("string" === typeof xmlObject) {
            xmlObject = xmlObject.replace("^\uFEFF", "")
                .replace(/^\s+/, "");
            if (xmlObject.slice(0, 1) === "<") {
                error("citeproc-ts core: XML string parsing not available in the core bundle. Use the full citeproc-ts package or provide a pre-parsed JSON object/string.");
                return new XmlJSON({} as any);
            } else {
                dataObj = JSON.parse(xmlObject);
            }
            parser = new XmlJSON(dataObj);
        } else if ("undefined" !== typeof xmlObject.getAttribute) {
            error("citeproc-ts core: DOM parsing not available in the core bundle. Use the full citeproc-ts package or provide a pre-parsed JSON object.");
            return new XmlJSON({} as any);
        } else {
            parser = new XmlJSON(xmlObject);
        }
    } else {
        error("unable to parse XML input");
    }
    if (!parser) {
        error("citeproc-js error: unable to parse CSL style or locale object");
    }
    return parser;
};
