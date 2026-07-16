import { STATUTE_SUBDIV_PLAIN_REGEX, STATUTE_SUBDIV_PLAIN_REGEX_FRONT } from '../constants/regex';
import { STATUTE_SUBDIV_STRINGS, STATUTE_SUBDIV_STRINGS_REVERSE } from '../constants/statute';
export function remapSectionVariable(this: CslState, inputList: [CslItem, Record<string, any>][]): void {
    for (let i = 0, ilen = inputList.length; i < ilen; i += 1) {
        const Item = inputList[i][0];
        const item = inputList[i][1];

        if (["bill", "gazette", "legislation", "regulation", "treaty"].indexOf(Item.type) > -1) {
            if (item.locator) {
                item.locator = item.locator.trim();
                let m = item.locator.match(STATUTE_SUBDIV_PLAIN_REGEX_FRONT);
                if (!m) {
                    if (item.label) {
                        item.locator = STATUTE_SUBDIV_STRINGS_REVERSE[item.label] + " " + item.locator;
                    } else {
                        item.locator = "p. " + item.locator;
                    }
                }
            }
            let sectionMasterLabel = null;
            if (Item.section) {
                Item.section = Item.section.trim();
                const m2 = Item.section.match(STATUTE_SUBDIV_PLAIN_REGEX_FRONT);
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
                    const m3 = item.locator.match(/^([^ ]*)\s*(.*)/);
                    let space = " ";
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


export function setNumberLabels(this: CslState, Item: CslItem): void {
    if (Item.number
        && ["bill", "gazette", "legislation", "regulation", "treaty"].indexOf(Item.type) > -1
        && this.opt.development_extensions.consolidate_legal_items
        && !this.tmp.shadow_numbers["number"]) {

        this.tmp.shadow_numbers["number"] = {};
        this.tmp.shadow_numbers["number"].values = [];
        this.tmp.shadow_numbers["number"].plural = 0;
        this.tmp.shadow_numbers["number"].numeric = false;
        this.tmp.shadow_numbers["number"].label = false;

        let value = "" + Item.number;
        value = value.split("\\").join("");
        const firstword = value.split(/\s+/)[0];
        const firstlabel = STATUTE_SUBDIV_STRINGS[firstword];
        if (firstlabel) {
            const splt = value.split(STATUTE_SUBDIV_PLAIN_REGEX);
            if (splt.length > 1) {
                const lst = [];
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
