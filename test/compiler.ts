///
/// File: test/compiler.ts 
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

import assert from 'assert';
import * as ricecakes from '@module/compiler';

describe('lexer tests', function () {
  it('covers tokenizing a number', function () {
    const sourceCode = `42`;
    const scanner = ricecakes.tokenizer(sourceCode);
    const token = ricecakes.nextToken(scanner);

    assert.strictEqual(token.unwrap().variant, ricecakes.TokenVariant.DATUM);
    assert.strictEqual(ricecakes.nextToken(scanner).unwrap().variant, ricecakes.TokenVariant.EOF);
  });

  it('covers tokenizing a symbol', function () {
    const sourceCode = `foo-bar`;
    const scanner = ricecakes.tokenizer(sourceCode);
    const token = ricecakes.nextToken(scanner);

    assert.strictEqual(token.unwrap().variant, ricecakes.TokenVariant.DATUM);
    assert.strictEqual(ricecakes.nextToken(scanner).unwrap().variant, ricecakes.TokenVariant.EOF);
  });

  it('covers tokenizing a list', function () {
    const sourceCode = `(foo bar)`;
    const scanner = ricecakes.tokenizer(sourceCode);

    assert.strictEqual(ricecakes.nextToken(scanner).unwrap().variant, ricecakes.TokenVariant.LEFT_PAREN);
    assert.strictEqual(ricecakes.nextToken(scanner).unwrap().variant, ricecakes.TokenVariant.DATUM);
    assert.strictEqual(ricecakes.nextToken(scanner).unwrap().variant, ricecakes.TokenVariant.DATUM);
    assert.strictEqual(ricecakes.nextToken(scanner).unwrap().variant, ricecakes.TokenVariant.RIGHT_PAREN);
    assert.strictEqual(ricecakes.nextToken(scanner).unwrap().variant, ricecakes.TokenVariant.EOF);
  });

  it('covers tokenizing a dotted pair', function () {
    const sourceCode = "(foo . bar)";
    const scanner = ricecakes.tokenizer(sourceCode);

    assert.strictEqual(ricecakes.nextToken(scanner).unwrap().variant, ricecakes.TokenVariant.LEFT_PAREN);
    assert.strictEqual(ricecakes.nextToken(scanner).unwrap().variant, ricecakes.TokenVariant.DATUM);
    assert.strictEqual(ricecakes.nextToken(scanner).unwrap().variant, ricecakes.TokenVariant.DOT);
    assert.strictEqual(ricecakes.nextToken(scanner).unwrap().variant, ricecakes.TokenVariant.DATUM);
    assert.strictEqual(ricecakes.nextToken(scanner).unwrap().variant, ricecakes.TokenVariant.RIGHT_PAREN);
    assert.strictEqual(ricecakes.nextToken(scanner).unwrap().variant, ricecakes.TokenVariant.EOF);
  });

  it('covers tokenizing a split line', function () {
    const sourceCode = "foo\nbar\nbaz";
    const scanner = ricecakes.tokenizer(sourceCode);

    assert.strictEqual(ricecakes.nextToken(scanner).unwrap().variant, ricecakes.TokenVariant.DATUM);
    assert.strictEqual(ricecakes.nextToken(scanner).unwrap().variant, ricecakes.TokenVariant.DATUM);
    assert.strictEqual(ricecakes.nextToken(scanner).unwrap().variant, ricecakes.TokenVariant.DATUM);
    assert.strictEqual(ricecakes.nextToken(scanner).unwrap().variant, ricecakes.TokenVariant.EOF);
  });
});