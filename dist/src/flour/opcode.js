"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlourOpcode = void 0;
/**
 * An opcode for the Flour bytecode format specification.
 */
var FlourOpcode;
(function (FlourOpcode) {
    FlourOpcode[FlourOpcode["CONSTANT"] = 0] = "CONSTANT";
    FlourOpcode[FlourOpcode["NIL"] = 1] = "NIL";
    FlourOpcode[FlourOpcode["TRUE"] = 2] = "TRUE";
    FlourOpcode[FlourOpcode["FALSE"] = 3] = "FALSE";
    FlourOpcode[FlourOpcode["CONS"] = 4] = "CONS";
    FlourOpcode[FlourOpcode["POP"] = 5] = "POP";
    FlourOpcode[FlourOpcode["GET_LOCAL"] = 6] = "GET_LOCAL";
    FlourOpcode[FlourOpcode["SET_LOCAL"] = 7] = "SET_LOCAL";
    FlourOpcode[FlourOpcode["GET_GLOBAL"] = 8] = "GET_GLOBAL";
    FlourOpcode[FlourOpcode["DEFINE_GLOBAL"] = 9] = "DEFINE_GLOBAL";
    FlourOpcode[FlourOpcode["SET_GLOBAL"] = 10] = "SET_GLOBAL";
    FlourOpcode[FlourOpcode["EQUAL"] = 11] = "EQUAL";
    FlourOpcode[FlourOpcode["GREATER"] = 12] = "GREATER";
    FlourOpcode[FlourOpcode["LESS"] = 13] = "LESS";
    FlourOpcode[FlourOpcode["ADD"] = 14] = "ADD";
    FlourOpcode[FlourOpcode["SUBTRACT"] = 15] = "SUBTRACT";
    FlourOpcode[FlourOpcode["MULTIPLY"] = 16] = "MULTIPLY";
    FlourOpcode[FlourOpcode["DIVIDE"] = 17] = "DIVIDE";
    FlourOpcode[FlourOpcode["CLOSURE"] = 18] = "CLOSURE";
    FlourOpcode[FlourOpcode["POW"] = 19] = "POW";
    FlourOpcode[FlourOpcode["MOD"] = 20] = "MOD";
    FlourOpcode[FlourOpcode["NOT"] = 21] = "NOT";
    FlourOpcode[FlourOpcode["NEGATE"] = 22] = "NEGATE";
    FlourOpcode[FlourOpcode["LOG"] = 23] = "LOG";
    FlourOpcode[FlourOpcode["JUMP"] = 24] = "JUMP";
    FlourOpcode[FlourOpcode["JUMP_IF_FALSE"] = 25] = "JUMP_IF_FALSE";
    // LOOP,
    FlourOpcode[FlourOpcode["CALL"] = 26] = "CALL";
    // INVOKE,
    FlourOpcode[FlourOpcode["RETURN"] = 27] = "RETURN";
    // METHOD
})(FlourOpcode = exports.FlourOpcode || (exports.FlourOpcode = {}));
//# sourceMappingURL=opcode.js.map