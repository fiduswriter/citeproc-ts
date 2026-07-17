import { XmlJSON, parseXml } from './xml/xmljson';
import { XmlDOM } from './xml/xmldom';

import { error } from './logger';
export function setupXml(xmlObject: string | any): any {
    let dataObj: any = {};
    let parser: any = null;
    if ("undefined" !== typeof xmlObject) {
        if ("string" === typeof xmlObject) {
            xmlObject = xmlObject.replace("^\uFEFF", "")
                .replace(/^\s+/, "");
            if (xmlObject.slice(0, 1) === "<") {
                // Assume serialized XML
                dataObj = parseXml(xmlObject);
            } else {
                // Assume serialized JSON
                dataObj = JSON.parse(xmlObject);
            }
            parser = new XmlJSON(dataObj);
        } else if ("undefined" !== typeof xmlObject.getAttribute) {
            // Assume DOM instance
            parser = new XmlDOM(xmlObject);
        } else {
            // Assume JS object
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
