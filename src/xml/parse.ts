export interface XmlNode {
    name: string;
    attrs: Record<string, string>;
    children: (XmlNode | string)[];
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
