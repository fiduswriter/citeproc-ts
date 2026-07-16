export function debug(str: string): void {
    console.log("citeproc-js warning: " + str);
}

export function error(str: string): void {
    throw new Error("citeproc-js error: " + str);
}
