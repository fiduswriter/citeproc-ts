import { CSL } from '../../csl';

export function isPerson(this: any, value: any): boolean {
    if (value.literal
        || (!value.given && value.family && value.isInstitution)) {

        return false;
    } else {
        return true;
    }
};
