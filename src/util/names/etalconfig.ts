import { CSL } from '../../csl';

export function getEtAlConfig(this: any): void {
    let item = this.item;
    this["et-al"] = {};

    this.state.output.append(this.etal_term, this.etal_style, true);
    this["et-al"].single = this.state.output.pop();
    this["et-al"].single.strings.suffix = this.etal_suffix;
    this["et-al"].single.strings.prefix = this.etal_prefix_single;

    this.state.output.append(this.etal_term, this.etal_style, true);
    this["et-al"].multiple = this.state.output.pop();
    this["et-al"].multiple.strings.suffix = this.etal_suffix;
    this["et-al"].multiple.strings.prefix = this.etal_prefix_multiple;

    if ("undefined" === typeof item) {
        item = {};
    }

    if (item.position) {
        if (this.state.inheritOpt(this.name, "et-al-subsequent-min")) {
            this.etal_min = this.state.inheritOpt(this.name, "et-al-subsequent-min");
        } else {
            this.etal_min = this.state.inheritOpt(this.name, "et-al-min");
        }
        if (this.state.inheritOpt(this.name, "et-al-subsequent-use-first")) {
            this.etal_use_first = this.state.inheritOpt(this.name, "et-al-subsequent-use-first");
        } else {
            this.etal_use_first = this.state.inheritOpt(this.name, "et-al-use-first");
        }
    } else {
        if (this.state.tmp["et-al-min"]) {
            this.etal_min = this.state.tmp["et-al-min"];
        } else {
            this.etal_min = this.state.inheritOpt(this.name, "et-al-min");
        }
        if (this.state.tmp["et-al-use-first"]) {
            this.etal_use_first = this.state.tmp["et-al-use-first"];
        } else {
            this.etal_use_first = this.state.inheritOpt(this.name, "et-al-use-first");
        }
        if ("boolean" === typeof this.state.tmp["et-al-use-last"]) {
            this.etal_use_last = this.state.tmp["et-al-use-last"];
        } else {
            this.etal_use_last = this.state.inheritOpt(this.name, "et-al-use-last");
        }
    }
    if (!this.state.tmp["et-al-min"]) {
        this.state.tmp["et-al-min"] = this.etal_min;
    }
};
