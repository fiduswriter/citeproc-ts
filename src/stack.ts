import { CSL } from './csl';

/**
 * String stack object.
 * <p>Numerous string stacks are used to track nested
 * parameters at runtime.  This class provides methods
 * that remove some of the aggravation of managing
 * them.</p>
 */
export class Stack {
    public mystack: any[];
    public tip: any;

    constructor(val?: any, literal?: boolean) {
        this.mystack = [];
        if (literal || val) {
            this.mystack.push(val);
        }
        this.tip = this.mystack[0];
    }

    /** Push a value onto the stack. */
    public push(val: any, literal?: boolean): void {
        if (literal || val) {
            this.mystack.push(val);
        } else {
            this.mystack.push("");
        }
        this.tip = this.mystack[this.mystack.length - 1];
    }

    /** Clear the stack */
    public clear(): void {
        this.mystack = [];
        this.tip = {};
    }

    /**
     * Replace the top value on the stack.
     * <p>This removes some ugly syntax from the
     * main code.</p>
     */
    public replace(val: any, literal?: boolean): void {
        if (this.mystack.length === 0) {
            CSL.error("Internal CSL processor error: attempt to replace nonexistent stack item with " + val);
        }
        if (literal || val) {
            this.mystack[(this.mystack.length - 1)] = val;
        } else {
            this.mystack[(this.mystack.length - 1)] = "";
        }
        this.tip = this.mystack[this.mystack.length - 1];
    }

    /** Remove the top value from the stack. */
    public pop(): any {
        const ret = this.mystack.pop();
        if (this.mystack.length) {
            this.tip = this.mystack[this.mystack.length - 1];
        } else {
            this.tip = {};
        }
        return ret;
    }

    /** Return the top value on the stack. */
    public value(): any {
        return this.mystack.slice(-1)[0];
    }

    /** Return length (depth) of stack. */
    public length(): number {
        return this.mystack.length;
    }
}
