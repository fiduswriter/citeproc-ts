import { INSTITUTION_KEYS, NAME_ATTRIBUTES } from '../constants/core';
export interface XmlNode {
    name: string;
    attrs: Record<string, string>;
    children: (XmlNode | string)[];
}

export class XmlJSON {
    dataObj: XmlNode;
    institution: XmlNode;
    jsonStringWalker: any;
    static _nodesByNameCaches = new WeakMap<object, Map<string, XmlNode[]>>();

    constructor(dataObj: XmlNode) {
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

    clean(json: XmlNode): XmlNode {
        return json;
    }

    getStyleId(myjson: XmlNode, styleName?: string): string {
        let tagName = 'id';
        if (styleName) {
            tagName = 'title';
        }
        let ret = "";
        const children = myjson.children;
        for (let i = 0, ilen = children.length; i < ilen; i++) {
            const child = children[i];
            if (typeof child !== "string" && child.name === 'info') {
                const grandkids = child.children;
                for (let j = 0, jlen = grandkids.length; j < jlen; j++) {
                    const grandchild = grandkids[j];
                    if (typeof grandchild !== "string" && grandchild.name === tagName) {
                        const val = grandchild.children[0];
                        ret = typeof val === "string" ? val : "";
                    }
                }
            }
        }
        return ret;
    }

    children(myjson: XmlNode): XmlNode[] | false {
        if (myjson && myjson.children.length) {
            return myjson.children.filter(c => typeof c !== "string") as XmlNode[];
        }
        return false;
    }

    nodename(myjson: XmlNode): string | null {
        return myjson ? myjson.name : null;
    }

    attributes(myjson: XmlNode): Record<string, string> {
        const ret: Record<string, string> = {};
        for (const attrname in myjson.attrs) {
            ret["@" + attrname] = myjson.attrs[attrname];
        }
        return ret;
    }

    content(myjson: XmlNode): string {
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

    numberofnodes(myjson: XmlNode[] | undefined): number {
        if (myjson && "number" == typeof myjson.length) {
            return myjson.length;
        }
        return 0;
    }

    getAttributeValue(myjson: XmlNode, name: string, namespace?: string): string {
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

    getNodeValue(myjson: XmlNode, name?: string): string | XmlNode {
        let ret: string | XmlNode = "";
        if (name) {
            for (let i = 0, ilen = myjson.children.length; i < ilen; i += 1) {
                const child = myjson.children[i];
                if (typeof child !== "string" && child.name === name) {
                    if (child.children.length) {
                        ret = child;
                    } else {
                        ret = "";
                    }
                }
            }
        } else if (myjson) {
            ret = myjson;
        }
        if (typeof ret !== "string" && ret && ret.children && ret.children.length == 1 && "string" === typeof ret.children[0]) {
            ret = ret.children[0];
        }
        return ret;
    }

    setAttributeOnNodeIdentifiedByNameAttribute(myjson: XmlNode, nodename: string, partname: string, attrname: string, val: string): void {
        if (attrname.slice(0, 1) === '@') {
            attrname = attrname.slice(1);
        }
        for (let i = 0, ilen = myjson.children.length; i < ilen; i += 1) {
            const child = myjson.children[i];
            if (typeof child === "string") continue;
            if (child.name === nodename && child.attrs.name === partname) {
                child.attrs[attrname] = val;
            }
        }
    }

    deleteNodeByNameAttribute(myjson: XmlNode, val: string): void {
        for (let i = 0, ilen = myjson.children.length; i < ilen; i += 1) {
            if (!myjson.children[i] || "string" === typeof myjson.children[i]) {
                continue;
            }
            if ((myjson.children[i] as XmlNode).attrs.name == val) {
                myjson.children = myjson.children.slice(0, i).concat(myjson.children.slice(i + 1));
            }
        }
    }

    deleteAttribute(myjson: XmlNode, attrname: string): void {
        if ("undefined" !== typeof myjson.attrs[attrname]) {
            delete myjson.attrs[attrname];
        }
    }

    setAttribute(myjson: XmlNode, attr: string, val: string): boolean {
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

    getNodesByName(myjson: XmlNode, name: string, nameattrval?: string): XmlNode[] {
        if (!myjson || !myjson.children) {
            return [];
        }

        const getCache = (myjson: XmlNode): Map<string, XmlNode[]> => {
            if (XmlJSON._nodesByNameCaches.has(myjson)) {
                return XmlJSON._nodesByNameCaches.get(myjson)!;
            }

            const cache = new Map<string, XmlNode[]>();
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
            return nodes.filter((node: XmlNode) => node.attrs.name === nameattrval);
        }
        return Array.from(nodes);
    }

    nodeNameIs(myjson: XmlNode | undefined, name: string): boolean {
        if (typeof myjson === "undefined") {
            return false;
        }
        return name == myjson.name;
    }

    makeXml(myjson: string | XmlNode): XmlNode | string {
        if ("string" === typeof myjson) {
            if (myjson.slice(0, 1) === "<") {
                return this.jsonStringWalker.walkToObject(myjson);
            } else {
                return JSON.parse(myjson);
            }
        }
        return myjson;
    }

    insertChildNodeAfter(parent: XmlNode, node: XmlNode, _pos: number, datejson: XmlNode): XmlNode {
        for (let i = 0, ilen = parent.children.length; i < ilen; i += 1) {
            if (node === parent.children[i]) {
                parent.children = parent.children.slice(0, i).concat([datejson]).concat(parent.children.slice(i + 1));
                break;
            }
        }
        return parent;
    }

    insertPublisherAndPlace(myjson: XmlNode): void {
        if (myjson.name === "group") {
            let useme = true;
            let mustHaves = ["publisher", "publisher-place"];
            for (let i = 0, ilen = myjson.children.length; i < ilen; i += 1) {
                const child = myjson.children[i];
                if (typeof child === "string") continue;
                const haveVarname = mustHaves.indexOf(child.attrs.variable);
                const isText = child.name === "text";
                if (isText && haveVarname > -1 && !child.attrs.prefix && !child.attrs.suffix) {
                    mustHaves = mustHaves.slice(0, haveVarname).concat(mustHaves.slice(haveVarname + 1));
                } else {
                    useme = false;
                    break;
                }
            }
            if (useme && !mustHaves.length) {
                myjson.attrs["has-publisher-and-publisher-place"] = "true";
            }
        }
        for (let i = 0, ilen = myjson.children.length; i < ilen; i += 1) {
            if ("object" === typeof myjson.children[i]) {
                this.insertPublisherAndPlace(myjson.children[i] as XmlNode);
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

    addMissingNameNodes(myjson: XmlNode, parents: string[]): void {
        if (!parents) {
            parents = [];
        }
        if (myjson.name === "names") {
            if (!this.isChildOfSubstitute(parents)) {
                let addName = true;
                for (let i = 0, ilen = myjson.children.length; i < ilen; i++) {
                    const child = myjson.children[i];
                    if (typeof child !== "string" && child.name === "name") {
                        addName = false;
                        break;
                    }
                }
                if (addName) {
                    myjson.children = ([{ name: "name", attrs: {}, children: [] }] as (XmlNode | string)[]).concat(myjson.children);
                }
            }
        }
        parents.push(myjson.name);
        for (let i = 0, ilen = myjson.children.length; i < ilen; i += 1) {
            if ("object" === typeof myjson.children[i]) {
                this.addMissingNameNodes(myjson.children[i] as XmlNode, parents);
            }
        }
        parents.pop();
    }

    addInstitutionNodes(myjson: XmlNode): void {
        if (myjson.name === "names") {
            const attributes: Record<string, string> = {};
            let insertPos = -1;
            for (let i = 0, ilen = myjson.children.length; i < ilen; i += 1) {
                const child = myjson.children[i];
                if (typeof child === "string") continue;
                if (child.name == "name") {
                    for (const key in child.attrs) {
                        attributes[key] = child.attrs[key];
                    }
                    insertPos = i;
                    for (let k = 0, klen = child.children.length; k < klen; k += 1) {
                        const grandchild = child.children[k];
                        if (typeof grandchild === "string") continue;
                        if (grandchild.attrs.name !== 'family') {
                            continue;
                        }
                        for (const key in grandchild.attrs) {
                            attributes[key] = grandchild.attrs[key];
                        }
                    }
                }
                if (child.name == "institution") {
                    insertPos = -1;
                    break;
                }
            }
            if (insertPos > -1) {
                const institution = this.nodeCopy(this.institution);
                for (let i = 0, ilen = NAME_ATTRIBUTES.length; i < ilen; i += 1) {
                    const attrname = NAME_ATTRIBUTES[i];
                    if ("undefined" !== typeof attributes[attrname]) {
                        institution.attrs[attrname] = attributes[attrname];
                    }
                }
                for (let i = 0, ilen = INSTITUTION_KEYS.length; i < ilen; i += 1) {
                    const attrname = INSTITUTION_KEYS[i];
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
            this.addInstitutionNodes(myjson.children[i] as XmlNode);
        }
    }

    flagDateMacros(myjson: XmlNode): void {
        for (let i = 0, ilen = myjson.children.length; i < ilen; i += 1) {
            const child = myjson.children[i];
            if (typeof child === "string") continue;
            if (child.name === "macro") {
                if (this.inspectDateMacros(child)) {
                    child.attrs["macro-has-date"] = "true";
                }
            }
        }
    }

    inspectDateMacros(myjson: XmlNode): boolean {
        if (!myjson || !myjson.children) {
            return false;
        }
        if (myjson.name === "date") {
            return true;
        }
        for (let i = 0, ilen = myjson.children.length; i < ilen; i += 1) {
            if (this.inspectDateMacros(myjson.children[i] as XmlNode)) {
                return true;
            }
        }
        return false;
    }
}

export function stripXmlProcessingInstruction(xml: string): string {
    if (!xml) {
        return xml;
    }
    xml = xml.replace(/^<\?[^?]+\?>/, "");
    xml = xml.replace(/<!--[^>]+-->/g, "");
    xml = xml.replace(/^\s+/g, "");
    xml = xml.replace(/\s+$/g, "");
    return xml;
}

export function parseXml(str: string): XmlNode {
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
