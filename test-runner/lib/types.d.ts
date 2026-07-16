/** Test-runner specific type declarations. */

interface ConfigPath {
    /** Whether / where style tests are stored */
    styletests: string | false;
    local: string | false;
    std: string | false;
    src: string | false;
    locale: string | false;
    abbrevs: string | false;
    modules: string | false;
    cslschema: string | false;
    cslmschema: string | false;
    configdir: string;
    cwd: string;
    scriptdir: string;
    fixturedir: string;
    chai: string;
    mocha: string;
    projectRoot: string;
    jurisAbbrevPath?: string;
    [key: string]: any;
}

interface TestRunnerConfig {
    path: ConfigPath;
    mode: "styleMode" | "fullMode";
    styleCapabilities?: StyleCapabilitySet;
    testData?: Record<string, any>;
    groupID?: number;
    [key: string]: any;
}

interface StyleCapabilitySet {
    styleID: string;
    styleName: string;
    bibliography: boolean;
    ibid?: boolean;
    position?: boolean;
    backref?: boolean;
    jurisdictionPreference: string[];
    defaultLocale: string;
    log: string[];
    [key: string]: any;
}

interface TestFixture {
    NAME: string;
    CSL: string;
    INPUT: CslItem[];
    MODE?: string;
    CITATIONS?: any[][];
    OPTIONS?: Record<string, any>;
    BIBENTRIES?: string[][];
    ABBREVIATIONS?: Record<string, any>;
    LANGPARAMS?: Record<string, any>;
    MULTIAFFIX?: Record<string, any>;
    "CITATION-ITEMS"?: any[];
    INPUT2?: CslItem[];
    BIBSECTION?: any;
    KEYS?: string[];
    DESCRIPTION?: string;
    RESULT?: string;
    PATH?: string;
    submode?: Record<string, boolean>;
    [key: string]: any;
}
