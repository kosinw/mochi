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

import { FlourOpcode } from "./opcode";
import assert from "assert";

const WORD_SIZE = 4;
export type Ptr = number;

export enum BoxedValueVariant {
  PAIR,
  SYMBOL,
  // CLOSURE,
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

export enum UnboxedValueVariant {
  NIL = 0,
  FIXNUM,
  BOOLEAN,
  CHARACTER,
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
  | { variant: UnboxedValueVariant.PTR, value: Ptr }
  | { variant: UnboxedValueVariant.CHARACTER, value: string };

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

/**
 * Creates a new Flour string.
 * 
 * @param n a string
 * @returns a new Flour character
 */
export function character(n: string): UnboxedValue {
  // TODO(kosinw): Assert 32-bit signed integer.
  return {
    variant: UnboxedValueVariant.CHARACTER,
    value: n
  }
}

/**
 * Creates a new Flour boolean.
 * 
 * @param b a boolean
 * @returns a new Flour boolean
 */
export function boolean(b: boolean): UnboxedValue {
  return {
    variant: UnboxedValueVariant.BOOLEAN,
    value: b
  }
}

/**
 * Creates a new Flour nil.
 * 
 * @param b a boolean
 * @returns a new Flour boolean
 */
export function nil(): UnboxedValue {
  return {
    variant: UnboxedValueVariant.NIL
  }
}

function disassembleBoxed(boxed: BoxedValue): string {
  switch (boxed.variant) {
    case BoxedValueVariant.SYMBOL:
      return `<symbol *'${boxed.value}'>`;
    case BoxedValueVariant.PAIR:
      return `<pair *(${boxed.car} . ${boxed.cdr})>`;
  }
}

function disassembleUnboxed(chunk: Chunk, unboxed: UnboxedValue): string {
  switch (unboxed.variant) {
    case UnboxedValueVariant.BOOLEAN:
      return unboxed.value ? "#t" : "#f";
    case UnboxedValueVariant.FIXNUM:
      return unboxed.value.toString();
    case UnboxedValueVariant.NIL:
      return 'nil';
    case UnboxedValueVariant.PTR:
      return `${disassembleBoxed(chunk.data[unboxed.value])}`;
    case UnboxedValueVariant.CHARACTER:
      return unboxed.value;
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
  return ` ${offset.toString(16).padStart(8, '0')} '${disassembleUnboxed(chunk, chunk.constants[offset])}'`;
}

function disassembleComplexInstruction(
  chunk: Chunk,
  offset: number
): string {
  return ` ${offset.toString(16).padStart(8, '0')}`;
}

function disassembleJumpInstruction(
  offset: number,
  to: number
): string {
  const actualAddress = offset + to + instructionLength(
    complex(FlourOpcode.JUMP, 0xfffffff)
  );

  return ` ${to.toString(16).padStart(8, '0')} <offset ${actualAddress.toString(16).padStart(8, '0')}>`;
}

function disassembleSymbolInstruction(
  object: ObjectFile,
  offset: number
): string {
  return ` ${offset.toString(16).padStart(8, '0')} '${object._symbolReverseMapping.get(offset)}'`;
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
  previousLine: number | undefined,
  object: ObjectFile
): [number, string] {
  let line = `${offset.toString(16).padStart(8, '0')} `;

  if (instruction.line && (instruction.line !== previousLine)) {
    line += `${instruction.line.toString().padStart(4, ' ')} `;
  } else {
    line += `   | `;
  }

  line += `${FlourOpcode[instruction.opcode].padEnd(16, ' ')}`;

  switch (instruction.opcode) {
    case FlourOpcode.CONSTANT:
      {
        const { argument } = instruction;
        assert(argument !== undefined);
        line += disassembleConstantInstruction(chunk, argument);
        break;
      }
    case FlourOpcode.DEFINE_VARIABLE:
    case FlourOpcode.GET_VARIABLE:
      {
        const { argument } = instruction;
        assert(argument !== undefined);
        line += disassembleSymbolInstruction(object, argument);
        break;
      }
    case FlourOpcode.CLOSURE:
    case FlourOpcode.CALL:
      {
        const { argument } = instruction;
        assert(argument !== undefined);
        line += disassembleComplexInstruction(chunk, argument);
        break;
      }
    case FlourOpcode.JUMP:
    case FlourOpcode.JUMP_IF_FALSE:
      {
        const { argument } = instruction;
        assert(argument !== undefined);
        line += disassembleJumpInstruction(offset, argument);
        break;
      }
    default:
      break;
  }
  return [
    instructionLength(instruction) + offset,
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
 * Creates a new bytecode instruction which has an opcode and argument.
 * 
 * @param opcode an opcode
 * @returns an instruction which only takes an opcode
 */
export function complex(opcode: FlourOpcode, argument: number, line?: number): Instruction {
  return {
    opcode,
    argument,
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
  index: number;
  constants: UnboxedValue[];
  data: BoxedValue[];
  instructions: Instruction[];
  object: ObjectFile;
};

function disassembleChunk(chunk: Chunk, object: ObjectFile): string {
  const buffer = [`=== ${chunk.name} ===`];
  let offset = 0;
  let previousLine: number | undefined = -1;

  for (let instruction of chunk.instructions) {
    let [n, disas] = disassembleInstruction(instruction, chunk, offset, previousLine, object);
    buffer.push(disas);
    previousLine = instruction.line;
    offset = n;
  }

  return buffer.join('\n');
}

/**
 * Emits a bytecode instruction onto a Flour chunk.
 * 
 * @param chunk a chunk
 * @param instruction a flour instruction
 * @returns index of instruction
 */
export function emitInstruction(chunk: Chunk, instruction: Instruction): number {
  chunk.instructions.push(instruction);
  return chunk.instructions.length - 1;
}

/**
 * Emits a tail call.
 * 
 * @param chunk a chunk
 * @returns index of instruction
 */
export function tailCall(chunk: Chunk): number {
  chunk.instructions[chunk.instructions.length - 1] = complex(
    FlourOpcode.JUMP,
    -(
      instructionBlockLength(chunk.instructions.slice(0, -1))
      + instructionLength(complex(FlourOpcode.JUMP, 0xffffffff))
    )
  );
  return chunk.instructions.length - 1;
}

/**
 * Backpatches the jump instruction at offset to the current relative offset.
 * 
 * @param chunk a chunk
 * @param offset the offset of the jump to patch
 */
export function patchForwardJump(chunk: Chunk, offset: number): void {
  const displacement = instructionBlockLength(
    chunk
      .instructions
      .slice(offset + 1)
  );

  chunk.instructions[offset].argument = displacement;
}

/**
 * Gets length of chunk in bytes.
 * 
 * @param instructions a list of instructions
 */
function instructionBlockLength(instructions: Instruction[]): number {
  return instructions
    .reduce((p, n) => p + instructionLength(n), 0);
}

/**
 * @param chunk a chunk
 * @returns true iff chunk contains a tail call
 */
export function hasTailCall(chunk: Chunk): boolean {
  const lastInstruction = chunk.instructions.at(-1);
  assert(lastInstruction !== undefined);
  return lastInstruction.opcode === FlourOpcode.CALL;
}

/**
 * @param instruction an instruction
 * @returns the length of the instruction in bytes
 */
function instructionLength(instruction: Instruction): number {
  return instruction.argument !== undefined ? 1 + WORD_SIZE : 1;
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
  if (value.variant === UnboxedValueVariant.FIXNUM ||
    value.variant === UnboxedValueVariant.CHARACTER ||
    value.variant === UnboxedValueVariant.PTR) {
    const n = chunk.constants.push(value) - 1;
    return n;
  } else if (value.variant === UnboxedValueVariant.NIL) {
    return 0;
  } else if (value.value) {
    return 1;
  }

  return 2;
}

/**
 * Adds a new variable-length data to the given chunk.
 * 
 * @param chunk a chunk
 * @param value a value
 * @returns pointer to constant value which points to boxed value
 */
export function makeData(chunk: Chunk, value: BoxedValue): number {
  const n = chunk.data.push(value) - 1;
  return makeConstant(chunk, {
    variant: UnboxedValueVariant.PTR,
    value: n
  });
}

/**
 * Emits a CONSTANT bytecode instruction onto a Flour chunk.
 * 
 * @param chunk a chunk
 * @param value a constant value
 * @returns length of instruction in bytes
 */
export function emitConstantInstruction(chunk: Chunk, value: UnboxedValue, line?: number): number {
  return emitInstruction(chunk, complex(FlourOpcode.CONSTANT, makeConstant(chunk, value), line));
}

/**
 * @returns a new chunk
 */
export function makeChunk(name: string, object: ObjectFile, index: number): Chunk {
  return {
    name,
    constants: [
      nil(),
      boolean(true),
      boolean(false)
    ],
    data: [],
    instructions: [],
    object: object,
    index
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
  symbols: Map<string, number>;
  _symbolReverseMapping: Map<number, string>; // TODO(kosinw): Get rid of this instance
}

/**
 * @returns a new object file.
 */
export function makeObjectFile(): ObjectFile {
  return {
    chunks: new Map(),
    symbols: new Map(),
    _symbolReverseMapping: new Map()
  };
}

/**
 * Creates a new, unnamed chunk in object file.
 * 
 * @param object an object file
 * @param prefix a prefix for new chunk name
 */
export function allocateChunk(object: ObjectFile, name?: string): [Chunk, number] {
  const ix = object.chunks.size;
  if (name === undefined) {
    name = `(unnamed (chunk ${ix}))`;
  }
  const chunk = makeChunk(name, object, ix);
  assert(!object.chunks.has(name));
  object.chunks.set(name, chunk);
  return [chunk, ix];
}

/**
 * Resolves the name of a variable to its index in the object file.
 * 
 * @param object an object file
 * @param symbol a symbol
 * @returns the index for a given symbol
 */
export function resolveName(object: ObjectFile, symbol: string): number {
  if (object.symbols.has(symbol)) {
    const ix = object.symbols.get(symbol);
    assert(ix !== undefined);
    return ix;
  }

  object._symbolReverseMapping.set(object.symbols.size, symbol);
  object.symbols.set(symbol, object.symbols.size);
  return object.symbols.size - 1;
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