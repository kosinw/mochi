import { List } from "./list";

export interface ExprTreeVisitor {
  onList<T>(list: ExprTreeList): T;
  onAtom<T>(atom: ExprTreeAtom): T;
};

export interface ExprTree {
  accept<T>(visitor: ExprTreeVisitor): T;
};

export class ExprTreeList implements ExprTree {
  public constructor(public readonly list: List<ExprTree>) { }

  /**
   * @inheritdoc
   */
  public accept<T>(visitor: ExprTreeVisitor): T {
    return visitor.onList(this);
  }

  public toString(): string {
    return `List { ${this.list} }`;
  }
}

export class ExprTreeAtom implements ExprTree {
  // TODO(kosi): Make a proper parser value type
  public constructor(public readonly value: string) {}

  /**
   * @inheritdoc
   */
  public accept<T>(visitor: ExprTreeVisitor): T {
    return visitor.onAtom(this);
  }

  public toString(): string {
    return `Atom { ${this.value} }`;
  }
}