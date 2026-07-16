import { CSL } from '../csl';
import { Suffixator, Romanizer, Ordinalizer, LongOrdinalizer } from '../util/number';

import { ASCENDING, LITERAL, NONE, SUFFIX_CHARS } from '../constants/core';
export class Opt {
    [key: string]: any;

    parallel!: { enable: boolean; parallel_delimiter?: string };
    has_disambiguate!: boolean;
    mode!: string;
    dates!: any;
    jurisdictions_seen!: Record<string, boolean>;
    suppressedJurisdictions!: Record<string, boolean>;
    inheritedAttributes!: any;
    "locale-sort"!: string[];
    "locale-translit"!: string[];
    "locale-translat"!: string[];
    citeAffixes!: any;
    "default-locale"!: string[];
    update_mode!: number;
    bib_mode!: number;
    sort_citations!: boolean;
    "et-al-min"!: number;
    "et-al-use-first"!: number;
    "et-al-use-last"!: boolean;
    "et-al-subsequent-min"!: number | boolean;
    "et-al-subsequent-use-first"!: number | boolean;
    "demote-non-dropping-particle"!: string;
    "parse-names"!: boolean;
    "katakana-display"!: string;
    citation_number_slug!: boolean | string;
    trigraph!: string;
    nodenames!: string[];
    gender!: Record<string, string>;
    "cite-lang-prefs"!: any;
    has_layout_locale!: boolean;
    disable_duplicate_year_suppression!: string[];
    use_context_condition!: boolean;
    jurisdiction_fallbacks!: Record<string, string>;
    development_extensions!: Record<string, any>;
    xclass!: string;
    styleID!: string;
    availableAbbrevDomains!: Record<string, string[]>;
    require_comma_on_symbol!: string;
    "default-locale-sort"!: string[];
    lang!: string;
    citation_number_sort!: boolean;
    grouped_sort!: boolean;
    use_parallel_delimiter?: boolean;
    area?: string;

