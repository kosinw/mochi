"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlourChunk = exports.FlourOpCode = void 0;
/**
 * A representation of a Flour bytecode instruction.
 */
var FlourOpCode;
(function (FlourOpCode) {
    FlourOpCode[FlourOpCode["CONSTANT"] = 0] = "CONSTANT";
    FlourOpCode[FlourOpCode["NIL"] = 1] = "NIL";
    FlourOpCode[FlourOpCode["TRUE"] = 2] = "TRUE";
    FlourOpCode[FlourOpCode["FALSE"] = 3] = "FALSE";
    FlourOpCode[FlourOpCode["CONS"] = 4] = "CONS";
    FlourOpCode[FlourOpCode["POP"] = 5] = "POP";
    FlourOpCode[FlourOpCode["GET_LOCAL"] = 6] = "GET_LOCAL";
    FlourOpCode[FlourOpCode["SET_LOCAL"] = 7] = "SET_LOCAL";
    FlourOpCode[FlourOpCode["GET_GLOBAL"] = 8] = "GET_GLOBAL";
    FlourOpCode[FlourOpCode["DEFINE_GLOBAL"] = 9] = "DEFINE_GLOBAL";
    FlourOpCode[FlourOpCode["SET_GLOBAL"] = 10] = "SET_GLOBAL";
    FlourOpCode[FlourOpCode["EQUAL"] = 11] = "EQUAL";
    FlourOpCode[FlourOpCode["GREATER"] = 12] = "GREATER";
    FlourOpCode[FlourOpCode["LESS"] = 13] = "LESS";
    FlourOpCode[FlourOpCode["ADD"] = 14] = "ADD";
    FlourOpCode[FlourOpCode["SUBTRACT"] = 15] = "SUBTRACT";
    FlourOpCode[FlourOpCode["MULTIPLY"] = 16] = "MULTIPLY";
    FlourOpCode[FlourOpCode["DIVIDE"] = 17] = "DIVIDE";
    // POW,
    // MOD,
    FlourOpCode[FlourOpCode["NOT"] = 18] = "NOT";
    FlourOpCode[FlourOpCode["NEGATE"] = 19] = "NEGATE";
    FlourOpCode[FlourOpCode["CONSOLE_LOG"] = 20] = "CONSOLE_LOG";
    FlourOpCode[FlourOpCode["JUMP"] = 21] = "JUMP";
    FlourOpCode[FlourOpCode["JUMP_IF_FALSE"] = 22] = "JUMP_IF_FALSE";
    // LOOP,
    FlourOpCode[FlourOpCode["CALL"] = 23] = "CALL";
    // INVOKE,
    FlourOpCode[FlourOpCode["RETURN"] = 24] = "RETURN";
    // METHOD
})(FlourOpCode = exports.FlourOpCode || (exports.FlourOpCode = {}));
var FlourChunk;
(function (FlourChunk) {
    function create(name) {
        return new NaiveFlourChunk(name);
    }
    FlourChunk.create = create;
    class NaiveFlourChunk {
        constructor(name) {
            this.name = name;
            this.const = [];
            this.text = [];
            this.data = [];
        }
        /**
         * @inheritdoc
         */
        emitConstant(v) {
            this.emitOpcode(FlourOpCode.CONSTANT);
            this.text.push(this.makeConstant(v));
        }
        makeConstant(v) {
            this.const.push(v);
            return this.const.length - 1;
        }
        /**
         * @inheritdoc
         */
        allocateObject(v) {
            throw new Error("Method not implemented.");
        }
        /**
         * @inheritdoc
         */
        emitOpcode(b) {
            this.text.push(b);
        }
        /**
         * @inheritdoc
         */
        serialize() {
            throw new Error("Method not implemented.");
        }
    }
})(FlourChunk = exports.FlourChunk || (exports.FlourChunk = {}));
//# sourceMappingURL=chunk.js.map