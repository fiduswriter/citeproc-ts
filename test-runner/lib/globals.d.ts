/**
 * Ambient declarations for the test runner.
 *
 * The test runner is an ESM program that depends on a number of packages
 * (and on Node's built-ins) whose type definitions are not installed in this
 * repository.  They are declared here as ``any`` so the runner's ``.ts``
 * sources type-check without a full ``node_modules`` install.
 *
 * Node.js runtime globals are typed with minimal interfaces covering
 * what the runner actually uses.
 */

interface StdioWritable {
    write(data: string): void;
}

interface StdinReadable {
    setRawMode(mode: boolean): void;
    resume(): void;
    on(event: string, listener: (...args: any[]) => void): void;
    once(event: string, listener: (...args: any[]) => void): void;
}

interface MinimalProcess {
    argv: string[];
    env: Record<string, string | undefined>;
    cwd(): string;
    exit(code?: number): never;
    platform: string;
    stdin: StdinReadable;
    stdout: StdioWritable;
    stderr: StdioWritable;
    on(event: string, listener: (...args: any[]) => void): void;
    [key: string]: any;
}

interface MinimalConsole {
    log(...args: any[]): void;
    warn(...args: any[]): void;
    error(...args: any[]): void;
    [key: string]: any;
}

interface BufferInterface {
    toString(encoding?: string): string;
    [key: string]: any;
}

interface BufferConstructor {
    from(data: any, encoding?: string): BufferInterface;
    isBuffer(obj: any): boolean;
    alloc(size: number): BufferInterface;
    [key: string]: any;
}

interface TimerHandle {
    [key: string]: any;
}

declare let process: MinimalProcess;
declare let console: MinimalConsole;
declare let Buffer: BufferConstructor;
declare let global: any;
declare function setTimeout(callback: (...args: any[]) => void, ms?: number, ...args: any[]): TimerHandle;
declare function clearTimeout(handle?: TimerHandle): void;
declare function setInterval(callback: (...args: any[]) => void, ms?: number, ...args: any[]): TimerHandle;
declare function clearInterval(handle?: TimerHandle): void;

// Node built-in modules (untyped)
declare module "fs";
declare module "path";
declare module "os";
declare module "child_process";
declare module "url";
declare module "module";

// Third-party dependencies without installed types
declare module "chai";
declare module "chokidar";
declare module "citeproc";
declare module "citeproc-abbrevs";
declare module "citeproc-csl-schemata";
declare module "citeproc-juris-modules";
declare module "citeproc-locales";
declare module "cross-clear";
declare module "fetch-promise";
declare module "getopts";
declare module "normalize-newline";
declare module "tmp";
declare module "yaml";
declare module "zotero-to-csl";
declare module "zotero2jurismcsl";
