import { AtomExpr, Expr, ListExpr } from "./expr";

import parser from "@lilusoft/s-expression";
import assert from 'assert';
import * as list from './list';
import { Value } from "./value";

// TODO(kosinw): Add test suite for parser.

/**
 * An immutable data type which represents an incremental parser following the grammar
 * of the Scheme programming language according to the R5RS report.
 */
export interface Parser {
  /**
   * Constructs a new Parser which will later parse the source string.
   * 
   * @param source a partial string from source program
   * @returns a new reader
   */
  scan(source: string): Parser;

  /**
   * Parses all scanned source files into an expression tree.
   * 
   * @throws Error if reader is not ready to parse or a syntax error occured
   */
  parse(): Expr;

  /**
   * true iff concatenated scanned source programs are parseable
   */
  get ready(): boolean;
}

export namespace Parser {
  /**
   * @returns a new parser with an empty buffer
   */
  export function create(): Parser {
    return new NaiveParser("");
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
    public scan(source: string): Parser {
      return new NaiveParser(this.buffer + source);
    }

    /**
     * @inheritdoc
     */
    public parse(): Expr {
      assert(this.ready, `precondition violated: source code not ready to parse, source: ${this.buffer}`);

      const parseAtom = (l: string): Value => {
        const number = /[\-+]?[0-9]+/;

        if (number.test(l)) { return Value.number(parseInt(l)); }
        else { return Value.symbol(l); }
      };

      const parseList = (l: NaiveParser.NaiveTree): list.List<NaiveParser.NaiveTree> => {
        if (l.length === 0) {
          return list.nil;
        } else if (l[1] === '.') {
          assert(l.length === 3, `syntax error: improper dotted list was supplied ${this.buffer}`);
          return list.cons(parseInternal(l[0]), parseInternal(l[2]));
        } else {
          return list.cons(parseInternal(l[0]), parseList(l.slice(1)));
        }
      };

      const parseInternal = (l: NaiveParser.NaiveTree): Expr =>
        typeof l === 'string' ?
          new AtomExpr(parseAtom(l)) :
          new ListExpr(parseList(l));

      return parseInternal(parser.parse(this.buffer));
    }

    /**
     * @inheritdoc
     */
    get ready(): boolean {
      return true;
    }
  }

  namespace NaiveParser {
    export type NaiveTree = string | NaiveTree[];
  }
}

if (require.main === module) {
  const parser = Parser.create()
    .scan("'(+ 2 3)");

  console.log(parser.parse().toString());
}