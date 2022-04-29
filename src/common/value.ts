export enum FlourValueType {
  NIL = 0,
  NUMBER,
  BOOLEAN,
  OBJECT
};

export interface FlourNilValue {
  readonly type: FlourValueType.NIL;
}

export interface FlourNumberValue {
  readonly type: FlourValueType.NUMBER;
  readonly value: number;
}

export type FlourValue =
  | FlourNilValue
  | FlourNumberValue;

export namespace FlourValue {
  export function number(v: number): FlourNumberValue {
    return {
      type: FlourValueType.NUMBER,
      value: v
    };
  }
}