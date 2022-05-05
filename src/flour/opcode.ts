/**
 * An opcode for the Flour bytecode format specification.
 */
export enum FlourOpcode {
  /// Core instructions.
  CONSTANT = 0,
  DECLARE_VARIABLE,
  GET_VARIABLE,
  SET_VARIABLE,
  NOP,

  /// Control flow instructions.
  JUMP,
  JUMP_IF_FALSE,
  CALL,
  RETURN,
  POP,

  /// Instructions that could be implemented as primitive procedures.
  CLOSURE,
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

// export enum FlourOpcode {
//   CONSTANT = 0,
//   NIL,
//   TRUE,
//   FALSE,
//   CONS,
//   POP,
//   GET_LOCAL,
//   SET_LOCAL,
//   GET_GLOBAL,
//   DEFINE_GLOBAL,
//   SET_GLOBAL,
//   EQUAL,
//   GREATER,
//   LESS,
//   ADD,
//   SUBTRACT,
//   MULTIPLY,
//   DIVIDE,
//   CLOSURE,
//   POW,
//   MOD,
//   NOT,
//   NEGATE,
//   LOG,
//   JUMP,
//   JUMP_IF_FALSE,
//   // LOOP,
//   CALL,
//   // INVOKE,
//   RETURN,
//   // METHOD
// }