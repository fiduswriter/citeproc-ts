export const Node_name_part = {
    build: function (this: CslNode, state: CslState): void {
        state.build[this.strings.name] = this;
    }
};
