// Core constants

export const AFTER = 2;

export const AREAS = ["citation", "citation_sort", "bibliography", "bibliography_sort", "intext"];

export const ASCENDING = 2;

export const ASSUME_ALL_ITEMS_REGISTERED = 2;

export const BEFORE = 1;

export const CITE_FIELDS = ["first-reference-note-number", "first-container-reference-note-number", "locator", "locator-extra"];

export const CREATORS = [        "author",
        "chair",
        "collection-editor",
        "compiler",
        "composer",
        "container-author",
        "contributor",
        "curator",
        "director",
        "editor",
        "editor-translator", 
        "editorial-director",
        "executive-producer",
        "guest",
        "host",
        "illustrator",
        "interviewer",
        "narrator", 
        "organizer",
        "original-author",
        "performer",
        "producer",
        "recipient",
        "reviewed-author",
        "script-writer",
        "series-creator",
        "translator",
        "commenter"
    ];

export const DATE_PARTS = ["year", "month", "day"];

export const DATE_PARTS_ALL = ["year", "month", "day", "season"];

export const DATE_PARTS_INTERNAL = ["year", "month", "day", "year_end", "month_end", "day_end"];

export const DATE_VARIABLES = [        "locator-date", 
        "issued", 
        "event-date", 
        "accessed", 
        "original-date",
        "publication-date",
        "available-date",
        "submitted",
        "alt-issued",
        "alt-event"
    ];

export const DESCENDING = 1;

export const DISAMBIGUATE_OPTIONS = [        "disambiguate-add-names",
        "disambiguate-add-givenname",
        "disambiguate-add-year-suffix"
    ];

export const DISPLAY_CLASSES = ["block", "left-margin", "right-inline", "indent"];

export const END = 1;

export const ERROR_NO_RENDERED_FORM = 1;

export const FIELD_CATEGORY_REMAP = {        "title": "title",
        "container-title": "container-title",
        "collection-title": "collection-title",
        "country": "place",
        "number": "number",
        "place": "place",
        "archive": "container-title",
        "title-short": "title",
        "genre": "title",
        "event": "title",
        "medium": "title",
		"archive-place": "place",
		"publisher-place": "place",
		"event-place": "place",
		"jurisdiction": "place",
		"language-name": "place",
		"language-name-original": "place",
        "call-number": "number",
        "chapter-number": "number",
        "collection-number": "number",
        "edition": "number",
        "page": "number",
        "issue": "number",
        "locator": "number",
        "locator-extra": "number",
        "number-of-pages": "number",
        "number-of-volumes": "number",
        "volume": "number",
        "citation-number": "number",
        "publisher": "institution-part"
    };

export const FORMAT_KEY_SEQUENCE = [        "@strip-periods",
        "@font-style",
        "@font-variant",
        "@font-weight",
        "@text-decoration",
        "@vertical-align",
        "@quotes"
    ];

export const GENDERS = ["masculine", "feminine"];

export const GIVENNAME_DISAMBIGUATION_RULES = [        "all-names",
        "all-names-with-initials",
        "primary-name",
        "primary-name-with-initials",
        "by-cite"
    ];

export const INSTITUTION_KEYS = [        "font-style",
        "font-variant",
        "font-weight",
        "text-decoration",
        "text-case"
    ];

export const LANGS = {        "af-ZA":"Afrikaans",
        "ar":"Arabic",
        "bg-BG":"Bulgarian",
        "ca-AD":"Catalan",
        "cs-CZ":"Czech",
        "da-DK":"Danish",
        "de-AT":"Austrian",
        "de-CH":"German (CH)",
        "de-DE":"German (DE)",
        "el-GR":"Greek",
        "en-GB":"English (GB)",
        "en-US":"English (US)",
        "es-ES":"Spanish",
        "et-EE":"Estonian",
        "eu":"European",
        "fa-IR":"Persian",
        "fi-FI":"Finnish",
        "fr-CA":"French (CA)",
        "fr-FR":"French (FR)",
        "he-IL":"Hebrew",
        "hr-HR":"Croatian",
        "hu-HU":"Hungarian",
        "is-IS":"Icelandic",
        "it-IT":"Italian",
        "ja-JP":"Japanese",
        "km-KH":"Khmer",
        "ko-KR":"Korean",
        "lt-LT":"Lithuanian",
        "lv-LV":"Latvian",
        "mn-MN":"Mongolian",
        "nb-NO":"Norwegian (Bokmål)",
        "nl-NL":"Dutch",
        "nn-NO":"Norwegian (Nynorsk)",
        "pl-PL":"Polish",
        "pt-BR":"Portuguese (BR)",
        "pt-PT":"Portuguese (PT)",
        "ro-RO":"Romanian",
        "ru-RU":"Russian",
        "sk-SK":"Slovak",
        "sl-SI":"Slovenian",
        "sr-RS":"Serbian",
        "sv-SE":"Swedish",
        "th-TH":"Thai",
        "tr-TR":"Turkish",
        "uk-UA":"Ukrainian",
        "vi-VN":"Vietnamese",
        "zh-CN":"Chinese (CN)",
        "zh-TW":"Chinese (TW)"
    };