    constructor() {
        this.parallel = {
            enable: false,
        },
        this.has_disambiguate = false;
        this.mode = "html";
        this.dates = {};
        this.jurisdictions_seen = {};
        this.suppressedJurisdictions = {};
        this.inheritedAttributes = {};
        this["locale-sort"] = [];
        this["locale-translit"] = [];
        this["locale-translat"] = [];
        this.citeAffixes = {
            persons:{
                "locale-orig":{
                    prefix:"",
                    suffix:""
                },
                "locale-translit":{
                    prefix:"",
                    suffix:""
                },
                "locale-translat":{
                    prefix:"",
                    suffix:""
                }
            },
            institutions:{
                "locale-orig":{
                    prefix:"",
                    suffix:""
                },
                "locale-translit":{
                    prefix:"",
                    suffix:""
                },
                "locale-translat":{
                    prefix:"",
                    suffix:""
                }
            },
            titles:{
                "locale-orig":{
                    prefix:"",
                    suffix:""
                },
                "locale-translit":{
                    prefix:"",
                    suffix:""
                },
                "locale-translat":{
                    prefix:"",
                    suffix:""
                }
            },
            journals:{
                "locale-orig":{
                    prefix:"",
                    suffix:""
                },
                "locale-translit":{
                    prefix:"",
                    suffix:""
                },
                "locale-translat":{
                    prefix:"",
                    suffix:""
                }
            },
            publishers:{
                "locale-orig":{
                    prefix:"",
                    suffix:""
                },
                "locale-translit":{
                    prefix:"",
                    suffix:""
                },
                "locale-translat":{
                    prefix:"",
                    suffix:""
                }
            },
            places:{
                "locale-orig":{
                    prefix:"",
                    suffix:""
                },
                "locale-translit":{
                    prefix:"",
                    suffix:""
                },
                "locale-translat":{
                    prefix:"",
                    suffix:""
                }
            }
        };
        this["default-locale"] = [];
        this.update_mode = NONE;
        this.bib_mode = NONE;
        this.sort_citations = false;

        this["et-al-min"] = 0;
        this["et-al-use-first"] = 1;
        this["et-al-use-last"] = false;
        this["et-al-subsequent-min"] = false;
        this["et-al-subsequent-use-first"] = false;

        this["demote-non-dropping-particle"] = "display-and-sort";
        this["parse-names"] = true;

        this["katakana-display"] = "normal-order";

        this.citation_number_slug = false;
        this.trigraph = "Aaaa00:AaAa00:AaAA00:AAAA00";

        this.nodenames = [];

        this.gender = {};
        this['cite-lang-prefs'] = {
            persons:['orig'],
            institutions:['orig'],
            titles:['orig'],
            journals:['orig'],
            publishers:['orig'],
            places:['orig'],
            number:['orig']
        };

        this.has_layout_locale = false;
        this.disable_duplicate_year_suppression = [];
        this.use_context_condition = false;

        this.jurisdiction_fallbacks = {};

        this.development_extensions = {};
        this.development_extensions.field_hack = true;
        this.development_extensions.allow_field_hack_date_override = true;
        this.development_extensions.locator_date_and_revision = true;
        this.development_extensions.locator_label_parse = true;
        this.development_extensions.raw_date_parsing = true;
        this.development_extensions.clean_up_csl_flaws = true;
        this.development_extensions.consolidate_legal_items = false;
        this.development_extensions.csl_reverse_lookup_support = false;
        this.development_extensions.wrap_url_and_doi = false;
        this.development_extensions.thin_non_breaking_space_html_hack = false;
        this.development_extensions.apply_citation_wrapper = false;
        this.development_extensions.main_title_from_short_title = false;
        this.development_extensions.uppercase_subtitles = false;
        this.development_extensions.normalize_lang_keys_to_lowercase = false;
        this.development_extensions.strict_text_case_locales = false;
        this.development_extensions.expect_and_symbol_form = false;
        this.development_extensions.require_explicit_legal_case_title_short = false;
        this.development_extensions.spoof_institutional_affiliations = false;
        this.development_extensions.force_jurisdiction = false;
        this.development_extensions.parse_names = true;
        this.development_extensions.hanging_indent_legacy_number = false;
        this.development_extensions.throw_on_empty = false;
        this.development_extensions.strict_inputs = true;
        this.development_extensions.prioritize_disambiguate_condition = false;
        this.development_extensions.force_short_title_casing_alignment = true;
        this.development_extensions.implicit_short_title = false;
        this.development_extensions.force_title_abbrev_fallback = false;
        this.development_extensions.split_container_title = false;
        this.development_extensions.legacy_institution_name_ordering = false;
        this.development_extensions.etal_min_etal_usefirst_hack = false;
    }
}

export class Tmp {
    [key: string]: any;

    names_max!: any;
    names_base!: any;
    givens_base!: any;
    value!: any[];
    namepart_decorations!: any;
    namepart_type!: boolean | string;
    area!: string;
    root!: string;
    extension!: string;
    can_substitute!: any;
    element_rendered_ok!: boolean;
    element_trace!: any;
    nameset_counter!: number;
    group_context!: any;
    term_predecessor!: boolean;
    in_cite_predecessor!: boolean;
    jump!: any;
    decorations!: any;
    tokenstore_stack!: any;
    last_suffix_used!: string;
    last_names_used!: string[];
    last_years_used!: string[];
    years_used!: string[];
    names_used!: string[];
    taintedItemIDs!: Record<string, boolean>;
    taintedCitationIDs!: Record<string, boolean>;
    initialize_with!: any;
    disambig_request!: boolean | any;
    "name-as-sort-order"!: boolean | string;
    suppress_decorations!: boolean;
    disambig_settings!: any;
    bib_sort_keys!: string[];
    prefix!: any;
    suffix!: any;
    delimiter!: any;
    cite_locales!: string[];
    cite_affixes!: any;
    strip_periods!: number;
    shadow_numbers!: Record<string, boolean>;
    authority_stop_last!: number;
    loadedItemIDs!: Record<string, boolean>;
    condition_counter!: number;
    condition_lang_val_arr!: string[];
    condition_lang_counter_arr!: number[];
    just_looking?: boolean;
    just_did_number?: boolean;
    first_name_string?: string;
    name_node?: any;
    done_vars?: string[];
    last_primary_names_string?: string;
    have_collapsed?: boolean;
    use_cite_group_delimiter?: boolean;
    sort_key_flag?: boolean;
    label_blob?: any;
    etal_node?: any;
    etal_term?: any;
    rendered_name?: any[];
    offset_characters?: number;
    count_offset_characters?: boolean | number;
    term_predecessor_name?: boolean;
    name_delimiter?: string;
    probably_rendered_something?: boolean;
    authorstring_request?: boolean;
    lang_array?: string[];
    multi_layout?: boolean;
    "publisher-list"?: boolean;
    "publisher-token"?: any;
    "publisher-place-token"?: any;
    "doing-macro-with-date"?: boolean;
    citation_pos?: number;
    citation_note_index?: number;
    citation_id?: string;
    citation_errors?: string[];
    splice_delimiter?: string;
    can_block_substitute?: boolean;
    subsequent_author_substitute_ok?: boolean;
    common_term_match_fail?: boolean;
    disambig_override?: boolean;
    abort_output?: boolean;
    abbrev_trimmer?: any;
    strip_periods_tag?: string;

