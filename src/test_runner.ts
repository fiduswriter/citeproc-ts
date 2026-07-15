import { CSL } from './csl';
const StdRhinoTest = function(myname,engineNickname){
    this.myname = myname;
    this.engineNickname = engineNickname;
    this._cache = {};
    this._acache = {};
    this._acache["default"] = new CSL.AbbreviationSegments();
    this._ids = [];
    this.test = {};
    if (myname){
        let test;
        if (this.engineNickname == "rhino") {
            test = readFile("./tests/fixtures/run/machines/" + myname + ".json", "UTF-8");
        } else if (this.engineNickname == "jsc") {
            test = readFile("./tests/fixtures/run/machines/" + myname + ".json");
        } else if (this.engineNickname === "mozjs") {
            test = snarf("./tests/fixtures/run/machines/" + myname + ".json", "UTF-8");
        } else if (this.engineNickname == "v8") {
            test = read("./tests/fixtures/run/machines/" + myname + ".json");
        } else {
            print("Aiyeeee!");
        }
        eval( "this.test = "+test);
        this.result = this.test.result;
        this._setCache();
    }
};

// Retrieve properly composed item from phoney database.
// (Deployments MUST provide an instance object with
// this method.)
StdRhinoTest.prototype.retrieveItem = function(id){
    return this._cache[id];
};

// Retrieve locale object from filesystem
// (Deployments MUST provide an instance object with
// this method.)
StdRhinoTest.prototype.retrieveLocale = function(lang){
    let ret;
    try {
        ret = null;
        if (this.engineNickname == "rhino") {
            ret = readFile("./locale/locales-"+lang+".xml", "UTF-8");
        } else if (this.engineNickname == "jsc") {
            ret = readFile("./locale/locales-"+lang+".xml");
        } else if (this.engineNickname === "mozjs") {
            ret = snarf("./locale/locales-"+lang+".xml", "UTF-8");
        } else if (this.engineNickname == "v8") {
            ret = read("./locale/locales-"+lang+".xml");
        }
        ret = ret.replace(/\s*<\?[^>]*\?>\s*\n/g, "");
    } catch (e) {
        ret = false;
    }
    if (this.engineNickname == "rhino") {
        if (ret) {
            ret = CSL.stripXmlProcessingInstruction(ret);
            ret = XML(ret);
        } else {
            ret = false;
        }
    }
    return ret;
};

// Retrieve style module, for law support
// (Deployments MAY provide an instance object with
// this method.)
StdRhinoTest.prototype.retrieveStyleModule = function(jurisdiction, preference) {
    let ret = null;
    if (this.submode.nojuris) {
        return ret;
    }
    let id: any = [jurisdiction];
    if (preference) {
        id.push(preference);
    }
    id = id.join("-");
    try {
        if (this.engineNickname == "rhino") {
            ret = readFile("./tests/fixtures/local/styles/juris-" + id + ".csl", "UTF-8");
        } else if (this.engineNickname == "jsc") {
            ret = readFile("./tests/fixtures/local/styles/juris-" + id + ".csl");
        } else if (this.engineNickname === "mozjs") {
            ret = snarf("./tests/fixtures/local/styles/juris-" + id + ".csl", "UTF-8");
        } else if (this.engineNickname == "v8") {
            ret = read("./tests/fixtures/local/styles/juris-" + id + ".csl");
        }
    } catch (e) {}
    if (this.engineNickname == "rhino") {
        if (ret) {
            ret = CSL.stripXmlProcessingInstruction(ret);
            ret = XML(ret);
        } else {
            ret = false;
        }
    }
    return ret;
};

StdRhinoTest.prototype.getAbbreviation = function(dummyListNameVar, obj, jurisdiction, category, key){
    if (!this._acache[jurisdiction]) {
        this._acache[jurisdiction] = new CSL.AbbreviationSegments();
    }
    if (!obj[jurisdiction]) {
        obj[jurisdiction] = new CSL.AbbreviationSegments();
    }    
    const jurisdictions = ["default"];
    if (jurisdiction !== "default") {
        jurisdictions.push(jurisdiction);
    }
    jurisdictions.reverse();
    let haveHit = false;
    for (let i = 0, ilen = jurisdictions.length; i < ilen; i += 1) {
        const myjurisdiction = jurisdictions[i];
        if (this._acache[myjurisdiction][category][key]) {
            obj[myjurisdiction][category][key] = this._acache[myjurisdiction][category][key];
            jurisdiction = myjurisdiction;
            haveHit = true;
            break;
        }
    }
    return jurisdiction;
};

