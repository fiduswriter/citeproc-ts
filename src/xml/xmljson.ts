import { CSL } from '../csl';

export class XmlJSON {
    dataObj: any;
    institution: any;
    jsonStringWalker: any;
    static _nodesByNameCaches = new WeakMap();

    constructor(dataObj: any) {
        this.dataObj = dataObj;
        this.institution = {
            name: "institution",
            attrs: { "institution-parts": "long" },
            children: [
                {
                    name: "institution-part",
                    attrs: { name: "long" },
                    children: []
                }
            ]
        };
    }

    clean(json: any): any {
        return json;
    }

    getStyleId(myjson: any, styleName?: string): string {
        let tagName = 'id';
        if (styleName) {
            tagName = 'title';
        }
        let ret = "";
        const children = myjson.children;
        for (let i = 0, ilen = children.length; i < ilen; i++) {
            if (children[i].name === 'info') {
                const grandkids = children[i].children;
                for (let j = 0, jlen = grandkids.length; j < jlen; j++) {
                    if (grandkids[j].name === tagName) {
                        ret = grandkids[j].children[0];
                    }
                }
            }
        }
        return ret;
    }

    children(myjson: any): any {
        if (myjson && myjson.children.length) {
            return myjson.children.slice();
        }
        return false;
    }

    nodename(myjson: any): string | null {
        return myjson ? myjson.name : null;
    }

    attributes(myjson: any): Record<string, string> {
        const ret: Record<string, string> = {};
        for (const attrname in myjson.attrs) {
            ret["@" + attrname] = myjson.attrs[attrname];
        }
        return ret;
    }

    content(myjson: any): string {
        let ret = "";
        if (!myjson || !myjson.children) {
            return ret;
        }
        for (let i = 0, ilen = myjson.children.length; i < ilen; i += 1) {
            if ("string" === typeof myjson.children[i]) {
                ret += myjson.children[i];
            }
        }
        return ret;
    }

    numberofnodes(myjson: any): number {
        if (myjson && "number" == typeof myjson.length) {
            return myjson.length;
        }
        return 0;
    }

    getAttributeValue(myjson: any, name: string, namespace?: string): string {
        let ret = "";
        if (namespace) {
            name = namespace + ":" + name;
        }
        if (myjson) {
            if (myjson.attrs) {
                if (myjson.attrs[name]) {
                    ret = myjson.attrs[name];
                } else {
                    ret = "";
                }
            }
        }
        return ret;
    }

    getNodeValue(myjson: any, name?: string): any {
        let ret: any = "";
        if (name) {
            for (let i = 0, ilen = myjson.children.length; i < ilen; i += 1) {
                if (myjson.children[i].name === name) {
                    if (myjson.children[i].children.length) {
                        ret = myjson.children[i];
                    } else {
                        ret = "";
                    }
                }
            }
        } else if (myjson) {
            ret = myjson;
        }
        if (ret && ret.children && ret.children.length == 1 && "string" === typeof ret.children[0]) {
            ret = ret.children[0];
        }
        return ret;
    }

    setAttributeOnNodeIdentifiedByNameAttribute(myjson: any, nodename: string, partname: string, attrname: string, val: any): void {
        if (attrname.slice(0, 1) === '@') {
            attrname = attrname.slice(1);
        }
        for (let i = 0, ilen = myjson.children.length; i < ilen; i += 1) {
            if (myjson.children[i].name === nodename && myjson.children[i].attrs.name === partname) {
                myjson.children[i].attrs[attrname] = val;
            }
        }
    }

    deleteNodeByNameAttribute(myjson: any, val: any): void {
        for (let i = 0, ilen = myjson.children.length; i < ilen; i += 1) {
            if (!myjson.children[i] || "string" === typeof myjson.children[i]) {
                continue;
            }
            if (myjson.children[i].attrs.name == val) {
                myjson.children = myjson.children.slice(0, i).concat(myjson.children.slice(i + 1));
            }
        }
    }

    deleteAttribute(myjson: any, attrname: string): void {
        if ("undefined" !== typeof myjson.attrs[attrname]) {
            myjson.attrs.pop(attrname);
        }
    }

    setAttribute(myjson: any, attr: string, val: any): boolean {
        myjson.attrs[attr] = val;
        return false;
    }

