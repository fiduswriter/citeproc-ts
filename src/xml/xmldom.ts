import { CSL } from '../csl';
/**
 * Functions for parsing an XML object using E4X.
 */

export class XmlDOM {
    dataObj: any;
    parser: any;
    institution: any;
    institutionpart: any;
    ns: string;

    constructor(dataObj) {
        this.dataObj = dataObj;
        if ("undefined" == typeof DOMParser) {
            DOMParser = function() {};
            DOMParser.prototype.parseFromString = function(str, contentType) {
                if ("undefined" != typeof ActiveXObject) {
                    const xmldata = new ActiveXObject('MSXML.DomDocument');
                    xmldata.async = false;
                    xmldata.loadXML(str);
                    return xmldata;
                } else if ("undefined" != typeof XMLHttpRequest) {
                    const xmldata = new XMLHttpRequest;
                    if (!contentType) {
                        contentType = 'text/xml';
                    }
                    xmldata.open('GET', 'data:' + contentType + ';charset=utf-8,' + encodeURIComponent(str), false);
                    if(xmldata.overrideMimeType) {
                        xmldata.overrideMimeType(contentType);
                    }
                    xmldata.send(null);
                    return xmldata.responseXML;
                } else if ("undefined" != typeof marknote) {
                    const parser = new marknote.Parser();
                    return parser.parse(str);
                }
            };
        }
        this.parser = new DOMParser();

        let str = "<docco><institution institution-parts=\"long\" delimiter=\", \" substitute-use-first=\"1\" use-last=\"1\"><institution-part name=\"long\"/></institution></docco>";
        const inst_doc = this.parser.parseFromString(str, "text/xml");
        const inst_node = inst_doc.getElementsByTagName("institution");
        this.institution = inst_node.item(0);
        const inst_part_node = inst_doc.getElementsByTagName("institution-part");
        this.institutionpart = inst_part_node.item(0);
        this.ns = "http://purl.org/net/xbiblio/csl";
    }

    hasAttributes(node) {
        let ret;
        if (node.attributes && node.attributes.length) {
            ret = true;
        } else {
            ret = false;
        }
        return ret;
    }

    importNode(doc, srcElement) {
        let ret;
        if ("undefined" == typeof doc.importNode) {
            ret = this._importNode(doc, srcElement, true);
        } else {
            ret = doc.importNode(srcElement, true);
        }
        return ret;
    }

    _importNode(doc, node, allChildren) {
        switch (node.nodeType) {
            case 1:
                const newNode = doc.createElement(node.nodeName);
                if (node.attributes && node.attributes.length > 0)
                    for (let i = 0, il = node.attributes.length; i < il;)
                        newNode.setAttribute(node.attributes[i].nodeName, node.getAttribute(node.attributes[i++].nodeName));
                    if (allChildren && node.childNodes && node.childNodes.length > 0)
                        for (let i = 0, il = node.childNodes.length; i < il;)
                            newNode.appendChild(this._importNode(doc, node.childNodes[i++], allChildren));
                return newNode;
                break;
            case 3:
            case 4:
            case 8:
        }
    }

    clean(xml) {
        xml = xml.replace(/<\?[^?]+\?>/g, "");
        xml = xml.replace(/<![^>]+>/g, "");
        xml = xml.replace(/^\s+/, "");
        xml = xml.replace(/\s+$/, "");
        xml = xml.replace(/^\n*/, "");
        return xml;
    }

    getStyleId(myxml, styleName) {
        let text = "";
        let tagName = "id";
        if (styleName) {
            tagName = "title";
        }
        let node = myxml.getElementsByTagName(tagName);
        if (node && node.length) {
            node = node.item(0);
        }
        if (node) {
            text = node.textContent;
        }
        if (!text) {
            text = node.innerText;
        }
        if (!text) {
            text = node.innerHTML;
        }
        return text;
    }

    children(myxml) {
        let children, pos, len, ret;
        if (myxml) {
            ret = [];
            children = myxml.childNodes;
            for (let pos = 0, len = children.length; pos < len; pos += 1) {
                if (children[pos].nodeName != "#text") {
                    ret.push(children[pos]);
                }
            }
            return ret;
        } else {
            return [];
        }
    }

    nodename(myxml) {
        let ret = myxml.nodeName;
        return ret;
    }

