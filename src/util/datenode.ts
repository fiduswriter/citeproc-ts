import { CSL } from '../csl';
/*global CSL: true */

CSL.Util.fixDateNode = function (this: any, parent: any, pos: any, node: any): any {
    var form: any, variable: any, datexml: any, subnode: any, partname: any, attr: any, val: any, prefix: any, suffix: any, children: any, subchildren: any, display: any, cslid: any;

    var lingo = this.cslXml.getAttributeValue(node, "lingo");

    var default_locale = this.cslXml.getAttributeValue(node, "default-locale");

    this.build.date_key = true;

    form = this.cslXml.getAttributeValue(node, "form");
    var lingo2;
    if (default_locale) {
        lingo2 = this.opt["default-locale"][0];
    } else {
        lingo2 = this.cslXml.getAttributeValue(node, "lingo");
    }

    if (!this.getDate(form, default_locale)) {
        return parent;
    }

    var dateparts = this.cslXml.getAttributeValue(node, "date-parts");

    variable = this.cslXml.getAttributeValue(node, "variable");
    prefix = this.cslXml.getAttributeValue(node, "prefix");
    suffix = this.cslXml.getAttributeValue(node, "suffix");
    display = this.cslXml.getAttributeValue(node, "display");
    cslid = this.cslXml.getAttributeValue(node, "cslid");

    datexml = this.cslXml.nodeCopy(this.getDate(form, default_locale));
    this.cslXml.setAttribute(datexml, "lingo", this.opt.lang);
    this.cslXml.setAttribute(datexml, "form", form);
    this.cslXml.setAttribute(datexml, "date-parts", dateparts);
    this.cslXml.setAttribute(datexml, "cslid", cslid);
    this.cslXml.setAttribute(datexml, "variable", variable);
    this.cslXml.setAttribute(datexml, "default-locale", default_locale);
    if (prefix) {
        this.cslXml.setAttribute(datexml, "prefix", prefix);
    }
    if (suffix) {
        this.cslXml.setAttribute(datexml, "suffix", suffix);
    }
    if (display) {
        this.cslXml.setAttribute(datexml, "display", display);
    }

    children = this.cslXml.children(datexml);
    for (let key in children) {
        subnode = children[key];
        if ("date-part" === this.cslXml.nodename(subnode)) {
            partname = this.cslXml.getAttributeValue(subnode, "name");
            if (default_locale) {
                this.cslXml.setAttributeOnNodeIdentifiedByNameAttribute(datexml, "date-part", partname, "@default-locale", "true");
            }
        }
    }

    children = this.cslXml.children(node);
    for (let key2 in children) {
        subnode = children[key2];
        if ("date-part" === this.cslXml.nodename(subnode)) {
            partname = this.cslXml.getAttributeValue(subnode, "name");
            subchildren = this.cslXml.attributes(subnode);
            for (let attr in subchildren) {
                if ("@name" === attr) {
                    continue;
                }
                if (lingo2 && lingo2 !== this.opt.lang) {
                    if (["@suffix", "@prefix", "@form"].indexOf(attr) > -1) {
                        continue;
                    }
                }
                val = subchildren[attr];
                this.cslXml.setAttributeOnNodeIdentifiedByNameAttribute(datexml, "date-part", partname, attr, val);
            }
        }
    }

    if ("year" === this.cslXml.getAttributeValue(node, "date-parts")) {
        this.cslXml.deleteNodeByNameAttribute(datexml, "month");
        this.cslXml.deleteNodeByNameAttribute(datexml, "day");
    } else if ("year-month" === this.cslXml.getAttributeValue(node, "date-parts")) {
        this.cslXml.deleteNodeByNameAttribute(datexml, "day");
    } else if ("month-day" === this.cslXml.getAttributeValue(node, "date-parts")) {
        var childNodes = this.cslXml.children(datexml);
        for (let i = 1, ilen = this.cslXml.numberofnodes(childNodes); i < ilen; i += 1) {
            if (this.cslXml.getAttributeValue(childNodes[i], "name") === "year") {
                this.cslXml.setAttribute(childNodes[i - 1], "suffix", "");
                break;
            }
        }
        this.cslXml.deleteNodeByNameAttribute(datexml, "year");
    }
    return this.cslXml.insertChildNodeAfter(parent, node, pos, datexml);
};
