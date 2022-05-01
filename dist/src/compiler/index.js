"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.compile = exports.tokenizer = exports.nextToken = void 0;
const multimethod_1 = require("@arrows/multimethod");
const result_1 = require("@badrap/result");
const assert_1 = __importDefault(require("assert"));
var DatumVariant;
(function (DatumVariant) {
    DatumVariant["FIXNUM"] = "fixnum";
    DatumVariant["BOOLEAN"] = "boolean";
    // CHARACTER,
    DatumVariant["SYMBOL"] = "symbol";
    // STRING
})(DatumVariant || (DatumVariant = {}));
;
var ReaderMacro;
(function (ReaderMacro) {
    ReaderMacro["QUOTE"] = "quote";
    ReaderMacro["QUASIQUOTE"] = "quasiquote";
    ReaderMacro["UNQUOTE"] = "unquote";
    ReaderMacro["UNQUOTE_SPLICING"] = "unquote-splicing";
})(ReaderMacro || (ReaderMacro = {}));
;
var TokenVariant;
(function (TokenVariant) {
    TokenVariant["DATUM"] = "datum";
    TokenVariant["LEFT_PAREN"] = "left-paren";
    TokenVariant["RIGHT_PAREN"] = "right-paren";
    TokenVariant["READER_MACRO"] = "reader-macro";
    TokenVariant["DOT"] = "dot";
    TokenVariant["EOF"] = "eof";
})(TokenVariant || (TokenVariant = {}));
;
const nextTokenGeneric = (0, multimethod_1.multi)((0, multimethod_1.method)(/^'/, (x) => ({ variant: TokenVariant.READER_MACRO, macro: ReaderMacro.QUOTE })), (0, multimethod_1.method)(/^\(/, (x) => ({ variant: TokenVariant.LEFT_PAREN })), (0, multimethod_1.method)(/^\)/, (x) => ({ variant: TokenVariant.RIGHT_PAREN })), (0, multimethod_1.method)(/^\./, (x) => ({ variant: TokenVariant.DOT })), (0, multimethod_1.method)(/^$/, (x) => ({ variant: TokenVariant.EOF })), (0, multimethod_1.method)((x) => Number.isInteger(+x), (x) => ({
    variant: TokenVariant.DATUM,
    value: {
        variant: DatumVariant.FIXNUM,
        value: +x
    }
})), (0, multimethod_1.method)((x) => ({
    variant: TokenVariant.DATUM,
    value: {
        variant: DatumVariant.SYMBOL,
        value: x
    }
})));
/**
 * Yields the next token in the stream, mutates the scanner.
 *
 * @param scanner a scanner
 * @returns (a result for) the next token in the stream if source is valid,
 *          otherwise a Result.err
 */
function nextToken(scanner) {
    // TODO(kosinw): Implement comments to work
    const substr = scanner
        .source
        .substring(scanner.current)
        .split(/[ \t]+/)
        .at(0);
    if (substr === undefined) {
        return result_1.Result.err(Error(`invariant violation: expected substr to not be undefined, scanner: ${scanner}`));
    }
    const match = substr.match(/^\r?\n/);
    if (match !== null) {
        scanner.line += 1;
        const delim = match.at(0);
        (0, assert_1.default)(delim !== undefined);
        scanner.current += delim.length;
        return nextToken(scanner);
    }
    const partialToken = nextTokenGeneric(substr);
    const { current: start, line } = scanner;
    const { length } = substr;
    scanner.current += length;
    return result_1.Result.ok({
        ...partialToken,
        start,
        length,
        line
    });
}
exports.nextToken = nextToken;
/**
 * Creates a new lexical scanner for Scheme objects.
 *
 * @param source source program
 */
function tokenizer(source) {
    return { current: 0, line: 1, source };
}
exports.tokenizer = tokenizer;
/**
 * Entrypoint for the Ricecakes Scheme compiler.
 * Compiles source code string into Flour bytecode object buffer.
 *
 * @param source a source program
 */
function compile(source) {
    const scanner = tokenizer(source);
    return result_1.Result.ok(0);
}
exports.compile = compile;
//# sourceMappingURL=index.js.map