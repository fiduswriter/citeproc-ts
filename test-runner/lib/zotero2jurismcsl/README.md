# zotero2jurismCSL

This code was copied from the `zotero2jurismcsl` package
(version 0.0.12), available at
<https://github.com/fbennett/zotero2jurismCSL>.

It provides a single method `convert`, which unpacks any extended data
encoded in the *Extra* field of a Zotero item, returning a CSL object.
Extended Juris-M data may include item type overrides, extended fields
and creators, and multilingual variants.

The code has been adapted for local use in the `citeproc-ts` project.
It now imports `DateParser` from the local `citeproc.mjs` bundle instead
of the `citeproc` npm package.

## License

The original code is licensed under CPAL-1.0 OR AGPL-1.0.
See the included `package.json` for details.

Frank Bennett
2019.04.24
