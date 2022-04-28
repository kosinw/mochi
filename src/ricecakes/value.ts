// https://www.jmcelwa.in/posts/rust-like-enums/

export interface NumberValue {
  readonly tag: "number";
  readonly value: number;
};

export interface SymbolValue {
  readonly tag: "symbol";
  readonly value: string;
}

export interface StringValue {
  readonly tag: "string";
  readonly value: string;
}

/**
 * An abstract type representing a primitive value in Ricecakes AST. 
 */
export type Value =
  | NumberValue
  | SymbolValue;

export namespace Value {
  /**
   * Constructs a new primitive number value.
   * 
   * @param n a number
   * @returns a boxed number value
   */
  export function number(n: number): NumberValue {
    return new NumberValue(n);
  }

  /**
   * Constructs a new primitive symbol value.
   * 
   * @param v an identifier
   * @returns a boxed symbol value
   */
  export function symbol(v: string): SymbolValue {
    return new SymbolValue(v);
  }

  /**
   * Constructs a new primitive string value.
   * 
   * @param v a string of characters
   * @returns a boxed string
   */
  export function string(v: string): StringValue {
    return new StringValue(v);
  }

  class NumberValue implements NumberValue {
    public readonly tag = "number";
    public readonly value: number;

    public constructor(value: number) {
      this.value = value;
    }

    public toString(): string {
      return `NumberValue{ ${this.value} }`
    }
  }

  class SymbolValue implements SymbolValue {
    public readonly tag = "symbol";
    public readonly value: string;

    public constructor(value: string) {
      this.value = value;
    }

    public toString(): string {
      return `SymbolValue{ ${this.value} }`
    }
  }

  class StringValue implements StringValue {
    public readonly tag = "string";
    public readonly value: string;

    public constructor(value: string) {
      this.value = value;
    }

    public toString(): string {
      return `StringValue{ ${this.value} }`
    }
  }
}