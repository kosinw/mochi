///
/// File: flour/object.ts 
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

import assert from "assert";
import { FlourOpcode } from "./opcode";

const WORD_SIZE = 4;
export type Ptr = number;

export enum BoxedValueVariant {
  PAIR = 0,
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
  | { variant: BoxedValueVariant.PAIR, car: Ptr, cdr: Ptr }
  | { variant: BoxedValueVariant.SYMBOL, value: string }
  | { variant: BoxedValueVariant.CLOSURE, code: Ptr, upvalues: Ptr[] }; // NOTE(kosinw): Not sure if this is exactly correct

export enum UnboxedValueVariant {
  NIL = 0,
  FIXNUM,
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
  | { variant: UnboxedValueVariant.FIXNUM, value: number }
  | { variant: UnboxedValueVariant.NIL }
  | { variant: UnboxedValueVariant.BOOLEAN, value: boolean }
  | { variant: UnboxedValueVariant.PTR, value: Ptr };

/**
 * Creates a new Flour fixed number.
 * 
 * @param n a number
 * @returns a new Flour fixnum
 */
export function fixnum(n: number): UnboxedValue {
  // TODO(kosinw): Assert 32-bit signed integer.
  return {
    variant: UnboxedValueVariant.FIXNUM,
    value: n
  }
}

function disassembleUnboxed(unboxed: UnboxedValue): string {
  switch (unboxed.variant) {
    case UnboxedValueVariant.BOOLEAN:
      return unboxed.value ? "#t" : "#f";
    case UnboxedValueVariant.FIXNUM:
      return unboxed.value.toString();
    case UnboxedValueVariant.NIL:
      return 'nil';
    case UnboxedValueVariant.PTR:
      return `<ptr ${unboxed.value}>`;
    default:
      throw Error('unknown unboxed value variant');
  }
}

/**
 * Represents a singular instruction in Flour bytecode specification.
 * An instruction consists of a byte-long opcode and an optional
 * argument which is typically a memory reference.
 */
export type Instruction = {
  opcode: FlourOpcode,
  line?: number,
  argument?: number
};

function disassembleConstantInstruction(
  chunk: Chunk,
  offset: number
): string {
  return ` ${offset.toString().padStart(4, '0')} '${disassembleUnboxed(chunk.constants[offset])}'`;
}

/**
 * Disassembles a single instruction.
 * 
 * @param instruction an instruction
 * @param chunk the chunk the instruction is from
 * @param offset the offset from the first instruction
 * @param previousLine the line number of the previous instruction
 * @returns a disassembly string and new offset
 */
function disassembleInstruction(
  instruction: Instruction,
  chunk: Chunk,
  offset: number,
  previousLine: number | undefined
): [number, string] {
  let line = `${offset.toString().padStart(4, '0')} `;

  if (instruction.line && (instruction.line !== previousLine)) {
    line += `${instruction.line.toString().padStart(4, ' ')} `;
  } else {
    line += `   | `;
  }

  line += `${FlourOpcode[instruction.opcode].padEnd(16, ' ')}`;

  switch (instruction.opcode) {
    case FlourOpcode.CONSTANT:
      const { argument } = instruction;
      assert(argument !== undefined);
      line += disassembleConstantInstruction(chunk, argument);
      break;
    default:
      break;
  }
  return [
    instruction.argument !== undefined ?
      1 + WORD_SIZE + offset :
      1 + offset,
    line
  ];
}

/**
 * Creates a new bytecode instruction which only has an opcode.
 * 
 * @param opcode an opcode
 * @returns an instruction which only takes an opcode
 */
export function single(opcode: FlourOpcode, line?: number): Instruction {
  return {
    opcode,
    line
  }
}

/**
 * Represents a singular "chunk" in Flour bytecode specification.
 * A chunk consists of a name, a list of all constants (unboxed values),
 * a list of all data objects (boxed values), and a list of all instructions.
 * Typically one chunk corresponds to one lambda in Scheme source language.
 */
export type Chunk = {
  name: string;
  constants: UnboxedValue[];
  data: BoxedValue[];
  instructions: Instruction[];
};

function disassembleChunk(chunk: Chunk, object: ObjectFile): string {
  const buffer = [`=== ${chunk.name} ===`];
  let offset = 0;
  let previousLine: number | undefined = -1;

  for (let instruction of chunk.instructions) {
    let [n, disas] = disassembleInstruction(instruction, chunk, offset, previousLine);
    buffer.push(disas);
    previousLine = instruction.line;
    offset = n;
  }

  return buffer.join('\n')
}

/**
 * Emits a bytecode instruction onto a Flour chunk.
 * 
 * @param chunk a chunk
 * @param instruction a flour instruction
 */
export function emitInstruction(chunk: Chunk, instruction: Instruction): void {
  chunk.instructions.push(instruction);
}

// TODO(kosinw): Make sure rep invariants aren't broken (like practical limits)
// to amount of constants in chunk.
/**
 * Adds a new constant to the given chunk.
 * 
 * @param chunk a chunk
 * @param value a constant value
 * @returns pointer to constant value
 */
function makeConstant(chunk: Chunk, value: UnboxedValue): number {
  const n = chunk.constants.push(value) - 1;
  return n;
}

/**
 * Emits a CONSTANT bytecode instruction onto a Flour chunk.
 * 
 * @param chunk a chunk
 * @param value a constant value
 */
export function emitConstantInstruction(chunk: Chunk, value: UnboxedValue, line?: number): void {
  chunk.instructions.push({
    opcode: FlourOpcode.CONSTANT,
    argument: makeConstant(chunk, value),
    line
  });
}

/**
 * @returns a new chunk
 */
export function makeChunk(name: string): Chunk {
  return {
    name,
    constants: [],
    data: [],
    instructions: []
  };
}

/**
 * Represents an object file in Flour bytecode specification.
 * An object file consists of many chunks and represents an entire
 * program or a portion of a program compiled down to be executed
 * by the Dango virtual machine.
 */
export type ObjectFile = {
  chunks: Map<string, Chunk>;
}

/**
 * @returns a new object file.
 */
export function makeObjectFile(): ObjectFile {
  return {
    chunks: new Map()
  };
}

/**
 * Returns the disassembled bytecode report for a given object file.
 * 
 * @param object an object file
 * @returns a disassembly of object file
 */
export function disassemble(object: ObjectFile): string {
  return [...object.chunks.values()]
    .map(chunk => disassembleChunk(chunk, object))
    .join('\n');
}