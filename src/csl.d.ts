/*global CSL: true */

/**
 * The processor attaches everything to a single global ``CSL`` object.
 *
 * During the TypeScript migration the individual source modules continue
 * to mutate this global (rather than importing/exporting it), so that the
 * existing concatenation-based build keeps working.  This declaration
 * makes the global available to the ``.ts`` sources without type errors.
 *
 * As the migration proceeds, the ``any`` type below will be replaced with
 * progressively more precise interfaces.
 */
declare var CSL: any;
