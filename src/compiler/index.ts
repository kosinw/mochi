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
import * as util from "util";
import assert from "assert";
import { Multi, multi, method } from "@arrows/multimethod";
import { Result } from "@badrap/result";
import { FlourOpcode } from "@module/flour";

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

const CLOSING_PAREN = /(\)|\}|\])/;
const OPENING_PAREN = /(\(|\{|\[)/;

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
  method(OPENING_PAREN, makeTokenCombinator(TokenVariant.LEFT_PAREN)),
  method(CLOSING_PAREN, makeTokenCombinator(TokenVariant.RIGHT_PAREN)),
  method(".", makeTokenCombinator(TokenVariant.DOT)),
  method("", makeTokenCombinator(TokenVariant.EOF, undefined, 0)),
  method("#", (x: Tokenizer): Result<Token> => {
    x.current += 1;

    // TODO(kosinw): Maybe move this to the parser and instead just emit a special
    // hash token (in parser we construct the other thing)
    const hashGeneric: NextTokenGeneric = multi(
      (x: Tokenizer) => peek(x),
      method("t", makeTokenCombinator(TokenVariant.DATUM, { variant: DatumVariant.BOOLEAN, value: true })),
      method("f", makeTokenCombinator(TokenVariant.DATUM, { variant: DatumVariant.BOOLEAN, value: false })),
      method((x: Tokenizer): Result<Token> => Result.err(Error(`Encountered unknown character after '#', ${peek(x)}`)))
    );

    return hashGeneric(x);
  }),
  method(isNumeric, (x: Tokenizer): Result<Token> => { // number?
    return peekDatum(x)
      .chain(
        (datum) => {
          const value = +datum;

          if (isNaN(value)) {
            return Result.err(Error(`Expected a number, instead got ${datum}`));
          }

          const procedure = makeTokenCombinator(
            TokenVariant.DATUM,
            {
              variant: DatumVariant.FIXNUM,
              value: value
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

  if (/(\s|^$)/.test(current) || CLOSING_PAREN.test(current)) { // (union whitespace? right-paren? empty?)
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
  ATOM = 'atom',
  LIST = 'list',
  // VECTOR = 'vector
  EOF = 'eof'
};

/**
 * Represents an abstract syntax tree for the Scheme programming language.
 */
export type SyntaxTree = { start: number; length: number; line: number; } &
  (
    | { variant: SyntaxTreeVariant.ATOM, value: Datum }
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

// TODO(kosinw): Convert this to a Result<SyntaxTree>
const expressionGeneric: ExpressionGeneric = multi(
  (x: Parser) => x.current.variant,
  method(TokenVariant.DATUM, (x: Parser): SyntaxTree => {
    assert(x.current.variant === TokenVariant.DATUM);
    return {
      variant: SyntaxTreeVariant.ATOM,
      value: x.current.value,
      start: x.current.start,
      length: x.current.length,
      line: x.current.line
    };
  }),
  method(TokenVariant.READER_MACRO, (x: Parser): SyntaxTree => {
    assert(x.current.variant === TokenVariant.READER_MACRO);
    const { start, value, line } = x.current;
    advance(x);
    const subexpr = expression(x);
    const extra = ReaderMacro.UNQUOTE_SPLICING === value ? 2 : 1;
    return {
      variant: SyntaxTreeVariant.LIST,
      value: [
        {
          variant: SyntaxTreeVariant.ATOM,
          value: {
            variant: DatumVariant.SYMBOL,
            value: value
          },
          start: start,
          length: extra,
          line
        },
        subexpr
      ],
      start: start,
      length: subexpr.length + extra,
      line
    };
  }),
  method(TokenVariant.LEFT_PAREN, (x: Parser): SyntaxTree => { 
    assert(x.current.variant === TokenVariant.LEFT_PAREN);
    let subexprs = [];
    const { start, line } = x.current;

    advance(x);

    while (!check(x, TokenVariant.RIGHT_PAREN)) {
      if (match(x, TokenVariant.EOF)) {
        throw Error("Unexpected EOF reached!");
      }

      subexprs.push(expression(x));
    }

    return {
      variant: SyntaxTreeVariant.LIST,
      value: subexprs,
      start: start,
      line,
      length: x.current.start - start + 1
    };
  }),
  method(TokenVariant.EOF, (x: Parser): SyntaxTree => {
    return {
      variant: SyntaxTreeVariant.EOF,
      start: x.current.start,
      line: x.current.line,
      length: x.current.length
    }
  }),
  method(TokenVariant.RIGHT_PAREN, (x: Parser): SyntaxTree => {
    throw Error("Unexpected ')' reached!");
  }),
  method((x: Parser): SyntaxTree => {
    throw Error(`Unexpected token reached, ${util.inspect(x.current)}`);
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

type StackOffset = number;

/**
 * Represents a unit of code that is currently being compiled.
 * One unit usually represents the current lexical scope being compiled.
 */
type CompilationUnit = {
  readonly parent?: CompilationUnit;
  readonly chunk: flour.Chunk;
  readonly objectFile: flour.ObjectFile;
  readonly locals: Map<string, StackOffset>;
};

/**
 * Constructs a new compilation unit, individual units are made for each procedure.
 * 
 * @param objectFile a flour object file
 * @param parent a parent compilation unit
 * @returns a new compilation unit
 */
function makeUnit(name: string, objectFile: flour.ObjectFile, parent?: CompilationUnit): CompilationUnit {
  const chunk = flour.makeChunk(name);
  objectFile.chunks.set(name, chunk);

  return {
    parent,
    chunk: chunk,
    objectFile,
    locals: new Map()
  };
}

/**
 * Writes out epilogue for compilation unit.
 * 
 * @param unit a compilation unit
 * @returns parent compilation unit
 */
function unitEpilogue(unit: CompilationUnit): CompilationUnit | undefined {
  flour.emitInstruction(unit.chunk, flour.single(FlourOpcode.RETURN));
  return unit.parent;
}

type CompileDatumGeneric = Multi & {
  (datum: Datum, unit: CompilationUnit, line: number): void;
};


enum SpecialForm {
  LET = "let"
}

const compileDatum: CompileDatumGeneric = multi(
  (datum: Datum, unit: CompilationUnit, line: number) => datum.variant,
  method(DatumVariant.FIXNUM, (datum: Datum, unit: CompilationUnit, line: number) => {
    assert(datum.variant === DatumVariant.FIXNUM);
    flour.emitConstantInstruction(unit.chunk, flour.fixnum(datum.value), line);
  }),
  method(DatumVariant.BOOLEAN, (datum: Datum, unit: CompilationUnit, line: number) => {
    assert(datum.variant === DatumVariant.BOOLEAN);
    const instruction = datum.value ? FlourOpcode.TRUE : FlourOpcode.FALSE;
    flour.emitInstruction(unit.chunk, flour.single(instruction, line));
  }),
  method((datum: Datum, unit: CompilationUnit) => { throw Error(`Compiling unknown datum, ${util.inspect(datum)}`) })
);

type CompileExpressionGeneric = Multi & {
  (expr: SyntaxTree, unit: CompilationUnit): void;
}

const compileExpressionGeneric: CompileExpressionGeneric = multi(
  (expr: SyntaxTree, unit: CompilationUnit) => expr.variant,
  method(
    SyntaxTreeVariant.ATOM,
    (expr: SyntaxTree, unit: CompilationUnit) => {
      assert(expr.variant === SyntaxTreeVariant.ATOM);
      compileDatum(expr.value, unit, expr.line);
    }
  ),
  method(isSpecialForm(SpecialForm.LET), dispatchLet),
  method(isPrimitiveCall, dispatchPrimitiveCall),
  method(
    SyntaxTreeVariant.LIST,
    (expr: SyntaxTree, unit: CompilationUnit) => {
      assert(expr.variant === SyntaxTreeVariant.LIST);
      if (expr.value.length === 0) {
        // NOTE(kosinw): Empty list is special case, should make a nil
        flour.emitInstruction(unit.chunk, flour.single(FlourOpcode.NIL, expr.line));
        return;
      }
      // NOTE(kosinw): Handle compound procedure call
      compileTail(expr.value, unit);
    }
  )
);

type PrimitiveInstructionCompiler = {
  arity: number;
  call(unit: CompilationUnit, line: number): void;
};

/**
 * Creates a procedure which given a unit and a line number emits primitive call source code.
 * 
 * @param opcode an opcode
 * @param arity arity of primitive procedure
 * @returns a new primitive instruction compiler
 */
function makePrimitiveCompiler(opcode: FlourOpcode, arity: number): PrimitiveInstructionCompiler {
  return {
    arity,
    call: (unit: CompilationUnit, line: number) => {
      flour.emitInstruction(unit.chunk, flour.single(opcode, line));
    }
  };
}

// TODO(kosinw): Improve this beyond just arity checking, but also applicability checking?
const PRIMITIVE_PROCEDURES: Map<string, PrimitiveInstructionCompiler> = new Map([
  ["negate", makePrimitiveCompiler(FlourOpcode.NEGATE, 1)],
  ["not", makePrimitiveCompiler(FlourOpcode.NOT, 1)],
  ["log", makePrimitiveCompiler(FlourOpcode.LOG, 1)],
  ["+", makePrimitiveCompiler(FlourOpcode.ADD, 2)],
  ["-", makePrimitiveCompiler(FlourOpcode.SUBTRACT, 2)],
  ["*", makePrimitiveCompiler(FlourOpcode.MULTIPLY, 2)],
  ["/", makePrimitiveCompiler(FlourOpcode.DIVIDE, 2)],
  ["=", makePrimitiveCompiler(FlourOpcode.EQUAL, 2)],
  ["<", makePrimitiveCompiler(FlourOpcode.LESS, 2)],
  [">", makePrimitiveCompiler(FlourOpcode.GREATER, 2)],
  ["expt", makePrimitiveCompiler(FlourOpcode.POW, 2)],
  ["remainder", makePrimitiveCompiler(FlourOpcode.MOD, 2)],
]);

/**
 * @param expr a syntax tree
 * @param _unit a compilation unit
 * @returns true iff expr represents a call to a primitive procedure
 */
function isPrimitiveCall(expr: SyntaxTree, _unit: CompilationUnit): boolean {
  return expr.variant === SyntaxTreeVariant.LIST
    && expr.value[0]
    && expr.value[0].variant === SyntaxTreeVariant.ATOM
    && expr.value[0].value.variant === DatumVariant.SYMBOL
    && PRIMITIVE_PROCEDURES.has(expr.value[0].value.value);
}

/**
 * Dispatches to a primitive call based on syntax tree.
 * 
 * @param expr a syntax tree
 * @param unit a compilation unit
 */
function dispatchPrimitiveCall(expr: SyntaxTree, unit: CompilationUnit): void {
  assert(expr.variant === SyntaxTreeVariant.LIST
    && expr.value[0]
    && expr.value[0].variant === SyntaxTreeVariant.ATOM
    && expr.value[0].value.variant === DatumVariant.SYMBOL);

  const name = expr.value[0].value.value;

  const compiler = PRIMITIVE_PROCEDURES.get(name);
  assert(compiler);

  if (expr.value.length - 1 !== compiler.arity) {
    throw Error(`Procedure '${name}' called with the wrong number of arguments, expected ${compiler.arity}, instead got ${expr.value.length - 1}`);
  }

  compileTail(expr.value, unit);
  compiler.call(unit, expr.line);
}


/**
 * @param form name of special form
 * @returns a predicate function which takes (expr, unit) which checks if syntax tree
 */
function isSpecialForm(form: SpecialForm) {
  return function (expr: SyntaxTree, _unit: CompilationUnit): boolean {
    return expr.variant === SyntaxTreeVariant.LIST
      && expr.value[0]
      && expr.value[0].variant === SyntaxTreeVariant.ATOM
      && expr.value[0].value.variant === DatumVariant.SYMBOL
      && expr.value[0].value.value === form;
  }
}


/**
 * Dispatches to a variable binding expression based on syntax tree.
 * 
 * @param expr a syntax tree
 * @param unit a compilation
 */
function dispatchLet(expr: SyntaxTree, unit: CompilationUnit): void {
  assert(expr.variant === SyntaxTreeVariant.LIST
    && expr.value[0]
    && expr.value[0].variant === SyntaxTreeVariant.ATOM
    && expr.value[0].value.variant === DatumVariant.SYMBOL
    && expr.value[0].value.value === SpecialForm.LET);
}

/**
 * Emits bytecode corresponding to code in expression.
 * 
 * @param expr an abstract syntax tree
 * @param unit a compilation unit
 */
function compileExpression(expr: SyntaxTree, unit: CompilationUnit): void {
  return compileExpressionGeneric(expr, unit);
}

/**
 * Compiles the tail of an array of syntax trees (i.e. compile all but the first).
 * 
 * @param expr a list of abstract syntax trees
 * @param unit a compilation unit
 */
function compileTail(expr: SyntaxTree[], unit: CompilationUnit): void {
  expr.slice(1).forEach(expr => compileExpression(expr, unit));
}

/**
 * Entrypoint for the Ricecakes compiler.
 * Compiles source code string into Flour bytecode object file.
 * 
 * @param source a source program
 */
export function compile(source: string): flour.ObjectFile {
  const scanner = makeTokenizer(source);
  const parser = makeParser(scanner);
  const object = flour.makeObjectFile();
  const unit = makeUnit("<top>", object);

  while (!match(parser, TokenVariant.EOF)) {
    const syntaxTree = expression(parser);
    void compileExpression(syntaxTree, unit);
  }

  void unitEpilogue(unit);
  return object;
}