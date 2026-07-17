import { error } from './logger';
/**
 * String stack object.
 * <p>Numerous string stacks are used to track nested
 * parameters at runtime.  This class provides methods
 * that remove some of the aggravation of managing
 * them.</p>
 */
export class Stack<T = any> {
    public mystack: T[];
    public tip: T;

    constructor(val?: T, literal?: boolean) {
        this.mystack = [];
        if (literal || val !== undefined) {
            this.mystack.push(val as T);
        }
        this.tip = this.mystack[0];
    }

    /** Push a value onto the stack. */
    public push(val?: T, literal?: boolean): void {
        if (literal || val !== undefined) {
            this.mystack.push(val as T);
        } else {
            this.mystack.push("" as any);
        }
        this.tip = this.mystack[this.mystack.length - 1];
    }

    /** Clear the stack */
    public clear(): void {
        this.mystack = [];
        this.tip = {} as T;
    }

    /**
     * Replace the top value on the stack.
     * <p>This removes some ugly syntax from the
     * main code.</p>
     */
    public replace(val: T, literal?: boolean): void {
        if (this.mystack.length === 0) {
            error("Internal CSL processor error: attempt to replace nonexistent stack item with " + val);
        }
        if (literal || val !== undefined) {
            this.mystack[(this.mystack.length - 1)] = val;
        } else {
            this.mystack[(this.mystack.length - 1)] = "" as any;
        }
        this.tip = this.mystack[this.mystack.length - 1];
    }

    /** Remove the top value from the stack. */
    public pop(): T | undefined {
        const ret = this.mystack.pop();
        if (this.mystack.length) {
            this.tip = this.mystack[this.mystack.length - 1];
        } else {
            this.tip = {} as T;
        }
        return ret;
    }

    /** Return the top value on the stack. */
    public value(): T | undefined {
        return this.mystack.slice(-1)[0];
    }

    /** Return length (depth) of stack. */
    public length(): number {
        return this.mystack.length;
    }
}