    attributes(myxml) {
        let ret, attrs, attr, key, xml, pos, len;
        ret = new Object();
        if (myxml && this.hasAttributes(myxml)) {
            attrs = myxml.attributes;
            for (let pos = 0, len=attrs.length; pos < len; pos += 1) {
                attr = attrs[pos];
                ret["@" + attr.name] = attr.value;
            }
        }
        return ret;
    }

    content(myxml) {
        let ret;
        if ("undefined" != typeof myxml.textContent) {
            ret = myxml.textContent;
        } else if ("undefined" != typeof myxml.innerText) {
            ret = myxml.innerText;
        } else {
            ret = myxml.txt;
        }
        return ret;
    }

    numberofnodes(myxml) {
        if (myxml) {
            return myxml.length;
        } else {
            return 0;
        }
    }

    getAttributeName(attr) {
        let ret = attr.name;
        return ret;
    }

    getAttributeValue(myxml,name,namespace) {
        let ret = "";
        if (namespace) {
            name = namespace+":"+name;
        }
        if (myxml && this.hasAttributes(myxml) && myxml.getAttribute(name)) {
            ret = myxml.getAttribute(name);
        }
        return ret;
    }

    getNodeValue(myxml,name) {
        let ret = null;
        if (name){
            const vals = myxml.getElementsByTagName(name);
            if (vals.length > 0) {
                if ("undefined" != typeof vals[0].textContent) {
                    ret = vals[0].textContent;
                } else if ("undefined" != typeof vals[0].innerText) {
                    ret = vals[0].innerText;
                } else {
                    ret = vals[0].text;
                }
            }
        }
        if (ret === null && myxml && myxml.childNodes && (myxml.childNodes.length == 0 || (myxml.childNodes.length == 1 && myxml.firstChild.nodeName == "#text"))) {
            if ("undefined" != typeof myxml.textContent) {
                ret = myxml.textContent;
            } else if ("undefined" != typeof myxml.innerText) {
                ret = myxml.innerText;
            } else {
                ret = myxml.text;
            }
        }
        if (ret === null) {
            ret = myxml;
        }
        return ret;
    }

    setAttributeOnNodeIdentifiedByNameAttribute(myxml,nodename,partname,attrname,val) {
        let pos, len, xml, nodes, node;
        if (attrname.slice(0,1) === '@'){
            attrname = attrname.slice(1);
        }
        nodes = myxml.getElementsByTagName(nodename);
        for (let pos = 0, len = nodes.length; pos < len; pos += 1) {
            node = nodes[pos];
            if (node.getAttribute("name") != partname) {
                continue;
            }
            node.setAttribute(attrname, val);
        }
    }

    deleteNodeByNameAttribute(myxml,val) {
        let pos, len, node, nodes;
        nodes = myxml.childNodes;
        for (let pos = 0, len = nodes.length; pos < len; pos += 1) {
            node = nodes[pos];
            if (!node || node.nodeType == node.TEXT_NODE) {
                continue;
            }
            if (this.hasAttributes(node) && node.getAttribute("name") == val) {
                myxml.removeChild(nodes[pos]);
            }
        }
    }

    deleteAttribute(myxml,attr) {
        myxml.removeAttribute(attr);
    }

    setAttribute(myxml,attr,val) {
        if (!myxml.ownerDocument) {
            myxml = myxml.firstChild;
        }
        if (["function", "unknown"].indexOf(typeof myxml.setAttribute) > -1) {
            myxml.setAttribute(attr, val);
        }
        return false;
    }

    nodeCopy(myxml) {
        const cloned_node = myxml.cloneNode(true);
        return cloned_node;
    }

    getNodesByName(myxml,name,nameattrval) {
        let ret, nodes, node, pos, len;
        ret = [];
        nodes = myxml.getElementsByTagName(name);
        for (let pos = 0, len = nodes.length; pos < len; pos += 1) {
            node = nodes.item(pos);
            if (nameattrval && !(this.hasAttributes(node) && node.getAttribute("name") == nameattrval)) {
                continue;
            }
            ret.push(node);
        }
        return ret;
    }

    nodeNameIs(myxml,name) {
        if (name == myxml.nodeName) {
            return true;
        }
        return false;
    }

    makeXml(myxml) {
        let ret, topnode;
        if (!myxml) {
            myxml = "<docco><bogus/></docco>";
        }
        myxml = myxml.replace(/\s*<\?[^>]*\?>\s*\n*/g, "");
        const nodetree = this.parser.parseFromString(myxml, "application/xml");
        return nodetree.firstChild;
    }

