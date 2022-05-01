import assert from "assert";
import { Buffer } from 'buffer';
import { FlourValue } from "./value";

/**
 * A representation of a Flour bytecode instruction. 
 */
export enum FlourInstruction {
  CONSTANT = 0,
  NIL,
  TRUE,
  FALSE,
  CONS,
  POP,
  GET_LOCAL,
  SET_LOCAL,
  GET_GLOBAL,
  DEFINE_GLOBAL,
  SET_GLOBAL,
  EQUAL,
  GREATER,
  LESS,
  ADD,
  SUBTRACT,
  MULTIPLY,
  DIVIDE,
  // POW,
  // MOD,
  NOT,
  NEGATE,
  LOG,
  JUMP,
  JUMP_IF_FALSE,
  // LOOP,
  CALL,
  // INVOKE,
  RETURN,
  // METHOD
}

/**
 * An in-memory representation of a Flour bytecode section of code.
 * A chunk contains information about the constants used in a compiled
 * section of code (.const). A chunk also contains information about
 * the bytecode instructions contained in a chunk (.const). Finally,
 * longer constants that cannot be stored on heap memory are stored in (.data)
 */
export interface FlourChunk {
  writeInstruction(n: FlourInstruction): void;
  writeConstant(v: FlourValue): void;

  serialize(): Buffer;
}

// TODO(kosinw): Make these into proper value types. 
type FlourObject = any;

export namespace FlourChunk {
  export function create() {
    return new NaiveFlourChunk();
  }

  // TODO(kosinw): Replace this with a faster version
  // that uses a dynamically growing buffer.
  class NaiveFlourChunk implements FlourChunk {
    readonly constantPool: FlourValue[];
    readonly instructions: (FlourInstruction | number)[];
    readonly dataSection: FlourObject[];

    constructor() {
      this.constantPool = [];
      this.instructions = [];
      this.dataSection = [];
    }

    writeInstruction(n: FlourInstruction): void {
      this.instructions.push(n);
    }

    writeConstant(v: FlourValue): void {
      this.constantPool.push(v);
      const ptr = this.constantPool.length - 1;
      this.instructions.push(ptr);
    }

    alloc(v: FlourObject): number {
      throw new Error("Method not implemented.");
    }

    serialize(): Buffer {
      return Buffer.concat(
        this.constantPool.map(c => c.serialize())
      );
    }
  }
}