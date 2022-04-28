// TODO(kosinw): Add test suite for list.

export interface List<T> { }

export class ListPair<T> implements List<T> {
  public constructor(public readonly car: T, public readonly cdr: T | List<T>) { }

  public toString(): string {
    // TODO(kosinw): Remove bad instanceof checks
    const isList = this.cdr instanceof ListPair;
    const isNil = this.cdr instanceof ListNil;

    if (isNil) {
      return `${this.car}`;
    }

    return `${this.car} ${isList ? `${this.cdr}` : ` . ${this.cdr}`}`;
  }
}

export class ListNil implements List<void> {
  public toString(): string {
    return '()';
  }
}

export function cons<T>(car: T, cdr: T | List<T>) {
  return new ListPair(car, cdr);
}

export const nil = new ListNil();