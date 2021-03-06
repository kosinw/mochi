///
/// File: flour/serde.ts 
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

import * as flour from ".";
import struct from "python-struct";
import { Buffer } from 'buffer';
import { multi, method, Multi } from "@arrows/multimethod";
import assert from "assert";

/**
 * Represents a binary section in Flour bytecode format.
 */
interface BinarySection {
  serialize(): Buffer;
}

///////////////////////////////////////////////////////////////////
//
// CHUNKS
//
///////////////////////////////////////////////////////////////////

class ChunkHeader implements BinarySection {
  public readonly name: string;
  public readonly dataStart: number;
  public readonly instructionsStart: number;

  public constructor(
    name: string,
    dataStart: number,
    instructionsStart: number
  ) {
    this.name = name;
    this.dataStart = dataStart;
    this.instructionsStart = instructionsStart;
  }

  public serialize(): Buffer {
    return struct.pack(`>8sII`, [
      this.name.slice(0, 8),
      this.dataStart,
      this.instructionsStart
    ]);
  }
}

export const calculateConstEncoding = (constants: flour.UnboxedValue[]): string =>
  `>` + constants.map(c => "Q").join("");

type SerializeConstantGeneric = Multi & {
  (x: flour.UnboxedValue, ptrOffset: number): Buffer;
};

class ChunkConstantSection implements BinarySection {
  private readonly constants: flour.UnboxedValue[];
  private readonly offset: number;
  private readonly offsetTable: number[];

  public constructor(
    offset: number,
    constants: flour.UnboxedValue[],
    offsetTable: number[]
  ) {
    this.offset = offset;
    this.constants = constants;
    this.offsetTable = offsetTable;
  }

  public get encoding(): string {
    return calculateConstEncoding(this.constants);
  }

  public get size(): number {
    return struct.sizeOf(this.encoding);
  }

  public serialize(): Buffer {
    const serializeConstantGeneric: SerializeConstantGeneric = multi(
      (x: flour.UnboxedValue, ptrOffset: number) => x.variant,
      method(flour.UnboxedValueVariant.FIXNUM,
        (x: flour.UnboxedValue, ptrOffset: number): Buffer => {
          assert(x.variant === flour.UnboxedValueVariant.FIXNUM);
          return struct.pack(">Bixxx", [
            x.variant,
            x.value
          ]);
        }),
      method(flour.UnboxedValueVariant.BOOLEAN,
        (x: flour.UnboxedValue, ptrOffset: number): Buffer => {
          assert(x.variant === flour.UnboxedValueVariant.BOOLEAN);
          return struct.pack(">Bxxx?xxx", [
            x.variant,
            x.value
          ]);
        }),
      method(flour.UnboxedValueVariant.NIL,
        (x: flour.UnboxedValue, ptrOffset: number): Buffer => {
          assert(x.variant === flour.UnboxedValueVariant.NIL);
          return struct.pack(">Bxxxxxxx", [x.variant]);
        }),
      method(flour.UnboxedValueVariant.CHARACTER,
        (x: flour.UnboxedValue, ptrOffset: number): Buffer => {
          assert(x.variant === flour.UnboxedValueVariant.CHARACTER);
          return struct.pack(">Bcxxxxxx", [
            x.variant,
            x.value.charAt(0)
          ]);
        }),
      method(flour.UnboxedValueVariant.PTR,
        (x: flour.UnboxedValue, ptrOffset: number): Buffer => {
          assert(x.variant === flour.UnboxedValueVariant.PTR);
          return struct.pack(">BIxxx", [
            x.variant,
            this.offsetTable[x.value] + ptrOffset
          ]);
        }),
    );

    const ptrOffset = this.offset + this.size;

    const serializeConstant = (constant: flour.UnboxedValue): Buffer =>
      serializeConstantGeneric(constant, ptrOffset);

    const result = Buffer.concat(this.constants.map(serializeConstant));
    assert(result.length === this.size);
    return result;
  }
}

type SerializeBoxedGeneric = Multi & {
  (x: flour.BoxedValue): Buffer;
};

