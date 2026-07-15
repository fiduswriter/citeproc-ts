import { CSL } from '../csl';
CSL.getLocaleNames = function (myxml: any, preferredLocale?: string): string[] {
    var stylexml = CSL.setupXml(myxml);

    function extendLocaleList(localeList: string[], locale?: string): void {
        var forms = ["base", "best"];
        if (locale) {
            var normalizedLocale = CSL.localeResolve(locale);
            for (let i = 0, ilen = forms.length; i < ilen; i += 1) {
                if (normalizedLocale[forms[i]] && localeList.indexOf(normalizedLocale[forms[i]]) === -1) {
                    localeList.push(normalizedLocale[forms[i]]);
                }
            }
        }
    }

    var localeIDs: string[] = ["en-US"];

    function sniffLocaleOnOneNodeName(_xml: any, _localeIDs: string[], nodeName: string): void {
        var nodes = stylexml.getNodesByName(stylexml.dataObj, nodeName);
        for (let i = 0, ilen = nodes.length; i < ilen; i += 1) {
            var nodeLocales = stylexml.getAttributeValue(nodes[i], "locale");
            if (nodeLocales) {
                nodeLocales = nodeLocales.split(/ +/);
                for (let j = 0, jlen = nodeLocales.length; j < jlen; j += 1) {
                    this.extendLocaleList(localeIDs, nodeLocales[j]);
                }
            }
        }
    }

    extendLocaleList(localeIDs, preferredLocale);

    var styleNode = stylexml.getNodesByName(stylexml.dataObj, "style")[0];
    var defaultLocale = stylexml.getAttributeValue(styleNode, "default-locale");
    extendLocaleList(localeIDs, defaultLocale);

    var nodeNames = ["layout", "if", "else-if", "condition"];
    for (let i = 0, ilen = nodeNames.length; i < ilen; i += 1) {
        sniffLocaleOnOneNodeName(stylexml, localeIDs, nodeNames[i]);
    }
    return localeIDs;
};
