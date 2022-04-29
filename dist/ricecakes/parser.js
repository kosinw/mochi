"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Parser = void 0;
const expr_1 = require("./expr");
const s_expression_1 = __importDefault(require("@lilusoft/s-expression"));
const value_1 = require("./value");
var Parser;
(function (Parser) {
    /**
     * @returns a new parser with an empty buffer
     */
    function create(source) {
        return new NaiveParser(source);
    }
    Parser.create = create;
    /**
     * A quick and naive implementation of a Scheme parser based on an external library
     * to speed up development rate.
     */
    // TODO(kosinw): Remove this implementation and write a better recursive-descent parser.
    class NaiveParser {
        constructor(buffer) {
            this.buffer = buffer;
        }
        /**
         * @inheritdoc
         */
        parse() {
            const parseAtom = (l) => {
                const number = /[\-+]?[0-9]+/;
                if (number.test(l)) {
                    return value_1.ParserValue.number(parseInt(l));
                }
                else {
                    return value_1.ParserValue.symbol(l);
                }
            };
            const parseList = (l) => {
                return l.map(x => parseInternal(x));
            };
            const parseInternal = (l) => typeof l === 'string' ?
                expr_1.Expr.atom(parseAtom(l)) :
                expr_1.Expr.list(parseList(l));
            return parseInternal(s_expression_1.default.parse(this.buffer));
        }
    }
})(Parser = exports.Parser || (exports.Parser = {}));
if (require.main === module) {
    const parser = Parser.create("(2 . (3 . (4 . (5 . 6))))");
    console.dir(parser.parse(), { depth: null });
}
//# sourceMappingURL=parser.js.map