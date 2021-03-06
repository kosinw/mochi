///
/// File: flour/bindings.ts 
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

import { FlourPrimitiveMethodCodes } from "./primitives";

export type PrimitiveInstructions = Record<FlourPrimitiveMethodCodes, string>;

export const primitiveBindings: PrimitiveInstructions = {
  [FlourPrimitiveMethodCodes.SUBTRACT]: "-",
  [FlourPrimitiveMethodCodes.MULTIPLY]: "*",
  [FlourPrimitiveMethodCodes.ADD]: "+",
  [FlourPrimitiveMethodCodes.DIVIDE]: "/",
  [FlourPrimitiveMethodCodes.NOT]: "not",
  [FlourPrimitiveMethodCodes.NEGATE]: "negate",
  [FlourPrimitiveMethodCodes.ABS]: "abs",
  [FlourPrimitiveMethodCodes.NUMERICAL_EQ]: "=",
  [FlourPrimitiveMethodCodes.EQV]: "eqv?",
  [FlourPrimitiveMethodCodes.LESS]: "<",
  [FlourPrimitiveMethodCodes.LEQ]: "<=",
  [FlourPrimitiveMethodCodes.GREATER]: ">",
  [FlourPrimitiveMethodCodes.GEQ]: ">=",
  [FlourPrimitiveMethodCodes.CONS]: "cons",
  [FlourPrimitiveMethodCodes.CAR]: "car",
  [FlourPrimitiveMethodCodes.CDR]: "cdr",
  [FlourPrimitiveMethodCodes.IS_BOOLEAN]: "boolean?",
  [FlourPrimitiveMethodCodes.IS_CHARACTER]: "character?",
  [FlourPrimitiveMethodCodes.IS_FIXNUM]: "number?",
  [FlourPrimitiveMethodCodes.IS_NIL]: "null?",
  [FlourPrimitiveMethodCodes.IS_PROCEDURE]: "procedure?",
  [FlourPrimitiveMethodCodes.IS_SYMBOL]: "symbol?",
  [FlourPrimitiveMethodCodes.IS_PAIR]: "pair?",
  [FlourPrimitiveMethodCodes.PRINT]: "print",
};