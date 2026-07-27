import jurism2cslMap from './jurism2cslMap.js';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { CSL } = await import(path.join(__dirname, '../../../../citeproc.mjs'));
const DateParser = CSL.DateParser;

const CSL_DATE_VARIABLES = [
    "accessed",
    "container",
    "event-date",
    "issued",
    "original-date",
    "submitted",
    "available-date",
    "locator-date",
    "publication-date",
    "alt-issued"
];

// Encoding of names set single-field names as "name" in encoded data
// at some point. This recovers from that glitch.
function convertName(obj, fieldMode) {
    let ret: any = {};
    if (obj.fieldMode || obj.name || fieldMode) {
        ret.literal = obj.lastName ? obj.lastName : obj.name;
    } else {
        ret.given = obj.firstName;
        ret.family = obj.lastName;
    }
    return ret;
}


function convert(obj, cslData) {
    let extradata = null;
    let zObj = obj.data;
    let cObj = cslData;
    if (!cslData) {
        cObj = obj.cslItem();
    }
    cObj.multi = {
        main: {},
        _keys: {}
    }
    if (cObj.note) {
        let m = cObj.note.match(/mlzsync1:([0-9][0-9][0-9][0-9])(.*)/);
        if (m) {
            let offset = parseInt(m[1], 10);
            extradata = JSON.parse(m[2].slice(0, offset))
            cObj.note = cObj.note.slice((offset+13));
        }
    }
    if (extradata) {
        if (extradata.extracreators) {
            for (let j=0,jlen=extradata.extracreators.length;j<jlen;j++) {
                let zCreator = extradata.extracreators[j];
                zObj.creators.push(zCreator);
                let cslVarname = jurism2cslMap.fields[cObj.type][zCreator.creatorType];
                let cCreator = convertName(zCreator, zCreator.fieldMode);
                if (!cObj[cslVarname]) {
                    cObj[cslVarname] = [];
                }
                cObj[cslVarname].push(cCreator);
            }
        }
    }
    if (extradata) {
        let creatorMap = {};
        let creatorCounts = {};
        for (let j=0,jlen=zObj.creators.length;j<jlen;j++) {
            let cslVarname;
            if (zObj.creators[j].creatorType === 'author') {
                cslVarname = 'author';
            } else if (jurism2cslMap.fields[cObj.type][zObj.creators[j].creatorType]) {
                cslVarname = jurism2cslMap.fields[cObj.type][zObj.creators[j].creatorType];
            } else {
                cslVarname = zObj.creators[j].creatorType;
            }
            if (!creatorCounts[cslVarname]) {
                creatorCounts[cslVarname] = 0;
            }
            creatorMap[j] = {
                cslVarname: cslVarname,
                cslPos: creatorCounts[cslVarname]
            }
            creatorCounts[cslVarname]++;
        }
        // FIX-UPS
        if (extradata.xtype) {
            cObj.type = extradata.xtype;
            delete extradata.xtype;
            delete extradata.type;
        }
        if (extradata.extrafields) {
            for (let key in extradata.extrafields) {
                cObj[jurism2cslMap.fields[cObj.type][key]] = extradata.extrafields[key];
                delete extradata.extrafields[key];
            }
        }
        if (extradata.multifields) {
            for (let zFieldName in extradata.multifields.main) {
                let cFieldName = jurism2cslMap.fields[cObj.type][zFieldName];
                cObj.multi.main[cFieldName] = extradata.multifields.main[zFieldName];
            }
            for (let zFieldName in extradata.multifields._keys) {
                let cFieldName = jurism2cslMap.fields[cObj.type][zFieldName];
                cObj.multi._keys[cFieldName] = extradata.multifields._keys[zFieldName];
            }
        }
        if (extradata.multicreators) {
            for (let pos in extradata.multicreators) {
                let creatorData = extradata.multicreators[pos];
                for (let lang in creatorData._key) {
                    creatorData._key[lang] = convertName(creatorData._key[lang], creatorData.fieldMode);
                }
                delete creatorData.fieldMode;
                cObj[creatorMap[pos].cslVarname][creatorMap[pos].cslPos].multi = creatorData;
                
                delete extradata.multicreators[pos]
            }
        }
        for (let fieldName of CSL_DATE_VARIABLES) {
            if ("string" === typeof cObj[fieldName]) {
                cObj[fieldName] = DateParser.parseDateToArray(cObj[fieldName]);
            }
        }
        if (cObj.jurisdiction) {
            let m = cObj.jurisdiction.match(/^([0-9][0-9][0-9])/);
            if (m) {
                let offset = parseInt(m[1]);
                cObj.jurisdiction = cObj.jurisdiction.slice(3, offset + 3);

            }
        }
    }
    for (let key of CSL_DATE_VARIABLES) {
        if ("string" === typeof cObj[key]) {
            let m = cObj[key].match(/^([0-9]{4}[-.,][0-9]{1,2}[-.,][0-9]{1,2}).*/);
            if (m) {
                cObj[key] = m[1];
            }
            cObj[key] = { raw: cObj[key] };
        }
    }
    return cObj;
}

export default convert;
export { convert };