export const LANG_BASES = {        af: "af_ZA",
        ar: "ar",
        bg: "bg_BG",
        ca: "ca_AD",
        cs: "cs_CZ",
        da: "da_DK",
        de: "de_DE",
        el: "el_GR",
        en: "en_US",
        es: "es_ES",
        et: "et_EE",
        eu: "eu",
        fa: "fa_IR",
        fi: "fi_FI",
        fr: "fr_FR",
        he: "he_IL",
        hr: "hr-HR",
        hu: "hu_HU",
        is: "is_IS",
        it: "it_IT",
        ja: "ja_JP",
        km: "km_KH",
        ko: "ko_KR",
        lt: "lt_LT",
        lv: "lv-LV",
        mn: "mn_MN",
        nb: "nb_NO",
        nl: "nl_NL",
        nn: "nn-NO",
        pl: "pl_PL",
        pt: "pt_PT",
        ro: "ro_RO",
        ru: "ru_RU",
        sk: "sk_SK",
        sl: "sl_SI",
        sr: "sr_RS",
        sv: "sv_SE",
        th: "th_TH",
        tr: "tr_TR",
        uk: "uk_UA",
        vi: "vi_VN",
        zh: "zh_CN"
    };

export const LITERAL = true;

export const LOOSE = 0;

export const LangPrefsMap = {        "title":"titles",
        "title-short":"titles",
        "event":"titles",
        "genre":"titles",
        "medium":"titles",
        "container-title":"journals",
        "collection-title":"titles",
        "archive":"journals",
        "publisher":"publishers",
        "authority":"publishers",
        "publisher-place": "places",
        "event-place": "places",
        "archive-place": "places",
        "jurisdiction": "places",
        "number": "places",
        "edition":"places",
        "issue":"places",
        "volume":"places"
    };

export const MODULE_MACROS = {        "juris-pretitle": true,
        "juris-title": true,
        "juris-pretitle-short": true,
        "juris-title-short": true,
        "juris-main": true,
        "juris-main-short": true,
        "juris-tail": true,
        "juris-tail-short": true,
        "juris-locator": true
    };

export const MODULE_TYPES = {        "legal_case": true,
        "legislation": true,
        "bill": true,
        "hearing": true,
        "gazette": true,
        "report": true,
        "regulation": true,
        "standard": true,
        "patent": true,
        "locator": true
    };

export const MULTI_FIELDS = ["archive", "archive_collection", "archive_location", "archive-place", "authority", "collection-title", "container-title", "country", "division", "event", "event-place", "event-title", "genre", "jurisdiction", "medium", "original-publisher", "original-publisher-place", "original-title", "part-title", "publisher", "publisher-place", "reviewed-genre", "reviewed-title", "source", "title", "title-short", "volume-title"];

export const NAME_ATTRIBUTES = [        "and",
        "delimiter-precedes-last",
        "delimiter-precedes-et-al",
        "initialize-with",
        "initialize",
        "name-as-sort-order",
        "sort-separator",
        "et-al-min",
        "et-al-use-first",
        "et-al-subsequent-min",
        "et-al-subsequent-use-first",
        "form",
        "prefix",
        "suffix",
        "delimiter"
    ];

export const NAME_PARTS = ["non-dropping-particle", "family", "given", "dropping-particle", "suffix", "literal"];