    nodeCopy(myjson: any, clone?: any): any {
        if (!clone) {
            clone = {};
        }
        if ("object" === typeof clone && "undefined" === typeof clone.length) {
            for (const key in myjson) {
                if ("string" === typeof myjson[key]) {
                    clone[key] = myjson[key];
                } else if ("object" === typeof myjson[key]) {
                    if ("undefined" === typeof myjson[key].length) {
                        clone[key] = this.nodeCopy(myjson[key], {});
                    } else {
                        clone[key] = this.nodeCopy(myjson[key], []);
                    }
                }
            }
        } else {
            for (let i = 0, ilen = myjson.length; i < ilen; i += 1) {
                if ("string" === typeof myjson[i]) {
                    clone[i] = myjson[i];
                } else {
                    clone[i] = this.nodeCopy(myjson[i], {});
                }
            }
        }
        return clone;
    }

    getNodesByName(myjson: any, name: string, nameattrval?: string): any[] {
        if (!myjson || !myjson.children) {
            return [];
        }

        const getCache = (myjson: any): Map<string, any[]> => {
            if (XmlJSON._nodesByNameCaches.has(myjson)) {
                return XmlJSON._nodesByNameCaches.get(myjson);
            }

            const cache = new Map<string, any[]>();
            XmlJSON._nodesByNameCaches.set(myjson, cache);

            const nodeName = myjson.name;
            if (!cache.has(nodeName)) {
                cache.set(nodeName, []);
            }
            cache.get(nodeName)!.push(myjson);

            for (const child of myjson.children) {
                if (typeof child !== "object") continue;
                const childCache = getCache(child);
                for (const [cacheKey, nodes] of childCache) {
                    if (!cache.has(cacheKey)) {
                        cache.set(cacheKey, []);
                    }
                    cache.get(cacheKey)!.push(...nodes);
                }
            }

            return cache;
        };

        const cache = getCache(myjson);
        const nodes = cache.get(name);
        if (!nodes) {
            return [];
        }
        if (nameattrval) {
            return nodes.filter((node: any) => node.attrs.name === nameattrval);
        }
        return Array.from(nodes);
    }

    nodeNameIs(myjson: any, name: string): boolean {
        if (typeof myjson === "undefined") {
            return false;
        }
        return name == myjson.name;
    }

    makeXml(myjson: any): any {
        if ("string" === typeof myjson) {
            if (myjson.slice(0, 1) === "<") {
                myjson = this.jsonStringWalker.walkToObject(myjson);
            } else {
                myjson = JSON.parse(myjson);
            }
        }
        return myjson;
    }

    insertChildNodeAfter(parent: any, node: any, _pos: any, datejson: any): any {
        for (let i = 0, ilen = parent.children.length; i < ilen; i += 1) {
            if (node === parent.children[i]) {
                parent.children = parent.children.slice(0, i).concat([datejson]).concat(parent.children.slice(i + 1));
                break;
            }
        }
        return parent;
    }

    insertPublisherAndPlace(myjson: any): void {
        if (myjson.name === "group") {
            let useme = true;
            let mustHaves = ["publisher", "publisher-place"];
            for (let i = 0, ilen = myjson.children.length; i < ilen; i += 1) {
                const haveVarname = mustHaves.indexOf(myjson.children[i].attrs.variable);
                const isText = myjson.children[i].name === "text";
                if (isText && haveVarname > -1 && !myjson.children[i].attrs.prefix && !myjson.children[i].attrs.suffix) {
                    mustHaves = mustHaves.slice(0, haveVarname).concat(mustHaves.slice(haveVarname + 1));
                } else {
                    useme = false;
                    break;
                }
            }
            if (useme && !mustHaves.length) {
                myjson.attrs["has-publisher-and-publisher-place"] = true;
            }
        }
        for (let i = 0, ilen = myjson.children.length; i < ilen; i += 1) {
            if ("object" === typeof myjson.children[i]) {
                this.insertPublisherAndPlace(myjson.children[i]);
            }
        }
    }

    isChildOfSubstitute(parents: string[]): boolean {
        if (parents.length > 0) {
            const myparents = parents.slice();
            const parent = myparents.pop();
            if (parent === "substitute") {
                return true;
            }
            return this.isChildOfSubstitute(myparents);
        }
        return false;
    }

