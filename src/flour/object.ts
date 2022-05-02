///
/// File: flour/chunk.ts 
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

import { FlourOpcode } from "./opcode";

export type Ptr = number;

export enum BoxedTypeCode {
  PAIR,
  SYMBOL,
  CLOSURE,
  // STRING,
  // VECTOR
};

/**
 * Represents a boxed value in Flour bytecode specification.
 * A boxed value is one that is stored on the heap or in the
 * data section of a Flour chunk. Boxed values are arbitrary
 * in width and can be pointed to by values on the stack.
 */
export type BoxedValue =
  | { variant: BoxedTypeCode.PAIR, car: Ptr, cdr: Ptr }
  | { variant: BoxedTypeCode.SYMBOL, value: string }
  | { variant: BoxedTypeCode.CLOSURE, code: Ptr, upvalues: Ptr[] }; // NOTE(kosinw): Not sure if this is exactly correct

export enum UnboxedTypeCode {
  FIXNUM,
  NIL,
  BOOLEAN,
  PTR
};

/**
 * Represents an unboxed value in Flour bytecode specification.
 * An unboxed value is one that is directly stored in the Dango
 * virtual machine stack or in the constant section of a chunk.
 * Unboxed values are typically 8 bytes in width.
 */
export type UnboxedValue =
  | { variant: UnboxedTypeCode.FIXNUM, value: number }
  | { variant: UnboxedTypeCode.NIL }
  | { variant: UnboxedTypeCode.BOOLEAN, value: boolean }
  | { variant: UnboxedTypeCode.PTR, value: Ptr };
export const UNBOXED_BYTE_LENGTH = 8;

export enum UnboxedRepresentation{
  TYPE_CODE,
  DATA
}

export const UNBOXED_FORMAT = [
  [UnboxedRepresentation.TYPE_CODE, 1],
  [UnboxedRepresentation.DATA, 4]
];

/**
 * Represents a singular instruction in Flour bytecode specification.
 * An instruction consists of a byte-long opcode and an optional
 * argument which is typically a  4 byte memory reference.
 */
export type Instruction = {
  opcode: FlourOpcode,
  argument?: number
};

export enum InstructionRepresentation{
  OP_CODE,
  DATA
}

export const INSTRUCTION_FORMAT = [
  [InstructionRepresentation.OP_CODE, 1],
  [InstructionRepresentation.DATA, 4]
];


/**
 * Represents a singular "chunk" in Flour bytecode specification.
 * A chunk consists of a name, a list of all constants (unboxed values),
 * a list of all data objects (boxed values), and a list of all instructions.
 * Typically one chunk corresponds to one lambda in Scheme source language.
 */
export type Chunk = {
  // name: string;
  data_start: Number;
  instructions_start: Number;
  constants: UnboxedValue[];
  data: BoxedValue[];
  instructions: Instruction[];
};

/**
 * Represents an object file in Flour bytecode specification.
 * An object file consists of many chunks and represents an entire
 * program or a portion of a program compiled down to be executed
 * by the Dango virtual machine.
 */
export type ObjectFile = {
  chunks: Chunk[];
}