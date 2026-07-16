import { CSL } from '../csl';

export function getLocaleNames(myxml: any, preferredLocale?: string): string[] {
    const stylexml = CSL.setupXml(myxml);
    const stylexml = CSL.setupXml(myxml);

    function extendLocaleList(localeList: string[], locale?: string): void {
        const forms = ["base", "best"];
        if (locale) {
            const normalizedLocale = CSL.localeResolve(locale);
            for (let i = 0, ilen = forms.length; i < ilen; i += 1) {
                if (normalizedLocale[forms[i]] && localeList.indexOf(normalizedLocale[forms[i]]) === -1) {
                    localeList.push(normalizedLocale[forms[i]]);
                }
            }
        }
    }

    const localeIDs: string[] = ["en-US"];

    function sniffLocaleOnOneNodeName(_xml: any, _localeIDs: string[], nodeName: string): void {
        const nodes = stylexml.getNodesByName(stylexml.dataObj, nodeName);
        for (let i = 0, ilen = nodes.length; i < ilen; i += 1) {
            let nodeLocales = stylexml.getAttributeValue(nodes[i], "locale");
            if (nodeLocales) {
                nodeLocales = nodeLocales.split(/ +/);
                for (let j = 0, jlen = nodeLocales.length; j < jlen; j += 1) {
                    extendLocaleList(localeIDs, nodeLocales[j]);
                }
            }
        }
    }

    extendLocaleList(localeIDs, preferredLocale);

    const styleNode = stylexml.getNodesByName(stylexml.dataObj, "style")[0];
    const defaultLocale = stylexml.getAttributeValue(styleNode, "default-locale");
    extendLocaleList(localeIDs, defaultLocale);

    const nodeNames = ["layout", "if", "else-if", "condition"];
    for (let i = 0, ilen = nodeNames.length; i < ilen; i += 1) {
        sniffLocaleOnOneNodeName(stylexml, localeIDs, nodeNames[i]);
    }
    return localeIDs;
}
