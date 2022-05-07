/**
 * An opcode for the Flour bytecode format specification.
 */
export enum FlourOpcode {
  /// Core instructions.
  CONSTANT = 0,
  DEFINE_VARIABLE,
  GET_VARIABLE,
  SET_VARIABLE,
  NOP,

  /// Control flow instructions.
  JUMP,
  JUMP_IF_FALSE,
  CALL,
  RETURN,
  POP,
  CLOSURE,

  /// Instructions that could be implemented as primitive procedures.
  EQUAL,
  ADD,
  GREATER,
  LESS,
  SUBTRACT,
  MULTIPLY,
  DIVIDE,
  POW,
  MOD,
  NOT,
  LOG,
  NEGATE
}