StdRhinoTest.prototype.addAbbreviation = function(jurisdiction,category,key,val){
    if (!this._acache[jurisdiction]) {
        this._acache[jurisdiction] = new CSL.AbbreviationSegments();
    }
    this._acache[jurisdiction][category][key] = val;
};

// Build phoney database.
StdRhinoTest.prototype._setCache = function(){
    for (let i=0,ilen=this.test.input.length;i<ilen;i++) {
        const item = this.test.input[i];
        this._cache[item.id] = item;
        this._ids.push(item.id);
    }
};


StdRhinoTest.prototype._readTest = function(){
    let test, ret;
    const filename = "std/machines/" + this.myname + ".json";
    
    const teststring = null;
    if (this.engineNickname == "rhino") {
        ret = readFile(filename, "UTF-8");
    } else if (this.engineNickname == "jsc") {
        ret = readFile(filename);
    } else if (this.engineNickname === "mozjs") {
        ret = snarf(filename, "UTF-8");
    } else if (this.engineNickname == "v8") {
        ret = read(filename);
    }

    // Grab test data in an object.
    try {
        eval( "test = "+teststring );
    } catch(e){
        throw e + teststring;
    }
    this.test = test;
};

StdRhinoTest.prototype.updateDoc = function() {
    let data, result;
    for (let i=0,ilen=this.test.citations.length;i<ilen;i++) {
        let citation = this.test.citations[i];
        [data, result] = this.style.processCitationCluster(citation[0], citation[1], citation[2]);
        // To get the indexes right, we have to do removals first.
        for (let j=this.doc.length-1; j>-1; j--) {
            const citationID = this.doc[j].citationID;
            if (!this.style.registry.citationreg.citationById[citationID]) {
                this.doc = this.doc.slice(0, j).concat(this.doc.slice(j + 1));
            }
        }
        // Reset prefixes of any elements that exist in doc.
        for (let j in this.doc) {
            this.doc[j].prefix = "..";
        }
        // If citationID matches in doc, just replace the existing one.
        for (let j in result) {
            const insert = result[j];
            for (let k in this.doc) {
                const cite = this.doc[k];
                if (cite.citationID === insert[2]) {
                    // replace cite with insert, somehow
                    this.doc[k] = {
                        prefix: ">>",
                        citationID: cite.citationID,
                        String: insert[1]
                    };
                    result[j] = null;
                    break;
                }
            }
        }
        // For citationIDs that don't yet exist in doc, insert at the specified index locations.
        for (let j in result) {
            const insert = result[j];
            if (!insert) {
                continue;
            }
            this.doc = this.doc.slice(0, insert[0]).concat([
                {
                    prefix: ">>",
                    citationID: insert[2],
                    String: insert[1]
                }
            ]).concat(this.doc.slice(insert[0]));
        }
    }
};

