import { CSL } from '../csl';
/*global CSL: true */

CSL.Node["#comment"] = {
    build: function (this: CslNode): void {
        // This is a comment in the CSL file.
        // Save some space in the log files -- no need to mention this, really.
        // CSL.debug("CSL processor warning: comment node reached");
    }
};