    insertChildNodeAfter(parent,node,pos,datexml) {
        let myxml, xml;
        myxml = this.importNode(node.ownerDocument, datexml);
        parent.replaceChild(myxml, node);
         return parent;
    }

    insertPublisherAndPlace(myxml) {
        const group = myxml.getElementsByTagName("group");
        for (let i = 0, ilen = group.length; i < ilen; i += 1) {
            let node = group.item(i);
            const skippers = [];
            for (let j = 0, jlen = node.childNodes.length; j < jlen; j += 1) {
                if (node.childNodes.item(j).nodeType !== 1) {
                    skippers.push(j);
                }
            }
            if (node.childNodes.length - skippers.length === 2) {
                let twovars = [];
                for (let j = 0, jlen = 2; j < jlen; j += 1) {
                    if (skippers.indexOf(j) > -1) {
                        continue;
                    }
                    const child = node.childNodes.item(j);                    
                    const subskippers = [];
                    for (let k = 0, klen = child.childNodes.length; k < klen; k += 1) {
                        if (child.childNodes.item(k).nodeType !== 1) {
                            subskippers.push(k);
                        }
                    }
                    if (child.childNodes.length - subskippers.length === 0) {
                        twovars.push(child.getAttribute('variable'));
                        if (child.getAttribute('suffix')
                            || child.getAttribute('prefix')) {
                            twovars = [];
                            break;
                        }
                    }
                }
                if (twovars.indexOf("publisher") > -1 && twovars.indexOf("publisher-place") > -1) {
                    node.setAttribute('has-publisher-and-publisher-place', true);
                }
            }
        }
    }

    isChildOfSubstitute(node) {
        if (node.parentNode) {
            if (node.parentNode.tagName.toLowerCase() === "substitute") {
                return true;
            } else {
                return this.isChildOfSubstitute(node.parentNode);
            }
        }
        return false;
    }

    addMissingNameNodes(myxml) {
        const nameslist = myxml.getElementsByTagName("names");
        for (let i = 0, ilen = nameslist.length; i < ilen; i += 1) {
            let names = nameslist.item(i);
            const namelist = names.getElementsByTagName("name");
            if ((!namelist || namelist.length === 0)
                && !this.isChildOfSubstitute(names)) {
                
                const doc = names.ownerDocument;
                let name = doc.createElement("name");
                names.appendChild(name);
            }
        }
    }

    addInstitutionNodes(myxml) {
        let names, thenames, institution, theinstitution, theinstitutionpart, name, thename, xml, pos, len;
        names = myxml.getElementsByTagName("names");
        for (let pos = 0, len = names.length; pos < len; pos += 1) {
            thenames = names.item(pos);
            name = thenames.getElementsByTagName("name");
            if (name.length == 0) {
                continue;
            }
            institution = thenames.getElementsByTagName("institution");
            if (institution.length == 0) {
                theinstitution = this.importNode(myxml.ownerDocument, this.institution);
                theinstitutionpart = theinstitution.getElementsByTagName("institution-part").item(0);
                thename = name.item(0);
                thenames.insertBefore(theinstitution, thename.nextSibling);
                for (let j = 0, jlen = CSL.INSTITUTION_KEYS.length; j < jlen; j += 1) {
                    const attrname = CSL.INSTITUTION_KEYS[j];
                    const attrval = thename.getAttribute(attrname);
                    if (attrval) {
                        theinstitutionpart.setAttribute(attrname, attrval);
                    }
                }
                const nameparts = thename.getElementsByTagName("name-part");
                for (let j = 0, jlen = nameparts.length; j < jlen; j += 1) {
                    if ('family' === nameparts[j].getAttribute('name')) {
                        for (let k = 0, klen = CSL.INSTITUTION_KEYS.length; k < klen; k += 1) {
                            const attrname = CSL.INSTITUTION_KEYS[k];
                            const attrval = nameparts[j].getAttribute(attrname);
                            if (attrval) {
                                theinstitutionpart.setAttribute(attrname, attrval);
                            }
                        }
                    }
                }
            }
        }
    }

    flagDateMacros(myxml) {
        let pos, len, thenode, thedate;
        let nodes = myxml.getElementsByTagName("macro");
        for (let pos = 0, len = nodes.length; pos < len; pos += 1) {
            thenode = nodes.item(pos);
            thedate = thenode.getElementsByTagName("date");
            if (thedate.length) {
                thenode.setAttribute('macro-has-date', 'true');
            }
        }
    }
}
