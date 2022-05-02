///
/// File: compiler/index.ts 
/// Copyright (c) 2022 <kosinw@mit.edu>
///
/// This program is free software: you can redistribute it and/or modify
/// it under the terms of the GNU Lesser General Public License as published by
/// the Free Software Foundation, either version 3 of the License, or
/// (at your option) any later version.
///
/// This program is distributed in the hope that it will be useful,
/// but WITHOUT ANY WARRANTY; without even the implied warranty of
/// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
/// GNU General Public License for more details.
///
/// You should have received a copy of the GNU Lesser General Public License
/// along with this program.  If not, see <https://www.gnu.org/licenses/>.
///

import * as flour from "@module/flour";
import assert from "assert";
import { Multi, multi, method } from "@arrows/multimethod";
import { Result } from "@badrap/result";

////////////////////////////////////////////////////////
//
// TOKENIZER
//
////////////////////////////////////////////////////////

export enum DatumVariant {
  FIXNUM = 'fixnum',
  BOOLEAN = 'boolean',
  // CHARACTER,
  SYMBOL = 'symbol',
  // STRING
};


/**
 * A Scheme datum as defined by the R5RS.
 */
export type Datum =
  | { variant: DatumVariant.FIXNUM, value: number }
  | { variant: DatumVariant.BOOLEAN, value: boolean }
  | { variant: DatumVariant.SYMBOL, value: string };

/**
 * A Scheme reader macro as defined by the R5RS.
 */
export enum ReaderMacro {
  QUOTE = 'quote',
  QUASIQUOTE = 'quasiquote',
  UNQUOTE = 'unquote',
  UNQUOTE_SPLICING = 'unquote-splicing'
};

export enum TokenVariant {
  DATUM = 'datum',
  LEFT_PAREN = 'left-paren',
  RIGHT_PAREN = 'right-paren',
  READER_MACRO = 'reader-macro',
  DOT = 'dot',
  EOF = 'eof'
};

/**
 * A lexical unit in our Scheme lexical grammar.
 * See R5RS for more info.
 */
export type Token = {
  length: number,
  start: number,
  line: number
}
  & (
    | { variant: TokenVariant.DATUM, value: Datum }
    | { variant: TokenVariant.READER_MACRO, value: ReaderMacro }
    | { variant: TokenVariant.LEFT_PAREN }
    | { variant: TokenVariant.RIGHT_PAREN }
    | { variant: TokenVariant.DOT }
    | { variant: TokenVariant.EOF }
  );

type NextTokenGeneric = Multi & {
  (x: Tokenizer): Result<Token>;
};

const nextTokenGeneric: NextTokenGeneric = multi(
  (x: Tokenizer) => peek(x),
  method("\n", (x: Tokenizer): Result<Token> => { // newline?
    x.current += 1;
    x.line += 1;
    return nextToken(x);
  }),
  method(/[ \t\r]/, (x: Tokenizer): Result<Token> => { // whitespace?
    x.current += 1;
    return nextToken(x);
  }),
  method("'", makeTokenCombinator(TokenVariant.READER_MACRO, ReaderMacro.QUOTE)),
  method("`", makeTokenCombinator(TokenVariant.READER_MACRO, ReaderMacro.QUASIQUOTE)),
  method(",", makeTokenCombinator(TokenVariant.READER_MACRO, ReaderMacro.UNQUOTE)), // TODO(kosinw): This might actually be unquote-splicing
  method("(", makeTokenCombinator(TokenVariant.LEFT_PAREN)),
  method(")", makeTokenCombinator(TokenVariant.RIGHT_PAREN)),
  method(".", makeTokenCombinator(TokenVariant.DOT)),
  method("", makeTokenCombinator(TokenVariant.EOF, undefined, 0)),
  method(isNumeric, (x: Tokenizer): Result<Token> => { // number?
    return peekDatum(x)
      .chain(
        (datum) => {
          const procedure = makeTokenCombinator(
            TokenVariant.DATUM,
            {
              variant: DatumVariant.FIXNUM,
              value: Number.parseInt(datum, 10)
            },
            datum.length
          );
          return procedure(x);
        }
      );
  }),
  method((x: Tokenizer): Result<Token> => { // else, symbol?
    return peekDatum(x)
      .chain(
        (datum) => {
          const procedure = makeTokenCombinator(
            TokenVariant.DATUM,
            {
              variant: DatumVariant.SYMBOL,
              value: datum
            },
            datum.length
          );
          return procedure(x);
        }
      );
  })
);

