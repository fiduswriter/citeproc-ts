import { getCite } from '../engine/cite';

import { SINGLETON } from '../constants/core';
export const Node_alternative_text = {
    build: function (this: CslNode, state: CslState, target: any[]): void {
        if (this.tokentype === SINGLETON) {
            let func = function (this: CslNode, state: CslState, Item: CslItem): void {
                const item = state.refetchItem(Item.id);
                getCite.call(state, item);
            };
            this.execs.push(func);
        }
        target.push(this);
    }
};
