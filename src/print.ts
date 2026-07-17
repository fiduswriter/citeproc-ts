import { internals } from './util/internals';

internals.debug = function (str: string): void {
    console.log("CSL: " + str);
};
internals.error = function (str: string): void {
    console.log("CSL error: " + str);
};
