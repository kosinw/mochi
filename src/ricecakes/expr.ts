import { ParserValue } from "./value";

// TODO(kosinw): Add test suite for abstract syntax tree.

export interface ExprVisitor {
  onList(list: ListExpr): void;
  onAtom(atom: AtomExpr): void;
};

export enum ExprType {
  ATOM = 'atom',
  LIST = 'list'
}

interface BaseExpr {
  accept(visitor: ExprVisitor): void;
}

export type ListExpr = BaseExpr & {
  readonly type: ExprType.LIST;
  readonly list: Expr[];
};

export type AtomExpr = BaseExpr & {
  readonly type: ExprType.ATOM;
  readonly value: ParserValue;
}

export type Expr =
  | ListExpr
  | AtomExpr;

export namespace Expr {
  export function atom(value: ParserValue): AtomExpr {
    return new AtomExpr(value);
  }

  export function list(l: Expr[]): ListExpr {
    return new ListExpr(l);
  }

  class ListExpr implements ListExpr {
    public readonly type = ExprType.LIST;

    public constructor(public readonly list: Expr[]) { }

    /**
     * @inheritdoc
     */
    public accept(visitor: ExprVisitor): void {
      visitor.onList(this);
    }

    public toString(): string {
      return `ListExpr{ ${this.list} }`;
    }
  }

  class AtomExpr implements AtomExpr {
    public readonly type = ExprType.ATOM;

    public constructor(public readonly value: ParserValue) { }

    /**
     * @inheritdoc
     */
    public accept(visitor: ExprVisitor): void {
      visitor.onAtom(this);
    }

    public toString(): string {
      return `AtomExpr{ ${this.value} }`;
    }
  }
}