/**
 * Yields the next available token in the stream, mutates the tokenizer.
 * 
 * @param scanner a tokenizer
 * @returns (a result for) the next token in the stream if source is valid,
 *          otherwise a Result.err
 */
export function nextToken(scanner: Tokenizer): Result<Token> {
  // TODO(kosinw): Implement comments to work
  return nextTokenGeneric(scanner);
}

/**
 * Data structure for tracking lexical analysis of Scheme source program.
 */
type Tokenizer = {
  current: number;
  line: number;
  source: string;
};

/**
 * Returns a function which tokenizes a certain token based on variant and value.
 * 
 * @param variant token variant
 * @param value token value
 * @returns (a new function which) tokenizes a token based on variant and value.
 */
function makeTokenCombinator<T = unknown>(
  variant: TokenVariant,
  value: T | undefined = undefined,
  n: number = 1
) {
  return (x: Tokenizer): Result<Token> => {
    x.current += n;
    // @ts-ignore
    return Result.ok({
      variant: variant,
      value: value,
      length: n,
      start: x.current - n,
      line: x.line
    });
  }
}

/**
 * Returns if peek(t) is numeric or not.
 * 
 * @param t a tokenizer
 * @returns true iff a character is numeric
 */
function isNumeric(t: Tokenizer): boolean {
  return !Number.isNaN(+peek(t));
}

/**
 * Returns the next available character in tokenizer internal buffer.
 * 
 * @param t a tokenizer
 * @returns the next character
 */
function peek(t: Tokenizer): string {
  return t.source.substring(t.current, t.current + 1);
}

/**
 * Returns the next available datum in tokenizer intenral buffer.
 * For more information on what a datum is, consult R5RS.
 * 
 * @param t a tokenizer
 * @returns (a result for) the next datum in tokenizer internal buffer
 */
function peekDatum(t: Tokenizer, formed: string = ''): Result<string> {
  const current = peek(t);

  if (/(\s|\)|^$)/.test(current)) { // (union whitespace? right-paren? empty?)
    return Result.ok(formed);
  }

  return peekDatum({
    ...t,
    current: t.current + 1
  }, formed + current);
}

/**
 * Creates a new lexical scanner for Scheme objects.
 * 
 * @param source source program
 */
export function makeTokenizer(source: string): Tokenizer {
  return { current: 0, line: 1, source };
}

////////////////////////////////////////////////////////
// 
// PARSER
//
////////////////////////////////////////////////////////

export enum SyntaxTreeVariant {
  DATUM = 'datum',
  LIST = 'list',
  // VECTOR = 'vector
  EOF = 'eof'
};

/**
 * Represents an abstract syntax tree for the Scheme programming language.
 */
export type SyntaxTree = { start: number; length: number; } &
  (
    | { variant: SyntaxTreeVariant.DATUM, value: Datum }
    | { variant: SyntaxTreeVariant.LIST, value: SyntaxTree[] }
    | { variant: SyntaxTreeVariant.EOF }
  );

/**
 * Represents a incremental parser which parses Scheme expressions given
 * a couple of tokens.
 */
type Parser = {
  current: Token;
  previous: Token;
  scanner: Tokenizer;
};

/**
 * Consumes a token of type variant from the parser.
 * 
 * @param parser a parser
 * @param variant a token type
 */
function consume(parser: Parser, variant: TokenVariant): Result<Token> {
  if (check(parser, variant)) {
    advance(parser);
    return Result.ok(parser.current);
  }

  return Result.err(Error(`Expected ${variant} token on line ${parser.current.line}, instead got ${parser.current.variant}`));
}

/**
 * Tests if parser currently matches variant.
 * 
 * @param parser a parser
 * @param variant a variant
 * @returns true iff current token matches variant
 */
function check(parser: Parser, variant: TokenVariant): boolean {
  return parser.current.variant === variant;
}

