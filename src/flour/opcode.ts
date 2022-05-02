/**
 * An opcode for the Flour bytecode format specification.
 */
export enum FlourOpcode {
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
  CLOSURE,
  POW,
  MOD,
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
// FlourOpcode.L
export enum FlourUnboxedTypeCode {
  FIXNUM,
  NIL,
  BOOLEAN,
  PTR
};