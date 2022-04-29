"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BytecodeEmitter = void 0;
const common_1 = require("@module/common");
const expr_1 = require("./expr");
const value_1 = require("./value");
;
var BytecodeEmitter;
(function (BytecodeEmitter) {
    function create() {
        return new NaiveBytecodeEmitter();
    }
    BytecodeEmitter.create = create;
    class NaiveBytecodeEmitter {
        compile(expr) {
            const chunk = common_1.FlourChunk.create("<anonymous>");
            const visitor = {
                onAtom(atom) {
                    switch (atom.value.type) {
                        case value_1.ParserValueType.NUMBER:
                            chunk.emitConstant(common_1.FlourValue.number(atom.value.value));
                            break;
                        default:
                            throw new Error('not implemented yet!');
                    }
                },
                onList(list) {
                    const exp = list.list;
                    if (exp.length === 3 &&
                        exp[0].type === expr_1.ExprType.ATOM &&
                        exp[0].value.type === value_1.ParserValueType.SYMBOL &&
                        exp[0].value.value === 'n:+') {
                        exp.slice(1).forEach(x => x.accept(visitor));
                        chunk.emitOpcode(common_1.FlourOpCode.ADD);
                    }
                    throw new Error('not implemented yet!');
                }
            };
            expr.accept(visitor);
            return chunk;
        }
    }
})(BytecodeEmitter = exports.BytecodeEmitter || (exports.BytecodeEmitter = {}));
;
//# sourceMappingURL=emitter.js.map