/**
 * Tests if parser currently matches variant, then advances parser if it does match.
 * 
 * @param parser a parser
 * @param variant a token variant
 */
function match(parser: Parser, variant: TokenVariant): boolean {
  if (!check(parser, variant)) {
    return false;
  }
  advance(parser);
  return true;
}

/**
 * Advances the parser by one token.
 * 
 * @param parser a parser
 */
function advance(parser: Parser): void {
  // TODO(kosinw): Add proper error handling code.
  parser.previous = parser.current;
  parser.current = nextToken(parser.scanner).unwrap();
}

/**
 * Initializes a new parser.
 * 
 * @param scanner a tokenizer
 * @returns a new parser which fetches tokens from scanner
 */
export function makeParser(scanner: Tokenizer): Parser {
  const firstToken = nextToken(scanner).unwrap();

  return {
    current: firstToken,
    previous: firstToken,
    scanner: scanner
  };
};

type ExpressionGeneric = Multi & {
  (x: Parser): SyntaxTree;
};

const expressionGeneric: ExpressionGeneric = multi(
  (x: Parser) => x.current.variant,
  method(TokenVariant.DATUM, (x: Parser): SyntaxTree => {
    assert(x.current.variant === TokenVariant.DATUM);
    return {
      variant: SyntaxTreeVariant.DATUM,
      value: x.current.value,
      start: x.current.start,
      length: x.current.length
    };
  }),
  method(TokenVariant.READER_MACRO, (x: Parser): SyntaxTree => {
    assert(x.current.variant === TokenVariant.READER_MACRO);
    const { start, value } = x.current;
    advance(x);
    const subexpr = expression(x);
    const extra = ReaderMacro.UNQUOTE_SPLICING === value ? 2 : 1;
    return {
      variant: SyntaxTreeVariant.LIST,
      value: [
        {
          variant: SyntaxTreeVariant.DATUM,
          value: {
            variant: DatumVariant.SYMBOL,
            value: value
          },
          start: start,
          length: extra
        },
        subexpr
      ],
      start: start,
      length: subexpr.length + extra
    };
  }),
  method(TokenVariant.LEFT_PAREN, (x: Parser): SyntaxTree => {
    assert(x.current.variant === TokenVariant.LEFT_PAREN);
    let subexprs = [];
    const { start } = x.current;

    advance(x);

    while (!check(x, TokenVariant.RIGHT_PAREN)) {
      if (match(x, TokenVariant.EOF)) {
        throw new Error("Unexpected EOF reached!");
      }

      subexprs.push(expression(x));
    }

    return {
      variant: SyntaxTreeVariant.LIST,
      value: subexprs,
      start: start,
      length: x.current.start - start + 1
    };
  }),
  method(TokenVariant.EOF, (x: Parser): SyntaxTree => {
    return {
      variant: SyntaxTreeVariant.EOF,
      start: x.current.start,
      length: x.current.length
    }
  }),
  method(TokenVariant.RIGHT_PAREN, (x: Parser): SyntaxTree => {
    throw new Error("Unexpected ')' reached!");
  }),
  method((x: Parser): SyntaxTree => {
    throw new Error(`Unexpected token reached, ${x.current}`);
  })
);

/**
 * Parses an expression from a parser.
 * 
 * @param parser a parser
 * @returns (a result for) a new syntax tree representing parsed Scheme expression
 */
export function expression(parser: Parser): SyntaxTree {
  const result = expressionGeneric(parser);
  advance(parser);
  return result;
}

////////////////////////////////////////////////////////
// 
// CODEGEN
//
////////////////////////////////////////////////////////

/**
 * Entrypoint for the Ricecakes Scheme compiler.
 * Compiles source code string into Flour bytecode object buffer.
 * 
 * @param source a source program
 */
export function compile(source: string): void {
  const scanner = makeTokenizer(source);
  const parser = makeParser(scanner);
  // let chunks: flour.Chunk[] = [];

  // while (!match(parser, TokenVariant.EOF)) {
  //   const chunk = flour.makeChunk();
  //   chunks.push(expression(parser, chunk));
  // }

  // return flour.serialize(linker(chunks));
}