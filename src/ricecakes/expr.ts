import { List } from "./list";
import { Value } from "./value";

// TODO(kosinw): Add test suite for abstract syntax tree.

export interface ExprVisitor {
  onList<T>(list: ListExpr): T;
  onAtom<T>(atom: AtomExpr): T;
};

export interface Expr {
  accept<T>(visitor: ExprVisitor): T;
};

export class ListExpr implements Expr {
  public constructor(public readonly list: List<Expr>) { }

  /**
   * @inheritdoc
   */
  public accept<T>(visitor: ExprVisitor): T {
    return visitor.onList(this);
  }

  public toString(): string {
    return `ListExpr{ ${this.list} }`;
  }
}

export class AtomExpr implements Expr {
  public constructor(public readonly value: Value) {}

  /**
   * @inheritdoc
   */
  public accept<T>(visitor: ExprVisitor): T {
    return visitor.onAtom(this);
  }

  public toString(): string {
    return `AtomExpr{ ${this.value} }`;
  }
}