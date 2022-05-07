///
/// File: compiler/index.ts 
/// Copyright (c) 2022 Kosi Nwabueze and Anirudh Rahul
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


import util from "util";
import assert from "assert";
import invariant from "invariant";
import { Multi, multi, method } from "@arrows/multimethod";
import * as flour from "@module/flour";
import { FlourOpcode, FlourPrimitiveMethodCodes, primitiveBindings } from "@module/flour";
import exp from "constants";

////////////////////////////////////////////////////////
//
// TOKENIZER
//
////////////////////////////////////////////////////////

export enum DatumVariant {
  FIXNUM = 'fixnum',
  BOOLEAN = 'boolean',
  CHARACTER = 'character',
  SYMBOL = 'symbol',
  // STRING
};

/**
 * A Scheme datum as defined by the R5RS.
 */
export type Datum =
  | { variant: DatumVariant.FIXNUM, value: number }
  | { variant: DatumVariant.BOOLEAN, value: boolean }
  | { variant: DatumVariant.SYMBOL, value: string }
  | { variant: DatumVariant.CHARACTER, value: string };

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
  (x: Tokenizer): Token;
};

const CLOSING_PAREN = /(\)|\}|\])/;
const OPENING_PAREN = /(\(|\{|\[)/;

const nextTokenGeneric: NextTokenGeneric = multi(
  (x: Tokenizer) => peek(x),
  method("\n", (x: Tokenizer): Token => { // newline?
    x.current += 1;
    x.line += 1;
    return nextToken(x);
  }),
  method(/[ \t\r]/, (x: Tokenizer): Token => { // whitespace?
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
  method("#", (x: Tokenizer): Token => {
    x.current += 1;
    const hashGeneric: NextTokenGeneric = multi(
      (x: Tokenizer) => peek(x),
      method("t", makeTokenCombinator(TokenVariant.DATUM, { variant: DatumVariant.BOOLEAN, value: true })),
      method("f", makeTokenCombinator(TokenVariant.DATUM, { variant: DatumVariant.BOOLEAN, value: false })),
      method("\\", (x: Tokenizer): Token => {
        x.current += 1;
        const literal = peek(x) + peekDatum({ ...x, current: x.current + 1 });
        let value = literal.charAt(0);

        switch (literal) {
          case "space":
            value = " ";
            break;
          case "linefeed":
          case "newline":
            value = "\n";
            break;
          case "tab":
            value = "\t";
            break;
          case "return":
            value = "\r";
            break;
          default:
            // TODO(kosinw): Change this to add unicode characters + other shit ig
            invariant(
              literal.length === 1,
              `Expected character literal to only be one character long. Line ${x.line}.`
            );
            break;
        }

        const procedure = makeTokenCombinator(
          TokenVariant.DATUM,
          {
            variant: DatumVariant.CHARACTER,
            value
          },
          literal.length
        );

        return procedure(x);
      }),
      method((x: Tokenizer): Token => invariant(false, `Encountered unknown character after '#', ${peek(x)}.`))
    );

    return hashGeneric(x);
  }),
  method(isNumeric, (x: Tokenizer): Token => { // number?
    const datum = peekDatum(x);
    const value = +datum;

    invariant(!isNaN(value), `Expected a number, instead got ${datum}`);

    const procedure = makeTokenCombinator(
      TokenVariant.DATUM,
      {
        variant: DatumVariant.FIXNUM,
        value: value
      },
      datum.length
    );
    return procedure(x);
  }),
  method((x: Tokenizer): Token => { // else, symbol?
    const datum = peekDatum(x);
    const procedure = makeTokenCombinator(
      TokenVariant.DATUM,
      {
        variant: DatumVariant.SYMBOL,
        value: datum
      },
      datum.length
    );
    return procedure(x);
  })
);

/**
 * Yields the next available token in the stream, mutates the tokenizer.
 * 
 * @param scanner a tokenizer
 * @returns (a result for) the next token in the stream if source is valid,
 *          otherwise a Result.err
 */
export function nextToken(scanner: Tokenizer): Token {
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
function makeTokenCombinator<T>(
  variant: TokenVariant,
  value: T | undefined = undefined,
  n: number = 1
) {
  return (x: Tokenizer): Token => {
    x.current += n;
    return {
      variant: variant,
      // @ts-ignore
      value: value,
      length: n,
      start: x.current - n,
      line: x.line
    };
  }
}

/**
 * Returns if peek(t) is numeric or not.
 * 
 * @param t a tokenizer
 * @returns true iff a character is numeric
 */
function isNumeric(t: Tokenizer): boolean {
  const isNegative = (peek(t) === "-") && !Number.isNaN(+peek({ ...t, current: t.current + 1 }));
  return isNegative || !Number.isNaN(+peek(t));
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
function peekDatum(t: Tokenizer, formed: string = ''): string {
  const current = peek(t);

  if (/(\s|^$)/.test(current) || CLOSING_PAREN.test(current)) { // (union whitespace? right-paren? empty?)
    return formed;
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
  parser.current = nextToken(parser.scanner);
}

/**
 * Initializes a new parser.
 * 
 * @param scanner a tokenizer
 * @returns a new parser which fetches tokens from scanner
 */
export function makeParser(scanner: Tokenizer): Parser {
  const firstToken = nextToken(scanner);

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
    const subexpr = expressionGeneric(x);
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
      invariant(!match(x, TokenVariant.EOF), "Unexpected end-of-file character reached.");
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
    invariant(false, "Unexpected ')' chraracter reached.");
  }),
  method((x: Parser): SyntaxTree => {
    invariant(false, `Unexpected token, '${x.current.variant}' reached.`);
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
 * Represents a unit of code that is currently being compiled.
 */
type CompilationUnit = {
  readonly chunk: flour.Chunk;
  readonly objectFile: flour.ObjectFile;
};

/**
 * Constructs a new compilation unit, individual units are made for each procedure.
 * 
 * @param objectFile a flour object file
 * @returns a new compilation unit
 */
function makeUnit(name: string, objectFile: flour.ObjectFile): CompilationUnit {
  let chunk = objectFile.chunks.get(name);

  if (chunk === undefined) {
    const [_chunk, ix] = flour.allocateChunk(objectFile, name);
    chunk = _chunk;
    objectFile.chunks.set(name, chunk);
  }

  return {
    chunk: chunk,
    objectFile
  };
}

/**
 * Writes out epilogue for compilation unit.
 * 
 * @param unit a compilation unit
 * @returns parent compilation unit
 */
function unitEpilogue(unit: CompilationUnit): void {
  // TODO(kosinw): I don't think this does proper tail call for if expressions :thonk:
  // if (flour.hasTailCall(unit.chunk)) { flour.tailCall(unit.chunk); }
  flour.emitInstruction(unit.chunk, flour.single(FlourOpcode.RETURN));
}

type CompileDatumGeneric = Multi & {
  (datum: Datum, unit: CompilationUnit, line: number): void;
};


enum SpecialForm {
  LET = "let",
  IF = "if",
  LAMBDA = "lambda",
  BEGIN = "begin",
  DEFINE = "define",
  SET_BANG = "set!",
  QUOTE = "quote",
  AND = "and",
  OR = "or"
};

const compileDatum: CompileDatumGeneric = multi(
  (datum: Datum, unit: CompilationUnit, line: number) => datum.variant,
  method(DatumVariant.FIXNUM, (datum: Datum, unit: CompilationUnit, line: number) => {
    assert(datum.variant === DatumVariant.FIXNUM);
    flour.emitConstantInstruction(unit.chunk, flour.fixnum(datum.value), line);
  }),
  method(DatumVariant.BOOLEAN, (datum: Datum, unit: CompilationUnit, line: number) => {
    assert(datum.variant === DatumVariant.BOOLEAN);
    flour.emitConstantInstruction(unit.chunk, flour.boolean(datum.value), line);
  }),
  method(DatumVariant.SYMBOL, (datum: Datum, unit: CompilationUnit, line: number) => {
    assert(datum.variant === DatumVariant.SYMBOL);
    const local = flour.resolveName(unit.objectFile, datum.value);
    flour.emitInstruction(
      unit.chunk,
      flour.complex(FlourOpcode.GET_VARIABLE, local, line)
    );
  }),
  method(DatumVariant.CHARACTER, (datum: Datum, unit: CompilationUnit, line: number) => {
    assert(datum.variant === DatumVariant.CHARACTER);
    flour.emitConstantInstruction(unit.chunk, flour.character(datum.value), line);
  }),
  method((datum: Datum, unit: CompilationUnit) => {
    invariant(false, `Compiling unknown datum, ${util.inspect(datum)}`);
  })
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
  method(isSpecialForm(SpecialForm.IF), dispatchConditional),
  method(isSpecialForm(SpecialForm.LAMBDA), dispatchLambda),
  method(isSpecialForm(SpecialForm.BEGIN), dispatchBegin),
  method(isSpecialForm(SpecialForm.DEFINE), dispatchDefine),
  method(isSpecialForm(SpecialForm.SET_BANG), dispatchSet),
  method(isSpecialForm(SpecialForm.QUOTE), dispatchQuote),
  method(isSpecialForm(SpecialForm.AND), dispatchAnd),
  method(isSpecialForm(SpecialForm.OR), dispatchOr),
  method(
    SyntaxTreeVariant.LIST,
    (expr: SyntaxTree, unit: CompilationUnit, line: number) => {
      assert(expr.variant === SyntaxTreeVariant.LIST);
      if (expr.value.length === 0) {
        // NOTE(kosinw): Empty list is special case, should make a nil
        flour.emitConstantInstruction(unit.chunk, flour.nil(), line);
        return;
      }
      // NOTE(kosinw): Handle compound procedure call
      void compileTail(expr.value, unit);
      const procedure = expr.value[0];
      assert(procedure !== undefined)
      void compileExpression(procedure, unit);
      flour.emitInstruction(
        unit.chunk,
        flour.complex(FlourOpcode.CALL, expr.value.length - 1, expr.line)
      );
    }
  )
);

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

type LetBinding = {
  name: string;
  expr: SyntaxTree;
  line: number;
};

/**
 * Dispatches to a variable binding expression based on syntax tree.
 * 
 * @param expr a syntax tree
 * @param unit a compilation unit
 */
function dispatchLet(expr: SyntaxTree, unit: CompilationUnit): void {
  assert(
    expr.variant === SyntaxTreeVariant.LIST
    && expr.value[0]
    && expr.value[0].variant === SyntaxTreeVariant.ATOM
    && expr.value[0].value.variant === DatumVariant.SYMBOL
    && expr.value[0].value.value === SpecialForm.LET
  );

  const bindingList = expr.value[1];

  invariant(
    bindingList &&
    bindingList.variant === SyntaxTreeVariant.LIST,
    `Expected ${util.inspect(bindingList)} to be a proper list. Line ${expr.line}.`
  );

  const bindings = (): LetBinding[] => bindingList
    .value
    .map((t): LetBinding => {
      invariant(
        t.variant === SyntaxTreeVariant.LIST,
        `Expected ${util.inspect(t)} to be a proper list. Line ${t.line}.`
      );

      invariant(
        t.value[0].variant === SyntaxTreeVariant.ATOM &&
        t.value[0].value.variant === DatumVariant.SYMBOL,
        `Expected ${util.inspect(t.value[0])} to be a symbol. Line ${t.line}.`
      );

      return {
        name: t.value[0]?.value.value,
        expr: t.value[1],
        line: t.value[0]?.line
      };
    });

  const letBindings = bindings();

  letBindings.slice().reverse().forEach(binding => {
    void compileExpression(binding.expr, unit);
  });

  const [nextChunk, ix] = flour.allocateChunk(unit.objectFile);

  flour.emitInstruction(
    unit.chunk,
    flour.closure(letBindings.length, ix, expr.line)
  );

  flour.emitInstruction(
    unit.chunk,
    flour.complex(FlourOpcode.CALL, letBindings.length, expr.line)
  );

  letBindings.forEach(binding => {
    const local = flour.resolveName(unit.objectFile, binding.name);
    flour.emitInstruction(
      nextChunk,
      flour.complex(FlourOpcode.DEFINE_VARIABLE, local, binding.line)
    );
  });

  const subexpr = expr.value.slice(2);

  invariant(
    subexpr.length > 0,
    `Expected ${util.inspect(subexpr)} to be a sequence of expressions. Line ${expr.line}.`
  );

  void compileSequence(subexpr, {
    chunk: nextChunk,
    objectFile: unit.objectFile
  });

  flour.emitInstruction(
    nextChunk,
    flour.single(FlourOpcode.RETURN)
  );
}

/**
 * Dispatches to a quoted expression based on syntax tree.
 * 
 * @param expr a syntax tree
 * @param unit a compilation unit
 */
function dispatchQuote(expr: SyntaxTree, unit: CompilationUnit): void {
  assert(
    expr.variant === SyntaxTreeVariant.LIST
    && expr.value[0]
    && expr.value[0].variant === SyntaxTreeVariant.ATOM
    && expr.value[0].value.variant === DatumVariant.SYMBOL
    && expr.value[0].value.value === SpecialForm.QUOTE
  );

  // TODO(kosinw): Add quotes with lists (not sure how this works?)
  const subexpr = expr.value[1];

  invariant(
    subexpr.variant === SyntaxTreeVariant.ATOM,
    `Expected quoted expression to be an atom. Line ${expr.line}.`
  );

  switch (subexpr.value.variant) {
    case DatumVariant.SYMBOL:
      flour.emitInstruction(
        unit.chunk,
        flour.complex(
          FlourOpcode.CONSTANT,
          flour.makeData(unit.chunk, {
            variant: flour.BoxedValueVariant.SYMBOL,
            value: subexpr.value.value
          })
        )
      );
      break;
    default:
      compileDatum(subexpr.value, unit, subexpr.line);
      break;
  }
}

/**
 * Dispatches to a single variable binding expression based on syntax tree.
 * 
 * @param expr a syntax tree
 * @param unit a compilation unit
 */
function dispatchDefine(expr: SyntaxTree, unit: CompilationUnit): void {
  assert(
    expr.variant === SyntaxTreeVariant.LIST
    && expr.value[0]
    && expr.value[0].variant === SyntaxTreeVariant.ATOM
    && expr.value[0].value.variant === DatumVariant.SYMBOL
    && expr.value[0].value.value === SpecialForm.DEFINE
  );

  const variable = expr.value[1];
  const subexpr = expr.value[2];

  invariant(
    variable !== undefined &&
    variable.variant === SyntaxTreeVariant.ATOM &&
    variable.value.variant === DatumVariant.SYMBOL,
    `Expected ${util.inspect(variable)} to be a symbol. Line ${variable.line}.`
  );

  invariant(
    subexpr !== undefined,
    `Expected ${util.inspect(subexpr)} to be an expression. Line ${subexpr.line}.`
  );

  void compileExpression(subexpr, unit);

  const local = flour.resolveName(unit.objectFile, variable.value.value);

  flour.emitInstruction(
    unit.chunk,
    flour.complex(
      FlourOpcode.DEFINE_VARIABLE,
      local,
      expr.line
    )
  );

  flour.emitInstruction(
    unit.chunk,
    flour.complex(
      FlourOpcode.GET_VARIABLE,
      local,
      expr.line
    )
  );
}

/**
 * Dispatches to a single variable mutation expression based on syntax tree.
 * 
 * @param expr a syntax tree
 * @param unit a compilation unit
 */
function dispatchSet(expr: SyntaxTree, unit: CompilationUnit): void {
  assert(
    expr.variant === SyntaxTreeVariant.LIST
    && expr.value[0]
    && expr.value[0].variant === SyntaxTreeVariant.ATOM
    && expr.value[0].value.variant === DatumVariant.SYMBOL
    && expr.value[0].value.value === SpecialForm.SET_BANG
  );

  const variable = expr.value[1];
  const subexpr = expr.value[2];

  invariant(
    variable !== undefined &&
    variable.variant === SyntaxTreeVariant.ATOM &&
    variable.value.variant === DatumVariant.SYMBOL,
    `Expected ${util.inspect(variable)} to be a symbol. Line ${variable.line}.`
  );

  invariant(
    subexpr !== undefined,
    `Expected ${util.inspect(subexpr)} to be an expression. Line ${subexpr.line}.`
  );

  void compileExpression(subexpr, unit);

  const local = flour.resolveName(unit.objectFile, variable.value.value);

  flour.emitInstruction(
    unit.chunk,
    flour.complex(
      FlourOpcode.SET_VARIABLE,
      local,
      expr.line
    )
  );

  flour.emitInstruction(
    unit.chunk,
    flour.complex(
      FlourOpcode.GET_VARIABLE,
      local,
      expr.line
    )
  );
}

/**
 * Dispatches to a conditional expression based on syntax tree.
 * 
 * @param expr a syntax tree
 * @param unit a compilation unit
 */
function dispatchConditional(expr: SyntaxTree, unit: CompilationUnit): void {
  assert(
    expr.variant === SyntaxTreeVariant.LIST
    && expr.value[0]
    && expr.value[0].variant === SyntaxTreeVariant.ATOM
    && expr.value[0].value.variant === DatumVariant.SYMBOL
    && expr.value[0].value.value === SpecialForm.IF
  );

  const test = expr.value[1];

  invariant(
    test !== undefined,
    `Expected ${util.inspect(test)} to be an expression. Line ${expr.line}.`
  );

  void compileExpression(test, unit);

  let jump = flour.emitInstruction(
    unit.chunk,
    flour.complex(FlourOpcode.JUMP_IF_FALSE, 0xffffffff, test.line)
  );

  const consequence = expr.value[2];

  invariant(
    test !== undefined,
    `Expected ${util.inspect(test)} to be an expression. Line ${test.line}.`
  );

  void compileExpression(consequence, unit);

  const alternative = expr.value[3];

  if (alternative !== undefined) {
    const prevJump = jump;

    jump = flour.emitInstruction(
      unit.chunk,
      flour.complex(FlourOpcode.JUMP, 0xffffffff, consequence.line)
    );

    flour.patchForwardJump(unit.chunk, prevJump);

    void compileExpression(alternative, unit);
  }

  flour.patchForwardJump(unit.chunk, jump);
}

function dispatchAnd(expr: SyntaxTree, unit: CompilationUnit): void {
  assert(
    expr.variant === SyntaxTreeVariant.LIST
    && expr.value[0]
    && expr.value[0].variant === SyntaxTreeVariant.ATOM
    && expr.value[0].value.variant === DatumVariant.SYMBOL
    && expr.value[0].value.value === SpecialForm.AND
  );

  void compileExpression(
    transformConjunction(expr.value.slice(1), true, expr.start, expr.length, expr.line),
    unit
  );
}

function dispatchOr(expr: SyntaxTree, unit: CompilationUnit): void {
  assert(
    expr.variant === SyntaxTreeVariant.LIST
    && expr.value[0]
    && expr.value[0].variant === SyntaxTreeVariant.ATOM
    && expr.value[0].value.variant === DatumVariant.SYMBOL
    && expr.value[0].value.value === SpecialForm.OR
  );

  void compileExpression(
    transformConjunction(expr.value.slice(1), false, expr.start, expr.length, expr.line),
    unit
  );
}

/**
 * Transforms a conjunctional expression into a tree of conditional expressions.
 * 
 * @param expr a syntax tree
 */
function transformConjunction(expr: SyntaxTree[], and: boolean, start: number, length: number, line: number): SyntaxTree {
  if (expr.length === 0) {
    return {
      variant: SyntaxTreeVariant.ATOM,
      value: { variant: DatumVariant.BOOLEAN, value: and },
      start: start,
      length: length,
      line: line
    };
  } else if (expr.length === 1) {
    return expr[0];
  }

  const test = expr[0];

  assert(test !== undefined);

  const failExpr: SyntaxTree =  {
    variant: SyntaxTreeVariant.ATOM,
    value: { variant: DatumVariant.BOOLEAN, value: !and },
    length: test.length,
    line: test.line,
    start: test.start
  };

  const continueExpr: SyntaxTree = transformConjunction(expr.slice(1), and, start, length, line);

  return {
    variant: SyntaxTreeVariant.LIST,
    value: [
      {
        variant: SyntaxTreeVariant.ATOM,
        value: { variant: DatumVariant.SYMBOL, value: "if" },
        length: test.length,
        line: test.line,
        start: test.start
      },
      test,
      and ? continueExpr : test,
      and ? failExpr : continueExpr
    ],
    start: start,
    length: length,
    line: line
  };
}

/**
 * Dispatches to a lambda expression based on syntax tree.
 * 
 * @param expr a syntax tree
 * @param unit a compilation unit
 */
function dispatchLambda(expr: SyntaxTree, unit: CompilationUnit): void {
  assert(
    expr.variant === SyntaxTreeVariant.LIST
    && expr.value[0]
    && expr.value[0].variant === SyntaxTreeVariant.ATOM
    && expr.value[0].value.variant === DatumVariant.SYMBOL
    && expr.value[0].value.value === SpecialForm.LAMBDA
  );

  const parameterList = expr.value[1];
  const body = expr.value.slice(2);

  // TOOD(kosinw): Add support for variadic procedures
  invariant(
    parameterList !== undefined &&
    parameterList.variant === SyntaxTreeVariant.LIST,
    `Expected ${util.inspect(parameterList)} to be a list of parameters. Line ${expr.line}.`
  );

  invariant(
    body.length > 0,
    `Expected ${util.inspect(body)} to be a list of parameters. Line ${expr.line}.`
  );

  const [chunk, ix] = flour.allocateChunk(unit.objectFile);
  const nextUnit: CompilationUnit = { chunk, objectFile: unit.objectFile };

  parameterList.value.reverse().forEach(parameter => {
    invariant(
      parameter.variant === SyntaxTreeVariant.ATOM &&
      parameter.value.variant === DatumVariant.SYMBOL,
      `Expected ${util.inspect(parameter)} to be a symbol. Line ${expr.line}.`
    );

    flour.emitInstruction(
      chunk,
      flour.complex(
        FlourOpcode.DEFINE_VARIABLE,
        flour.resolveName(unit.objectFile, parameter.value.value)
      )
    );
  });

  void compileSequence(body, nextUnit);
  void unitEpilogue(nextUnit);

  flour.emitInstruction(
    unit.chunk,
    flour.closure(parameterList.value.length, ix, expr.line)
  );
}

/**
 * Dispatches to a begin expression based on syntax tree.
 * 
 * @param expr a syntax tree
 * @param unit a compilation unit
 */
function dispatchBegin(expr: SyntaxTree, unit: CompilationUnit): void {
  assert(
    expr.variant === SyntaxTreeVariant.LIST
    && expr.value[0]
    && expr.value[0].variant === SyntaxTreeVariant.ATOM
    && expr.value[0].value.variant === DatumVariant.SYMBOL
    && expr.value[0].value.value === SpecialForm.BEGIN
  );

  void compileSequence(expr.value.slice(1), unit);
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
 * Emits bytecode corresponding to code in sequence of expressions.
 * 
 * @param expr a sequence of abstract syntax tree
 * @param unit a compilation unit
 */
function compileSequence(expr: SyntaxTree[], unit: CompilationUnit): void {
  invariant(
    expr.length > 0,
    `Expected ${util.inspect(expr)} to be a sequence of expressions.`
  );

  expr.slice(0, -1).forEach(subexpr => {
    void compileExpression(subexpr, unit);
    flour.emitInstruction(unit.chunk, flour.single(FlourOpcode.POP, subexpr.line));
  });

  const last = expr.at(-1);
  assert(last !== undefined);

  void compileExpression(last, unit);
}

/**
 * Compiles the tail of an array of syntax trees (i.e. compile all but the first).
 * 
 * @param expr a list of abstract syntax trees
 * @param unit a compilation unit
 */
function compileTail(expr: SyntaxTree[], unit: CompilationUnit): void {
  expr.slice(1).forEach(expr => void compileExpression(expr, unit));
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

  const unit = makeUnit("*module*", object);

  while (!match(parser, TokenVariant.EOF)) {
    const syntaxTree = expression(parser);
    void compileExpression(syntaxTree, unit);
  }

  void unitEpilogue(unit);

  return object;
}