import { List } from "./list";
import { ParserValue } from "./value";

// TODO(kosinw): Add test suite for abstract syntax tree.

export interface ExprVisitor {
  onList<T>(list: ListExpr): T;
  onAtom<T>(atom: AtomExpr): T;
};

export enum ExprType {
  Atom = 'atom',
  List = 'list'
}

interface BaseExpr {
  readonly type: ExprType;
  accept<T>(visitor: ExprVisitor): T;
}

export type ListExpr = BaseExpr & {
  readonly type: ExprType.List;
};

export type AtomExpr = BaseExpr & {
  readonly type: ExprType.Atom;
}

export type Expr =
  | ListExpr
  | AtomExpr;

export namespace Expr {
  export function atom(value: ParserValue): AtomExpr {
    return new AtomExpr(value);
  }

  export function list(l: List<Expr>): ListExpr {
    return new ListExpr(l);
  }

  class ListExpr implements ListExpr {
    public readonly type = ExprType.List;

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

  class AtomExpr implements AtomExpr {
    public readonly type = ExprType.Atom;

    public constructor(public readonly value: ParserValue) { }

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
}