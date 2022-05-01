import { assert } from "console";
import { FlourValue } from "./value";

/**
 * A representation of a Flour bytecode instruction. 
 */
export enum FlourOpCode {
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
  POW,
  MOD,
  NOT,
  NEGATE,
  CONSOLE_LOG,
  JUMP,
  JUMP_IF_FALSE,
  CALL,
  RETURN,
}

/**
 * An in-memory representation of a Flour bytecode section of code.
 * A chunk contains information about the constants used in a compiled
 * section of code (.const). A chunk also contains information about
 * the bytecode instructions contained in a chunk (.const). Finally,
 * longer constants that cannot be stored on heap memory are stored in (.data)
 */
export interface FlourChunk {
  readonly name: string;

  emitConstant(v: FlourValue): void;
  allocateObject(v: FlourObject): FlourPtr;
  emitOpcode(b: FlourOpCode): void;

  serialize(): ArrayBuffer;
}

// TODO(kosinw): Make these into proper value types. 
type FlourObject = any;

type FlourPtr = number;

export namespace FlourChunk {
  export function create(name: string) {
    return new NaiveFlourChunk(name);
  }

  class NaiveFlourChunk implements FlourChunk {
    public readonly name: string;
    private readonly const: FlourValue[];
    private readonly text: number[];
    private readonly data: FlourObject[];

    public constructor(name: string) {
      this.name = name;
      this.const = [];
      this.text = [];
      this.data = [];
    }

    /**
     * @inheritdoc
     */
    public emitConstant(v: FlourValue): void {
      this.emitOpcode(FlourOpCode.CONSTANT);
      const ptr = this.makeConstant(v);

      for (let shift = 0; shift < 4; ++shift) {
        const mask = 0xff << (shift * 8);
        const value = (ptr & mask) >> (shift * 8);
        assert(value < 255);
        this.text.push(value);
      }
    }

    private makeConstant(v: FlourValue): number {
      this.const.push(v);
      return this.const.length - 1;
    }

    /**
     * @inheritdoc
     */
    public allocateObject(v: any): number {
      throw new Error("Method not implemented.");
    }

    /**
     * @inheritdoc
     */
    public emitOpcode(b: FlourOpCode): void {
      this.text.push(b);
    }

    /**
     * @inheritdoc
     */
    public serialize(): ArrayBuffer {
      throw new Error("Method not implemented.");
    }
  }
}