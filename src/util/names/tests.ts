import { CSL } from '../../csl';
/*global CSL: true */

CSL.NameOutput.prototype.isPerson = function (this: any, value: any): boolean {
    if (value.literal
        || (!value.given && value.family && value.isInstitution)) {

        return false;
    } else {
        return true;
    }
};
