import { ExprTreeAtom, ExprTree, ExprTreeList } from "./expr";

import parser from "@lilusoft/s-expression";
import assert from 'assert';
import * as list from './list';

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
  parse(): ExprTree;

  /**
   * true iff concatenated scanned source programs are parseable
   */
  get ready(): boolean;
}

/**
 * A quick and naive implementation of a Scheme parser based on an external library 
 * to speed up development rate.
 */
// TODO(kosi): Remove this implementation and write your own parser.
class NaiveParser implements Parser {
  private constructor(private readonly buffer: string) { }

  /**
   * @inheritdoc
   */
  public static create(): NaiveParser {
    return new NaiveParser("");
  }

  /**
   * @inheritdoc
   */
  public scan(source: string): Parser {
    return new NaiveParser(this.buffer + source);
  }

  /**
   * @inheritdoc
   */
  public parse(): ExprTree {
    assert(this.ready, `precondition violated: source code not ready to parse, source: ${this.buffer}`);

    const parseAtom = (l: string): string => l;

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

    const parseInternal = (l: NaiveParser.NaiveTree): ExprTree =>
      typeof l === 'string' ?
        new ExprTreeAtom(parseAtom(l)) :
        new ExprTreeList(parseList(l));

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

export function reader(): Parser {
  return NaiveParser.create();
}