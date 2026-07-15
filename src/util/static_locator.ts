import { CSL } from '../csl';
CSL.Engine.prototype.remapSectionVariable = function (this: any, inputList: any): void {
    for (let i = 0, ilen = inputList.length; i < ilen; i += 1) {
        var Item = inputList[i][0];
        var item = inputList[i][1];

        if (["bill", "gazette", "legislation", "regulation", "treaty"].indexOf(Item.type) > -1) {
            if (item.locator) {
                item.locator = item.locator.trim();
                let m = item.locator.match(CSL.STATUTE_SUBDIV_PLAIN_REGEX_FRONT);
                if (!m) {
                    if (item.label) {
                        item.locator = CSL.STATUTE_SUBDIV_STRINGS_REVERSE[item.label] + " " + item.locator;
                    } else {
                        item.locator = "p. " + item.locator;
                    }
                }
            }
            var sectionMasterLabel = null;
            if (Item.section) {
                Item.section = Item.section.trim();
                var m2 = Item.section.match(CSL.STATUTE_SUBDIV_PLAIN_REGEX_FRONT);
                if (!m2) {
                    Item.section = "sec. " + Item.section;
                    sectionMasterLabel = "sec.";
                } else {
                    sectionMasterLabel = m2[0].trim();
                }
            }
            if (Item.section) {
                if (!item.locator) {
                    item.locator = Item.section;
                } else {
                    var m3 = item.locator.match(/^([^ ]*)\s*(.*)/);
                    var space = " ";
                    if (m3) {
                        if (m3[1] === "p." && sectionMasterLabel !== "p.") {
                            item.locator = m3[2];
                        }
                        if (["[", "(", ".", ",", ";", ":", "?"].indexOf(item.locator.slice(0, 1)) > -1) {
                            space = "";
                        }
                    } else {
                        space = "";
                    }
                    item.locator = Item.section + space + item.locator;
                }
                //Item.section = "";
            }
            item.label = "";
        }
    }
};


CSL.Engine.prototype.setNumberLabels = function (this: any, Item: CslItem): void {
    if (Item.number
        && ["bill", "gazette", "legislation", "regulation", "treaty"].indexOf(Item.type) > -1
        && this.opt.development_extensions.consolidate_legal_items
        && !this.tmp.shadow_numbers["number"]) {

        this.tmp.shadow_numbers["number"] = {};
        this.tmp.shadow_numbers["number"].values = [];
        this.tmp.shadow_numbers["number"].plural = 0;
        this.tmp.shadow_numbers["number"].numeric = false;
        this.tmp.shadow_numbers["number"].label = false;

        var value = "" + Item.number;
        value = value.split("\\").join("");
        var firstword = value.split(/\s+/)[0];
        var firstlabel = CSL.STATUTE_SUBDIV_STRINGS[firstword];
        if (firstlabel) {
            var splt = value.split(CSL.STATUTE_SUBDIV_PLAIN_REGEX);
            if (splt.length > 1) {
                var lst = [];
                for (let j = 1, jlen = splt.length; j < jlen; j += 1) {
                    lst.push(splt[j].replace(/\s*$/, "").replace(/^\s*/, ""));
                }
                value = lst.join(" ");
            } else {
                value = splt[0];
            }
            this.tmp.shadow_numbers["number"].label = firstlabel;
            this.tmp.shadow_numbers["number"].values.push(["Blob", value, false]);
            this.tmp.shadow_numbers["number"].numeric = false;
        } else {
            this.tmp.shadow_numbers["number"].values.push(["Blob", value, false]);
            this.tmp.shadow_numbers["number"].numeric = true;
        }
    }
};
