"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Expr = exports.ExprType = void 0;
;
var ExprType;
(function (ExprType) {
    ExprType["ATOM"] = "atom";
    ExprType["LIST"] = "list";
})(ExprType = exports.ExprType || (exports.ExprType = {}));
var Expr;
(function (Expr) {
    function atom(value) {
        return new AtomExpr(value);
    }
    Expr.atom = atom;
    function list(l) {
        return new ListExpr(l);
    }
    Expr.list = list;
    class ListExpr {
        constructor(list) {
            this.list = list;
            this.type = ExprType.LIST;
        }
        /**
         * @inheritdoc
         */
        accept(visitor) {
            visitor.onList(this);
        }
        toString() {
            return `ListExpr{ ${this.list} }`;
        }
    }
    class AtomExpr {
        constructor(value) {
            this.value = value;
            this.type = ExprType.ATOM;
        }
        /**
         * @inheritdoc
         */
        accept(visitor) {
            visitor.onAtom(this);
        }
        toString() {
            return `AtomExpr{ ${this.value} }`;
        }
    }
})(Expr = exports.Expr || (exports.Expr = {}));
//# sourceMappingURL=expr.js.map