    constructor() {
        this.names_max = new CSL.Stack();
        this.names_base = new CSL.Stack();
        this.givens_base = new CSL.Stack();

        this.value = [];
        this.namepart_decorations = {};
        this.namepart_type = false;

        this.area = "citation";
        this.root = "citation";
        this.extension = "";

        this.can_substitute = new CSL.Stack(0, LITERAL);

        this.element_rendered_ok = false;

        this.element_trace = new CSL.Stack("style");

        this.nameset_counter = 0;

        this.group_context = new CSL.Stack({
            term_intended: false,
            variable_attempt: false,
            variable_success: false,
            output_tip: undefined,
            label_form:  undefined,
            parallel_first: undefined,
            parallel_last: undefined,
            parallel_delimiter_override: undefined,
            condition: false,
            force_suppress: false,
            done_vars: []
        });

        this.term_predecessor = false;

        this.in_cite_predecessor = false;

        this.jump = new CSL.Stack(0, LITERAL);

        this.decorations = new CSL.Stack();

        this.tokenstore_stack = new CSL.Stack();

        this.last_suffix_used = "";
        this.last_names_used = [];
        this.last_years_used = [];
        this.years_used = [];
        this.names_used = [];

        this.taintedItemIDs = {};
        this.taintedCitationIDs = {};

        this.initialize_with = new CSL.Stack();

        this.disambig_request = false;

        this["name-as-sort-order"] = false;

        this.suppress_decorations = false;

        this.disambig_settings = new CSL.AmbigConfig();

        this.bib_sort_keys = [];

        this.prefix = new CSL.Stack("", LITERAL);

        this.suffix = new CSL.Stack("", LITERAL);

        this.delimiter = new CSL.Stack("", LITERAL);

        this.cite_locales = [];
        this.cite_affixes = {
            citation: false,
            bibliography: false,
            citation_sort: false,
            bibliography_sort: false
        };
        this.strip_periods = 0;
        this.shadow_numbers = {};
        this.authority_stop_last = 0;
        this.loadedItemIDs = {};

        this.condition_counter = 0;
        this.condition_lang_val_arr = [];
        this.condition_lang_counter_arr = [];
    }
}

export class Fun {
    [key: string]: any;

    match!: any;
    suffixator!: any;
    romanizer!: any;
    ordinalizer!: any;
    long_ordinalizer!: any;
    dateparser!: any;
    flipflopper!: any;
    decorate!: any;

    constructor(state: any) {
        this.match = new CSL.Util.Match();

        this.suffixator = new Suffixator(SUFFIX_CHARS);

        this.romanizer = new Romanizer();

        this.ordinalizer = new Ordinalizer(state);

        this.long_ordinalizer = new LongOrdinalizer();
    }
}

export class Build {
    [key: string]: any;

