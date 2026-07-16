import fs from "fs";
import path from "path";

const reporters: Record<string, { path?: string; npmname?: string; location?: string[] }> = {
    "landing": {
        path: "landing"
    },
    "spec": {
        path: "spec"
    },
    "dot": {
        path: "dot"
    },
    "min": {
        path: "min"
    },
    "list": {
        path: "list"
    },
    "progress": {
        path: "progress"
    },
    "spectrum": {
        npmname: "mocha-spectrum-reporter",
        location: ["mocha-spectrum-reporter", "index"]
    },
    "nyan": {
        npmname: "nyanplusreporter",
        location: ["nyanplusreporter", "src", "nyanPlus"]
    }
};

function lookForReporter(config, nickName) {
    const locationPath = reporters[nickName].location!.join(path.sep);
    const filename = path.dirname(new URL(import.meta.url).pathname);
    var locations = [
        path.join(filename, "..", "..", locationPath),
        path.join(filename, "..", "node_modules", locationPath),
        path.join(config.path.cwd, "node_modules", locationPath)
    ]
    for (var loc of locations) {
        if (fs.existsSync(loc + ".js")) {
            reporters[nickName].path = loc
        }
    }
}

export function getReporters(config) {
    lookForReporter(config, "spectrum");
    lookForReporter(config, "nyan");
    return reporters;
}
