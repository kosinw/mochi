"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParserValue = exports.ParserValueType = void 0;
var ParserValueType;
(function (ParserValueType) {
    ParserValueType["NUMBER"] = "number";
    ParserValueType["SYMBOL"] = "symbol";
    ParserValueType["STRING"] = "string";
})(ParserValueType = exports.ParserValueType || (exports.ParserValueType = {}));
;
var ParserValue;
(function (ParserValue) {
    /**
     * Constructs a new primitive number value.
     *
     * @param n a number
     * @returns a boxed number value
     */
    function number(n) {
        return new NumberParserValue(n);
    }
    ParserValue.number = number;
    /**
     * Constructs a new primitive symbol value.
     *
     * @param v an identifier
     * @returns a boxed symbol value
     */
    function symbol(v) {
        return new SymbolParserValue(v);
    }
    ParserValue.symbol = symbol;
    /**
     * Constructs a new primitive string value.
     *
     * @param v a string of characters
     * @returns a boxed string
     */
    function string(v) {
        return new StringParserValue(v);
    }
    ParserValue.string = string;
    class NumberParserValue {
        constructor(value) {
            this.type = ParserValueType.NUMBER;
            this.value = value;
        }
        toString() {
            return `NumberValue{ ${this.value} }`;
        }
    }
    class SymbolParserValue {
        constructor(value) {
            this.type = ParserValueType.SYMBOL;
            this.value = value;
        }
        toString() {
            return `SymbolValue{ ${this.value} }`;
        }
    }
    class StringParserValue {
        constructor(value) {
            this.type = ParserValueType.STRING;
            this.value = value;
        }
        toString() {
            return `StringValue{ ${this.value} }`;
        }
    }
})(ParserValue = exports.ParserValue || (exports.ParserValue = {}));
//# sourceMappingURL=value.js.map