    "alternate-term"!: boolean;
    in_bibliography!: boolean;
    in_style!: boolean;
    skip!: boolean;
    postponed_macro!: boolean | string;
    layout_flag!: boolean;
    name!: boolean | any;
    names_variables!: string[][];
    name_label!: Record<string, any>[];
    form!: boolean | string;
    term!: boolean | string;
    macro!: Record<string, any>;
    macro_stack!: string[];
    text!: boolean;
    lang!: boolean | string;
    area!: string;
    root!: string;
    extension!: string;
    substitute_level!: any;
    names_level!: number;
    render_nesting_level!: number;
    render_seen!: boolean;
    bibliography_key_pos!: number;

    constructor() {
        this["alternate-term"] = false;

        this.in_bibliography = false;

        this.in_style = false;

        this.skip = false;

        this.postponed_macro = false;

        this.layout_flag = false;

        this.name = false;
        this.names_variables = [[]];
        this.name_label = [{}];

        this.form = false;
        this.term = false;

        this.macro = {};

        this.macro_stack = [];

        this.text = false;

        this.lang = false;

        this.area = "citation";
        this.root = "citation";
        this.extension = "";

        this.substitute_level = new CSL.Stack(0, LITERAL);
        this.names_level = 0;
        this.render_nesting_level = 0;
        this.render_seen = false;
        this.bibliography_key_pos = 0;
    }
}

export class Configure {
    [key: string]: any;

    constructor() {
        this.tests = [];
        this.fail = [];
        this.succeed = [];
    }
}

export class Citation {
    [key: string]: any;

    constructor(state: any) {
        this.opt = {
            inheritedAttributes: {}
        };

        this.tokens = [];
        this.srt = new CSL.Registry.Comparifier(state, "citation_sort");

        this.opt.collapse = [];

        this.opt["disambiguate-add-names"] = false;
        this.opt["disambiguate-add-givenname"] = false;
        this.opt["disambiguate-add-year-suffix"] = false;
        this.opt["givenname-disambiguation-rule"] = "by-cite";
        this.opt["near-note-distance"] = 5;

        this.opt.topdecor = [];
        this.opt.layout_decorations = [];
        this.opt.layout_prefix = "";
        this.opt.layout_suffix = "";
        this.opt.layout_delimiter = "";

        this.opt.sort_locales = [];
        this.opt.max_number_of_names = 0;
        this.root = "citation";
    }
}

export class Bibliography {
    [key: string]: any;

    constructor() {
        this.opt = {
            inheritedAttributes: {}
        };
        this.tokens = [];

        this.opt.collapse = [];

        this.opt.topdecor = [];
        this.opt.layout_decorations = [];
        this.opt.layout_prefix = "";
        this.opt.layout_suffix = "";
        this.opt.layout_delimiter = "";
        this.opt["line-spacing"] = 1;
        this.opt["entry-spacing"] = 1;

        this.opt.sort_locales = [];
        this.opt.max_number_of_names = 0;
        this.root = "bibliography";
    }
}

export class BibliographySort {
    [key: string]: any;

    constructor() {
        this.tokens = [];
        this.opt = {};
        this.opt.sort_directions = [];
        this.opt.topdecor = [];
        this.opt.citation_number_sort_direction = ASCENDING;
        this.opt.citation_number_secondary = false;
        this.tmp = {};
        this.keys = [];
        this.root = "bibliography";
    }
}

export class CitationSort {
    [key: string]: any;

    constructor() {
        this.tokens = [];
        this.opt = {};
        this.opt.sort_directions = [];
        this.keys = [];
        this.opt.topdecor = [];
        this.root = "citation";
    }
}

export class InText {
    [key: string]: any;

    constructor() {
        this.opt = {
            inheritedAttributes: {}
        };

        this.tokens = [];

        this.opt.collapse = [];

        this.opt["disambiguate-add-names"] = false;
        this.opt["disambiguate-add-givenname"] = false;
        this.opt["disambiguate-add-year-suffix"] = false;
        this.opt["givenname-disambiguation-rule"] = "by-cite";
        this.opt["near-note-distance"] = 5;

        this.opt.topdecor = [];
        this.opt.layout_decorations = [];
        this.opt.layout_prefix = "";
        this.opt.layout_suffix = "";
        this.opt.layout_delimiter = "";

        this.opt.sort_locales = [];
        this.opt.max_number_of_names = 0;
        this.root = "intext";
    }
}