StdRhinoTest.prototype.run = function(){
    //print("-->"+this.myname);
    // print(this.myname);
    let len, pos, ret, id_set;
    ret = [];

    function variableWrapper(params, prePunct, str, postPunct) {
        //print(JSON.stringify(params,null,2));
        if (params.variableNames[0] === 'title' 
            && params.itemData.URL 
            && params.context === "citation" 
            && params.position === "first") {

            return prePunct + '<a href="' + params.itemData.URL + '">' + str + '</a>' + postPunct;
        } else if (params.variableNames[0] === 'first-reference-note-number' 
                   && params.context === "citation" 
                   && params.position !== "first") {

            return prePunct + '<b>' + str + '</b>' + postPunct;
        } else {
            return (prePunct + str + postPunct);
        }
    }


    // this.csl_reverse_lookup_support = true;

    if (this.test.options.variableWrapper) {
        this.variableWrapper = variableWrapper;
    }
    const lang_bases_needed = {};
    for (let lang in CSL.LANGS) {
        const lang_base = lang.split("-")[0];
        lang_bases_needed[lang_base] = true;
    } 
    for (let lang_base in lang_bases_needed) {
        if (!CSL.LANG_BASES[lang_base]) {
            throw "ERROR: missing in CSL.LANG_BASES: " + lang_base;
        }
    }
    let testCSL = this.test.csl;
    if (this.engineNickname == "rhino") {
        testCSL = CSL.stripXmlProcessingInstruction(this.test.csl);
        testCSL = XML(testCSL);
    }
    this.style = new CSL.Engine(this,testCSL);
    this.style.fun.dateparser.addDateParserMonths(["ocak", "Şubat", "mart", "nisan", "mayıs", "haziran", "temmuz", "ağustos", "eylül", "ekim", "kasım", "aralık", "bahar", "yaz", "sonbahar", "kış"]);

    const mode = this.test.mode.split("-");
    this.submode = {};
    for (let i=1,ilen=mode.length;i<ilen;i++) {
        this.submode[mode[i]] = true;
    }
    this.test.mode = mode[0];

    if (this.submode["rtf"]) {
        this.style.setOutputFormat("rtf");
    }
    if (this.submode["plain"]) {
        this.style.setOutputFormat("plain");
    }
    if (this.submode["asciidoc"]) {
        this.style.setOutputFormat("asciidoc");
    }
    if (this.submode["xslfo"]) {
        this.style.setOutputFormat("xslfo");
    }
    for (let opt in this.test.options) {
        if (opt === "variableWrapper") {
            continue;
        }
        this.style.opt.development_extensions[opt] = this.test.options[opt];
    }

    

    //this.style.opt.development_extensions.thin_non_breaking_space_html_hack = true;
    //this.style.opt.development_extensions.wrap_url_and_doi = true;
    const langParams = {
        persons:["translit"],
        institutions:["translit"],
        titles:["translit", "translat"],
        journals:['translit'],
        publishers:["translat"],
        places:["translat"]
    };
    if (this.test.langparams) {
        for (let key in this.test.langparams) {
            langParams[key] = this.test.langparams[key];
        }
    }
    this.style.setLangPrefsForCites(langParams);
    if (this.test.multiaffix) {
        this.style.setLangPrefsForCiteAffixes(this.test.multiaffix);
    }
    if (this.test.abbreviations) {
        for (let jurisdiction in this.test.abbreviations) {
            for (let field in this.test.abbreviations[jurisdiction]) {
                for (let key in this.test.abbreviations[jurisdiction][field]) {
                    this.addAbbreviation(jurisdiction,field,key,this.test.abbreviations[jurisdiction][field][key]);
                }
            }
        }
    }

    if (this.test.bibentries){
        for (let i=0,ilen=this.test.bibentries.length;i<ilen;i++) {
            const id_set = this.test.bibentries[i];
            this.style.updateItems(id_set, this.submode["nosort"]);
        }
    } else if (!this.test.citations) {
        this.style.updateItems(this._ids, this.submode["nosort"]);
    }
    if (!this.test.citation_items && !this.test.citations){
        let citation = [];
        for (let i=0,ilen=this.style.registry.reflist.length;i<ilen;i++) {
            const item = this.style.registry.reflist[i];
            citation.push({"id":item.id});
        }
        this.test.citation_items = [citation];
    }
    let citations = [];
    if (this.test.citation_items){
        for (let i=0,ilen=this.test.citation_items.length;i<ilen;i++) {
            let citation = this.test.citation_items[i];
            citations.push(this.style.makeCitationCluster(citation));
        }
    } else if (this.test.citations){
        this.doc = [];
        this.updateDoc();
        if (this.test.input2) {
            this.test.input = this.test.input2;
            this._setCache();
            this.updateDoc();
        }
        citations = this.doc.map(function(elem, idx) {
            return elem.prefix + "[" + idx + "] " + elem.String;
        });
    }
    ret = citations.join("\n");
    if (this.test.mode == "bibliography" && !this.submode["header"]){
        if (this.test.bibsection){
            let ret = this.style.makeBibliography(this.test.bibsection);
        } else {
            let ret = this.style.makeBibliography();
        }
        ret = ret[0]["bibstart"] + ret[1].join("") + ret[0]["bibend"];
    } else if (this.test.mode == "bibliography" && this.submode["header"]){
        const obj = this.style.makeBibliography()[0];
        const lst = [];
        for (let key in obj) {
            const keyval = [];
            keyval.push(key);
            keyval.push(obj[key]);
            lst.push(keyval);
        }
        lst.sort(
            function (a, b) {
                if (a > b) {
                    return 1;
                } else if (a < b) {
                    return -1;
                } else {
                    return 0;
                }
            }
        );
        ret = "";
        for (let pos = 0, len = lst.length; pos < len; pos += 1) {
            ret += lst[pos][0] + ": " + lst[pos][1] + "\n";
        }
        ret = ret.replace(/^\s+/,"").replace(/\s+$/,"");
    }
    if (this.test.mode !== "bibliography" && this.test.mode !== "citation") {
        throw "Invalid mode in test file "+this.myname+": "+this.test.mode;
    }
    return ret;
};