export const NAME_VARIABLES = [        "author",
        "chair",
        "collection-editor",
        "compiler",
        "composer",
        "container-author",
        "contributor",
        "curator",
        "director",
        "editor",
        "editor-translator", 
        "editorial-director",
        "executive-producer",
        "guest",
        "host",
        "illustrator",
        "interviewer",
        "narrator", 
        "organizer",
        "original-author",
        "performer",
        "producer",
        "recipient",
        "reviewed-author",
        "script-writer",
        "series-creator",
        "translator",
        "commenter"
    ];

export const NONE = 0;

export const NUMERIC = 1;

export const NUMERIC_VARIABLES = [        "call-number",
        "chapter-number",
        "collection-number",
        "division",
        "edition",
        "page",
        "issue",
        "locator",
        "locator-extra",
        "number",
        "number-of-pages",
        "number-of-volumes",
        "part-number",
        "printing-number",
        "section",
        "supplement-number",
        "version",
        "volume",
        "supplement", // maybe deprecated this? supplement-number should serve this purpose in standard CSL.
        "citation-number"
    ];
export const PLURAL = 1;

export const POSITION = 2;

export const POSITION_CONTAINER_SUBSEQUENT = 4;

export const POSITION_FIRST = 0;

export const POSITION_IBID = 2;

export const POSITION_IBID_WITH_LOCATOR = 3;

export const POSITION_MAP = {        "0": 0,
        "4": 1,
        "1": 2,
        "2": 3,
        "3": 4
    };

export const POSITION_SUBSEQUENT = 1;

export const POSITION_TEST_VARS = ["position", "first-reference-note-number", "near-note"];

export const PREVIEW = "Just for laughs.";

export const PRIMARY = 1;

export const PROCESSOR_VERSION = "1.4.61";

export const ROMAN_NUMERALS = [        [ "", "i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix" ],
        [ "", "x", "xx", "xxx", "xl", "l", "lx", "lxx", "lxxx", "xc" ],
        [ "", "c", "cc", "ccc", "cd", "d", "dc", "dcc", "dccc", "cm" ],
        [ "", "m", "mm", "mmm", "mmmm", "mmmmm"]
    ];

export const SECONDARY = 2;

export const SEEN = 6;

export const SINGLETON = 2;

export const SINGULAR = 0;

export const SKIP_WORDS = ["about","above","across","afore","after","against","al", "along","alongside","amid","amidst","among","amongst","anenst","apropos","apud","around","as","aside","astride","at","athwart","atop","barring","before","behind","below","beneath","beside","besides","between","beyond","but","by","circa","despite","down","during","et", "except","for","forenenst","from","given","in","inside","into","lest","like","modulo","near","next","notwithstanding","of","off","on","onto","out","over","per","plus","pro","qua","sans","since","than","through"," thru","throughout","thruout","till","to","toward","towards","under","underneath","until","unto","up","upon","versus","vs.","v.","vs","v","via","vis-à-vis","with","within","without","according to","ahead of","apart from","as for","as of","as per","as regards","aside from","back to","because of","close to","due to","except for","far from","inside of","instead of","near to","next to","on to","out from","out of","outside of","prior to","pursuant to","rather than","regardless of","such as","that of","up to","where as","or", "yet", "so", "for", "and", "nor", "a", "an", "the", "de", "d'", "von", "van", "c", "ca"];

export const START = 0;

export const STRICT = 1;

export const SUCCESSOR = 3;

export const SUCCESSOR_OF_SUCCESSOR = 4;

export const SUFFIX_CHARS = "a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z";

export const SUPPRESS = 5;

export const SWAPPING_PUNCTUATION = [".", "!", "?", ":", ","];

export const SYS_OPTIONS = [        "prioritize_disambiguate_condition",
        "csl_reverse_lookup_support",
        "main_title_from_short_title",
        "uppercase_subtitles",
        "force_short_title_casing_alignment",
        "implicit_short_title",
        "split_container_title"
    ];

export const TERMINAL_PUNCTUATION = [":", ".", ";", "!", "?", " "];

export const TOLERANT = 2;

export const TRIGRAPH = 3;

export const VARIABLES_WITH_SHORT_FORM = [        "title",
        "container-title"
    ];
