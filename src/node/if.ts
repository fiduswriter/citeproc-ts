import { Conditions } from '../util/conditions';

export const Node_if = {
    build: function (this: CslNode, state: CslState, target: any[]): void {
        Conditions.TopNode.call(this, state, target);
        target.push(this);
    },
    configure: function (this: CslNode, state: CslState, pos: number): void {
        Conditions.Configure.call(this, state, pos);
    }
};