    addMissingNameNodes(myjson: any, parents: string[]): void {
        if (!parents) {
            parents = [];
        }
        if (myjson.name === "names") {
            if (!this.isChildOfSubstitute(parents)) {
                let addName = true;
                for (let i = 0, ilen = myjson.children.length; i < ilen; i++) {
                    if (myjson.children[i].name === "name") {
                        addName = false;
                        break;
                    }
                }
                if (addName) {
                    myjson.children = [{ name: "name", attrs: {}, children: [] }].concat(myjson.children);
                }
            }
        }
        parents.push(myjson.name);
        for (let i = 0, ilen = myjson.children.length; i < ilen; i += 1) {
            if ("object" === typeof myjson.children[i]) {
                this.addMissingNameNodes(myjson.children[i], parents);
            }
        }
        parents.pop();
    }

    addInstitutionNodes(myjson: any): void {
        if (myjson.name === "names") {
            const attributes: Record<string, string> = {};
            let insertPos = -1;
            for (let i = 0, ilen = myjson.children.length; i < ilen; i += 1) {
                if (myjson.children[i].name == "name") {
                    for (const key in myjson.children[i].attrs) {
                        attributes[key] = myjson.children[i].attrs[key];
                    }
                    insertPos = i;
                    for (let k = 0, klen = myjson.children[i].children.length; k < klen; k += 1) {
                        if (myjson.children[i].children[k].attrs.name !== 'family') {
                            continue;
                        }
                        for (const key in myjson.children[i].children[k].attrs) {
                            attributes[key] = myjson.children[i].children[k].attrs[key];
                        }
                    }
                }
                if (myjson.children[i].name == "institution") {
                    insertPos = -1;
                    break;
                }
            }
            if (insertPos > -1) {
                const institution = this.nodeCopy(this.institution);
                for (let i = 0, ilen = CSL.NAME_ATTRIBUTES.length; i < ilen; i += 1) {
                    const attrname = CSL.NAME_ATTRIBUTES[i];
                    if ("undefined" !== typeof attributes[attrname]) {
                        institution.attrs[attrname] = attributes[attrname];
                    }
                }
                for (let i = 0, ilen = CSL.INSTITUTION_KEYS.length; i < ilen; i += 1) {
                    const attrname = CSL.INSTITUTION_KEYS[i];
                    if ("undefined" !== typeof attributes[attrname]) {
                        institution.children[0].attrs[attrname] = attributes[attrname];
                    }
                }
                myjson.children = myjson.children.slice(0, insertPos + 1).concat([institution]).concat(myjson.children.slice(insertPos + 1));
            }
        }
        for (let i = 0, ilen = myjson.children.length; i < ilen; i += 1) {
            if ("string" === typeof myjson.children[i]) {
                continue;
            }
            this.addInstitutionNodes(myjson.children[i]);
        }
    }

    flagDateMacros(myjson: any): void {
        for (let i = 0, ilen = myjson.children.length; i < ilen; i += 1) {
            if (myjson.children[i].name === "macro") {
                if (this.inspectDateMacros(myjson.children[i])) {
                    myjson.children[i].attrs["macro-has-date"] = "true";
                }
            }
        }
    }

    inspectDateMacros(myjson: any): boolean {
        if (!myjson || !myjson.children) {
            return false;
        }
        if (myjson.name === "date") {
            return true;
        }
        for (let i = 0, ilen = myjson.children.length; i < ilen; i += 1) {
            if (this.inspectDateMacros(myjson.children[i])) {
                return true;
            }
        }
        return false;
    }
}

CSL.XmlJSON = XmlJSON;

CSL.stripXmlProcessingInstruction = function (xml: string): string {
    if (!xml) {
        return xml;
    }
    xml = xml.replace(/^<\?[^?]+\?>/, "");
    xml = xml.replace(/<!--[^>]+-->/g, "");
    xml = xml.replace(/^\s+/g, "");
    xml = xml.replace(/\s+$/g, "");
    return xml;
};

