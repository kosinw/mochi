import { Buffer } from 'buffer';

export enum FlourValueType {
  NIL = 0,
  NUMBER,
  BOOLEAN,
  PTR
};

///
/// Struct packing scheme for serializing flour values.
/// Value content is stored in little endian ordering and is up to 4 bytes long.
/// Content can be 32-bit signed integers, pointers, booleans, or nil.
/// Values structured data is padded to 8 bytes.
///
///
///              flour_value
///
///              0x0000          │ 0x0008
///              ┌──┬──┬──┬──┬──┬┼┬──┬──┬──┬──┬──┬──┐
///      bytes   │00│01│02│03│04│┼│08│09│0A│0B│0C│0D│
///              └──┴──┴──┴──┴──┴┼┴──┴──┴──┴──┴──┴──┘
///               ▲  ▲         ▲ │
///               │  └────┬────┘
///               │       │
/// type tag  ────┘       │
///                  value content
///                  - int32
///                  - ptr (boxed value)
///                  - boolean
///                  - nil
///
export interface FlourValueSerializable {
  /**
   * Serializes flour values into a binary form.
   */
  serialize(): Buffer;
}

export interface FlourNilValue extends FlourValueSerializable {
  readonly type: FlourValueType.NIL;
}

export interface FlourIntegerValue extends FlourValueSerializable {
  readonly type: FlourValueType.NUMBER;
  readonly value: number;
}

export type FlourValue =
  | FlourNilValue
  | FlourIntegerValue;

export namespace FlourValue {
  /**
   * Constructs a new signed 32-bit integer Flour value.
   * 
   * @param v a 32-bit integer, must be less than 0x100000000
   * @returns a new flour number value
   */
  export function number(v: number): FlourIntegerValue {
    return new _FlourIntegerValue(v);
  }

  class _FlourIntegerValue implements FlourIntegerValue {
    type: FlourValueType.NUMBER = FlourValueType.NUMBER;
    value: number;

    constructor(value: number) {
      this.value = value;
    }

    serialize(): Buffer {
      const value = Buffer.alloc(8);
      const contentPtr = value.writeUInt8(this.type, 0);
      value.writeInt32LE(this.value, contentPtr);

      return value;
    }
  }
}