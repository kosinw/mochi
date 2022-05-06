///
/// File: test/compiler.ts 
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

import assert from 'assert';
import * as ricecakes from '@module/compiler';
import * as flour from '@module/flour';

describe('compiler tests', function () {
  it('covers compiling a number', function () {
    const sourceCode = '42';
    const object = ricecakes.compile(sourceCode);

    // console.log(flour.disassemble(object));
  });

  it('covers compiling a nil object', function () {
    const sourceCode = '()';
    const object = ricecakes.compile(sourceCode);

    // console.log(flour.disassemble(object));
  });

  it('covers compiling a unary primitive call', function () {
    const sourceCode = '(* 0001 42 993 44444\n885\n26 1237)';
    const object = ricecakes.compile(sourceCode);

    // console.log(flour.disassemble(object));
  });

  it('covers consing up a one element list', function () {
    const sourceCode = '(cons 1 ())';
    const object = ricecakes.compile(sourceCode);

    console.log(flour.disassemble(object));
  });
})

describe('parser tests', function () {
  it('covers parsing a number', function () {
    const sourceCode = '42';
    const scanner = ricecakes.makeTokenizer(sourceCode);
    const parser = ricecakes.makeParser(scanner);

    // console.log(ricecakes.expression(parser));
  });

  it('covers parsing a symbol', function () {
    const sourceCode = 'gangster';
    const scanner = ricecakes.makeTokenizer(sourceCode);
    const parser = ricecakes.makeParser(scanner);

    // console.log(ricecakes.expression(parser));
  });

  it('covers parsing a one element list', function () {
    const sourceCode = '(foo)';
    const scanner = ricecakes.makeTokenizer(sourceCode);
    const parser = ricecakes.makeParser(scanner);

    // console.dir(ricecakes.expression(parser), { depth: null });
  });

  it('covers parsing a three element list', function () {
    const sourceCode = '(+ 2 3)';
    const scanner = ricecakes.makeTokenizer(sourceCode);
    const parser = ricecakes.makeParser(scanner);

    // console.dir(ricecakes.expression(parser), { depth: null });
  });

  it('covers parsing a reader macro', function () {
    const sourceCode = "'(+ 2 3)";
    const scanner = ricecakes.makeTokenizer(sourceCode);
    const parser = ricecakes.makeParser(scanner);

    // console.dir(ricecakes.expression(parser), { depth: null });
  });

  it('covers parsing a factorial program', function () {
    const sourceCode = `
    (define (factorial n)
      (if (< n 1)
        1
        (* n (factorial (- n 1)))))
    `;
    const scanner = ricecakes.makeTokenizer(sourceCode);
    const parser = ricecakes.makeParser(scanner);

    // console.dir(ricecakes.expression(parser), { depth: null });
  });

  it('covers parsing multiple functions', function () {
    const sourceCode = `
    (define (factorial n)
      (if (< n 1)
        1
        (* n (factorial (- n 1)))))
    
      (define (smacktorial n) (+ n 1))
    `;
    const scanner = ricecakes.makeTokenizer(sourceCode);
    const parser = ricecakes.makeParser(scanner);

    // console.dir(ricecakes.expression(parser), { depth: null });
    // console.dir(ricecakes.expression(parser), { depth: null });
  });
});

describe('lexer tests', function () {
  it('covers tokenizing a number', function () {
    const sourceCode = `42`;
    const scanner = ricecakes.makeTokenizer(sourceCode);
    const token = ricecakes.nextToken(scanner);

    assert.strictEqual(token.variant, ricecakes.TokenVariant.DATUM);
    assert.strictEqual(ricecakes.nextToken(scanner).variant, ricecakes.TokenVariant.EOF);
  });

  it('covers tokenizing a symbol', function () {
    const sourceCode = `foo-bar`;
    const scanner = ricecakes.makeTokenizer(sourceCode);
    const token = ricecakes.nextToken(scanner);

    assert.strictEqual(token.variant, ricecakes.TokenVariant.DATUM);
    assert.strictEqual(ricecakes.nextToken(scanner).variant, ricecakes.TokenVariant.EOF);
  });

  it('covers tokenizing a list', function () {
    const sourceCode = `(foo bar)`;
    const scanner = ricecakes.makeTokenizer(sourceCode);

    assert.strictEqual(ricecakes.nextToken(scanner).variant, ricecakes.TokenVariant.LEFT_PAREN);
    assert.strictEqual(ricecakes.nextToken(scanner).variant, ricecakes.TokenVariant.DATUM);
    assert.strictEqual(ricecakes.nextToken(scanner).variant, ricecakes.TokenVariant.DATUM);
    assert.strictEqual(ricecakes.nextToken(scanner).variant, ricecakes.TokenVariant.RIGHT_PAREN);
    assert.strictEqual(ricecakes.nextToken(scanner).variant, ricecakes.TokenVariant.EOF);
  });

  it('covers tokenizing a dotted pair', function () {
    const sourceCode = "(foo . bar)";
    const scanner = ricecakes.makeTokenizer(sourceCode);

    assert.strictEqual(ricecakes.nextToken(scanner).variant, ricecakes.TokenVariant.LEFT_PAREN);
    assert.strictEqual(ricecakes.nextToken(scanner).variant, ricecakes.TokenVariant.DATUM);
    assert.strictEqual(ricecakes.nextToken(scanner).variant, ricecakes.TokenVariant.DOT);
    assert.strictEqual(ricecakes.nextToken(scanner).variant, ricecakes.TokenVariant.DATUM);
    assert.strictEqual(ricecakes.nextToken(scanner).variant, ricecakes.TokenVariant.RIGHT_PAREN);
    assert.strictEqual(ricecakes.nextToken(scanner).variant, ricecakes.TokenVariant.EOF);
  });

  it('covers tokenizing a split line', function () {
    const sourceCode = "foo\nbar\nbaz";
    const scanner = ricecakes.makeTokenizer(sourceCode);

    assert.strictEqual(ricecakes.nextToken(scanner).variant, ricecakes.TokenVariant.DATUM);
    assert.strictEqual(ricecakes.nextToken(scanner).variant, ricecakes.TokenVariant.DATUM);
    assert.strictEqual(ricecakes.nextToken(scanner).variant, ricecakes.TokenVariant.DATUM);
    assert.strictEqual(ricecakes.nextToken(scanner).variant, ricecakes.TokenVariant.EOF);
  });
});