CSL.parseXml = function (str: string): any {
    const _obj = { children: [] as any[] };
    const _stack = [_obj.children];

    function _listifyString(str: string): string[] {
        str = str.split(/(?:\r\n|\n|\r)/).join(" ").replace(/>[ \t]+</g, "><").replace(/<!--.*?-->/g, "");
        let lst = str.split("><");
        let stylePos: number | null = null;
        for (let i = 0, ilen = lst.length; i < ilen; i++) {
            if (i > 0) {
                lst[i] = "<" + lst[i];
            }
            if (i < (lst.length - 1)) {
                lst[i] = lst[i] + ">";
            }
            if (typeof stylePos !== "number") {
                if (lst[i].slice(0, 7) === "<style " || lst[i].slice(0, 8) == "<locale ") {
                    stylePos = i;
                }
            }
        }
        lst = lst.slice(stylePos!);
        for (let i = lst.length - 2; i > -1; i--) {
            if (lst[i].slice(1).indexOf("<") === -1) {
                const stub = lst[i].slice(0, 5);
                if (lst[i].slice(-2) !== "/>") {
                    if (stub === "<term") {
                        if (lst[i + 1].slice(0, 6) === "</term") {
                            lst[i] = lst[i] + lst[i + 1];
                            lst = lst.slice(0, i + 1).concat(lst.slice(i + 2));
                        }
                    } else if (["<sing", "<mult"].indexOf(stub) > -1) {
                        if (lst[i].slice(-2) !== "/>" && lst[i + 1].slice(0, 1) === "<") {
                            lst[i] = lst[i] + lst[i + 1];
                            lst = lst.slice(0, i + 1).concat(lst.slice(i + 2));
                        }
                    }
                }
            }
        }
        return lst;
    }

    function _decodeHtmlEntities(str: string): string {
        return str
            .split("&amp;").join("&")
            .split("&quot;").join("\"")
            .split("&gt;").join(">").split("&lt;").join("<")
            .replace(/&#([0-9]{1,6});/gi, function (_match: string, numStr: string) {
                const num = parseInt(numStr, 10);
                return String.fromCharCode(num);
            })
            .replace(/&#x([a-f0-9]{1,6});/gi, function (_match: string, numStr: string) {
                const num = parseInt(numStr, 16);
                return String.fromCharCode(num);
            });
    }

    function _getAttributes(elem: string): string[] | null {
        const m = elem.match(/([^'"= \t]+)=(?:"[^"]*"|'[^']*')/g);
        if (m) {
            for (let i = 0, ilen = m.length; i < ilen; i++) {
                m[i] = m[i].replace(/=.*/, "");
            }
        }
        return m;
    }

    function _getAttribute(elem: string, attr: string): string | null {
        const rex = new RegExp('^.*[ \t]+' + attr + '=("(?:[^"]*)"|\'(?:[^\']*)\').*$');
        const m = elem.match(rex);
        return m ? m[1].slice(1, -1) : null;
    }

    function _getTagName(elem: string): string | null {
        const rex = new RegExp("^<([^ \t/>]+)");
        const m = elem.match(rex);
        return m ? m[1] : null;
    }

    function _castObjectFromOpeningTag(elem: string): any {
        const obj: any = {};
        obj.name = _getTagName(elem);
        obj.attrs = {};
        const attributes = _getAttributes(elem);
        if (attributes) {
            for (let i = 0, ilen = attributes.length; i < ilen; i++) {
                const attr = {
                    name: attributes[i],
                    value: _getAttribute(elem, attributes[i])
                };
                obj.attrs[attr.name] = _decodeHtmlEntities(attr.value);
            }
        }
        obj.children = [];
        return obj;
    }

    function _extractTextFromCompositeElement(elem: string): string {
        const m = elem.match(/^.*>([^<]*)<.*$/);
        return _decodeHtmlEntities(m[1]);
    }

    function _appendToChildren(obj: any): void {
        _stack.slice(-1)[0].push(obj);
    }

    function _extendStackWithNewChildren(obj: any): void {
        _stack.push(obj.children);
    }

    function processElement(elem: string): void {
        let obj: any;
        if (elem.slice(1).indexOf('<') > -1) {
            const tag = elem.slice(0, elem.indexOf('>') + 1);
            obj = _castObjectFromOpeningTag(tag);
            obj.children = [_extractTextFromCompositeElement(elem)];
            _appendToChildren(obj);
        } else if (elem.slice(-2) === '/>') {
            obj = _castObjectFromOpeningTag(elem);
            if (_getTagName(elem) === 'term') {
                obj.children.push('');
            }
            _appendToChildren(obj);
        } else if (elem.slice(0, 2) === '</') {
            _stack.pop();
        } else {
            obj = _castObjectFromOpeningTag(elem);
            _appendToChildren(obj);
            _extendStackWithNewChildren(obj);
        }
    }

    const lst = _listifyString(str);
    for (let i = 0, ilen = lst.length; i < ilen; i++) {
        const elem = lst[i];
        processElement(elem);
    }
    return _obj.children[0];
};
