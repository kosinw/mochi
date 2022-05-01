import { FlourChunk, FlourInstruction, FlourValue } from '@module/common';
import assert from 'assert';
import { Expr, ExprType, ExprVisitor } from './expr';
import { ParserValueType } from './value';

/**
 * An abstract type representing a code generation emitter.
 */
export interface BytecodeEmitter {
  // TODO(kosinw): Change the spec to output a series of chunks
  // Add another type to stitch chunks together before sending off
  // to virtual machine.
  compile(expr: Expr): FlourChunk;
};

export module BytecodeEmitter {
  export function create(): BytecodeEmitter {
    return new NaiveBytecodeEmitter();
  }

  class NaiveBytecodeEmitter implements BytecodeEmitter {
    currentChunk: FlourChunk;

    constructor() {
      this.currentChunk = FlourChunk.create();
    }

    private emitInstruction(op: FlourInstruction): void {
      this.currentChunk.writeInstruction(op);
    }

    private emitConstant(value: FlourValue): void {
      this.currentChunk.writeInstruction(FlourInstruction.CONSTANT);
      this.currentChunk.writeConstant(value);
    }

    public compile(expr: Expr): FlourChunk {
      const visitor: ExprVisitor = {
        onAtom: (atom) => {
          switch (atom.value.type) {
            case ParserValueType.NUMBER:
              this.emitConstant(
                FlourValue.number(atom.value.value)
              );
              break;
            default:
              throw new Error('not implemented yet!');
          }
        },
        onList: (list) => {
          const exp = list.list;

          if (exp.length === 3 &&
            exp[0].type === ExprType.ATOM &&
            exp[0].value.type === ParserValueType.SYMBOL
          ) {
            const car = exp[0].value.value;

            exp.slice(1).forEach(x => x.accept(visitor));

            if (car === 'b:+') {
              this.emitInstruction(FlourInstruction.ADD);
              return;
            } else if (car === 'b:-') {
              this.emitInstruction(FlourInstruction.SUBTRACT);
              return;
            } else if (car === 'b:*') {
              this.emitInstruction(FlourInstruction.MULTIPLY);
              return;
            } else if (car === 'b:/') {
              this.emitInstruction(FlourInstruction.DIVIDE);
              return;
            }
          }

          throw new Error('not implemented yet!');
        }
      };

      expr.accept(visitor);

      this.emitInstruction(FlourInstruction.RETURN);

      return this.currentChunk;
    }
  }
};