// Calculates next highest power of 2.
function nextPowerOf2(v: number) {
  let p: number = 2;
  while (v >>= 1) {
    p <<= 1;
  }
  return p;
}

// TODO(kosinw): How do we deal with pair pointers without knowing
// offset?
const serializeBoxed: SerializeBoxedGeneric = multi(
  (x: flour.BoxedValue) => x.variant,
  method(flour.BoxedValueVariant.SYMBOL, (x: flour.BoxedValue) => {
    assert(x.variant === flour.BoxedValueVariant.SYMBOL);
    const strlen = nextPowerOf2(x.value.length + 1 + 1);
    return struct.pack(`>B${strlen - 1}s`, [
      x.variant,
      x.value
    ])
  })
);

class ChunkDataSection implements BinarySection {
  public constructor(
    private readonly dataStart: number,
    private readonly data: flour.BoxedValue[]
  ) {
  }

  public serialize(): Buffer {
    const result = Buffer.concat(this.data.map(serializeBoxed));
    return result;
  }
}

class ChunkInstructionSection implements BinarySection {
  public constructor(
    private readonly instructions: flour.Instruction[]
  ) { }

  public serialize(): Buffer {
    const serializeInstruction = (instruction: flour.Instruction): Buffer => {
      if (instruction.argument !== undefined) {
        return struct.pack(">BI", [instruction.opcode, instruction.argument]);
      } else {
        return struct.pack(">B", [instruction.opcode]);
      }
    };

    const result = Buffer.concat(this.instructions.map(serializeInstruction));
    return result;
  }
}

function generateOffsetTable(boxedValues: flour.BoxedValue[]): number[] {
  let cursor = 0;
  const result: number[] = [];

  for (const value of boxedValues) {
    result.push(cursor);
    cursor += serializeBoxed(value).byteLength;
  }

  return result;
}

function serializeChunk(chunk: flour.Chunk, offset: number): Buffer {
  const headerLength = 16;
  const dataOffsetTable = generateOffsetTable(chunk.data);
  const constantSection = new ChunkConstantSection(offset + headerLength, chunk.constants, dataOffsetTable).serialize();
  const dataStart = headerLength + constantSection.byteLength + offset;
  const dataSection = new ChunkDataSection(dataStart, chunk.data).serialize();
  const instructionStart = dataStart + dataSection.byteLength;
  const instructionSection = new ChunkInstructionSection(chunk.instructions).serialize();
  const header = new ChunkHeader(chunk.name, dataStart, instructionStart).serialize();

  // console.log(`header:`, header);
  // console.log(`.const:`, constantSection);
  // console.log(`.data:`, dataSection);
  // console.log(`.text:`, instructionSection);

  return Buffer.concat([
    header,
    constantSection,
    dataSection,
    instructionSection
  ]);
}

///////////////////////////////////////////////////////////////////
//
// OBJECT FILES
//
///////////////////////////////////////////////////////////////////

/**
 * Represents the binary encoding of an object file header.
 */
class ObjectFileHeader implements BinarySection {
  private readonly identifier: string = "FLOUR";

  public constructor(private readonly chunkOffsets: number[]) { }

  private get numChunks(): number {
    return this.chunkOffsets.length;
  }

  public serialize(): Buffer {
    const ints = this.chunkOffsets.map(x => "I").join("");
    return struct.pack(`>8sI${ints}`, [
      this.identifier,
      this.numChunks,
      ...this.chunkOffsets
    ])
  }
}

/**
 * Serializes a Flour object file into a binary format.
 * 
 * @param object a flour object file
 */
export function serialize(object: flour.ObjectFile): Buffer {
  // TODO(kosinw): Come back and store symbol data into binary
  let offset = struct.sizeOf(`>8sI${[...object.chunks].map(x => "I").join("")}`);

  const chunkStarts: number[] = [];
  const binarySections: Buffer[] = [];

  for (let chunk of object.chunks.values()) {
    const data = serializeChunk(chunk, offset);
    chunkStarts.push(offset);
    binarySections.push(data);
    offset = offset + data.byteLength;
  }

  const header = new ObjectFileHeader(chunkStarts).serialize();

  return Buffer.concat([
    header,
    ...binarySections
  ]);
}