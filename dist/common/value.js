"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlourValue = exports.FlourValueType = void 0;
var FlourValueType;
(function (FlourValueType) {
    FlourValueType[FlourValueType["NIL"] = 0] = "NIL";
    FlourValueType[FlourValueType["NUMBER"] = 1] = "NUMBER";
    FlourValueType[FlourValueType["BOOLEAN"] = 2] = "BOOLEAN";
    FlourValueType[FlourValueType["OBJECT"] = 3] = "OBJECT";
})(FlourValueType = exports.FlourValueType || (exports.FlourValueType = {}));
;
var FlourValue;
(function (FlourValue) {
    function number(v) {
        return {
            type: FlourValueType.NUMBER,
            value: v
        };
    }
    FlourValue.number = number;
})(FlourValue = exports.FlourValue || (exports.FlourValue = {}));
//# sourceMappingURL=value.js.map