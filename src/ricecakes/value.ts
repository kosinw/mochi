export enum ParserValueType {
  NUMBER = 'number',
  SYMBOL = 'symbol',
  STRING = 'string'
};

interface BaseParserValue {
  serialize(): ArrayBuffer;
}

export type NumberParserValue = BaseParserValue & {
  readonly type: ParserValueType.NUMBER;
  readonly value: number;
};

export type SymbolParserValue = BaseParserValue & {
  readonly type: ParserValueType.SYMBOL;
  readonly value: string;
}

export type StringParserValue = BaseParserValue & {
  readonly type: ParserValueType.STRING;
  readonly value: string;
}

/**
 * An abstract type representing a primitive value in Ricecakes AST. 
 */
export type ParserValue =
  | NumberParserValue
  | SymbolParserValue
  | StringParserValue;

export namespace ParserValue {
  /**
   * Constructs a new primitive number value.
   * 
   * @param n a number
   * @returns a boxed number value
   */
  export function number(n: number): NumberParserValue {
    return new _NumberParserValue(n);
  }

  /**
   * Constructs a new primitive symbol value.
   * 
   * @param v an identifier
   * @returns a boxed symbol value
   */
  export function symbol(v: string): SymbolParserValue {
    return new _SymbolParserValue(v);
  }

  /**
   * Constructs a new primitive string value.
   * 
   * @param v a string of characters
   * @returns a boxed string
   */
  export function string(v: string): StringParserValue {
    return new _StringParserValue(v);
  }

  class _NumberParserValue implements NumberParserValue {
    public readonly value: number;
    public readonly type = ParserValueType.NUMBER;

    public constructor(value: number) {
      this.value = value;
    }
    
    serialize(): ArrayBuffer {
      throw new Error("Method not implemented.");
    }

    public toString(): string {
      return `NumberValue{ ${this.value} }`
    }
  }

  class _SymbolParserValue implements SymbolParserValue {
    public readonly value: string;
    public readonly type = ParserValueType.SYMBOL;

    public constructor(value: string) {
      this.value = value;
    }
    
    serialize(): ArrayBuffer {
      throw new Error("Method not implemented.");
    }

    public toString(): string {
      return `SymbolValue{ ${this.value} }`
    }
  }

  class _StringParserValue implements StringParserValue {
    public readonly value: string;
    public readonly type = ParserValueType.STRING;

    public constructor(value: string) {
      this.value = value;
    }
    
    serialize(): ArrayBuffer {
      throw new Error("Method not implemented.");
    }

    public toString(): string {
      return `StringValue{ ${this.value} }`
    }
  }
}