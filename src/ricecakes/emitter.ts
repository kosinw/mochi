import { FlourChunk, FlourOpCode, FlourValue } from '@module/common';
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
    public compile(expr: Expr): FlourChunk {
      const chunk = FlourChunk.create("<anonymous>");

      const visitor: ExprVisitor = {
        onAtom(atom) {
          switch (atom.value.type) {
            case ParserValueType.NUMBER:
              chunk.emitConstant(FlourValue.number(atom.value.value));
              break;
            default:
              throw new Error('not implemented yet!');
          }
        },
        onList(list) {
          const exp = list.list;

          if (exp.length === 3 &&
            exp[0].type === ExprType.ATOM &&
            exp[0].value.type === ParserValueType.SYMBOL
          ) {
            const car = exp[0].value.value;

            exp.slice(1).forEach(x => x.accept(visitor));

            if (car === 'b:+') {
              chunk.emitOpcode(FlourOpCode.ADD);
              return;
            } else if (car === 'b:-') {
              chunk.emitOpcode(FlourOpCode.SUBTRACT);
              return;
            } else if (car === 'b:*') {
              chunk.emitOpcode(FlourOpCode.MULTIPLY);
              return;
            } else if (car === 'b:/') {
              chunk.emitOpcode(FlourOpCode.DIVIDE);
              return;
            }
          }

          throw new Error('not implemented yet!');
        }
      };

      expr.accept(visitor);

      chunk.emitOpcode(FlourOpCode.RETURN);

      return chunk;
    }
  }
};