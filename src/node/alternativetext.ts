import { CSL } from '../csl';
CSL.Node["alternative-text"] = {
    build: function (this: CslNode, state: CslState, target: any[]): void {
        if (this.tokentype === CSL.SINGLETON) {
            let func = function (this: CslNode, state: CslState, Item: CslItem): void {
                const item = state.refetchItem(Item.id);
                CSL.getCite.call(state, item);
            };
            this.execs.push(func);
        }
        target.push(this);
    }
};
