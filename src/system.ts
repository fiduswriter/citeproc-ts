import { CSL } from './csl';

import { error } from './logger';
export function setupXml(xmlObject: any): any {
    let dataObj: any = {};
    let parser: any = null;
    if ("undefined" !== typeof xmlObject) {
        if ("string" === typeof xmlObject) {
            xmlObject = xmlObject.replace("^\uFEFF", "")
                .replace(/^\s+/, "");
            if (xmlObject.slice(0, 1) === "<") {
                // Assume serialized XML
                dataObj = CSL.parseXml(xmlObject);
            } else {
                // Assume serialized JSON
                dataObj = JSON.parse(xmlObject);
            }
            parser = new CSL.XmlJSON(dataObj);
        } else if ("undefined" !== typeof xmlObject.getAttribute) {
            // Assume DOM instance
            parser = new CSL.XmlDOM(xmlObject);
        } else {
            // Assume JS object
            parser = new CSL.XmlJSON(xmlObject);
        }
    } else {
        error("unable to parse XML input");
    }
    if (!parser) {
        error("citeproc-js error: unable to parse CSL style or locale object");
    }
    return parser;
};
