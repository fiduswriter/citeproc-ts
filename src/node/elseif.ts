import { CSL } from '../csl';

export const Node_else_if = {
    build: function (this: CslNode, state: CslState, target: any[]): void {
        CSL.Conditions.TopNode.call(this, state, target);
        target.push(this);
    },
    configure: function (this: CslNode, state: CslState, pos: number): void {
        CSL.Conditions.Configure.call(this, state, pos);
    }
};
