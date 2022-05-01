import { Expr } from "./expr";

import parser from "@lilusoft/s-expression";
import assert from 'assert';
import { ParserValue } from "./value";

// TODO(kosinw): Add test suite for parser.

/**
 * An immutable data type which represents an incremental parser following the grammar
 * of the Scheme programming language according to the R5RS report.
 */
export interface Parser {
  /**
   * Parses all scanned source files into an expression tree.
   * 
   * @throws Error if reader is not ready to parse or a syntax error occured
   */
  parse(): Expr;
}

export namespace Parser {
  /**
   * @returns a new parser with an empty buffer
   */
  export function create(source: string): Parser {
    return new NaiveParser(source);
  }

  /**
   * A quick and naive implementation of a Scheme parser based on an external library 
   * to speed up development rate.
   */
  // TODO(kosinw): Remove this implementation and write a better recursive-descent parser.
  class NaiveParser implements Parser {
    public constructor(private readonly buffer: string) { }

    /**
     * @inheritdoc
     */
    public parse(): Expr {
      const parseAtom = (l: string): ParserValue => {
        const number = /[\-+]?[0-9]+/;

        if (number.test(l)) { return ParserValue.number(parseInt(l)); }
        else { return ParserValue.symbol(l); }
      };

      const parseList = (l: string[]): Expr[] => {
        return l.map(x => parseInternal(x));
      };

      const parseInternal = (l: string | string[]): Expr =>
        typeof l === 'string' ?
          Expr.atom(parseAtom(l)) :
          Expr.list(parseList(l));

      return parseInternal(parser.parse(this.buffer));
    }
  }
}

if (require.main === module) {
  const parser = Parser.create("(2 . (3 . (4 . (5 . 6))))");

  console.dir(parser.parse(), { depth: null });
}