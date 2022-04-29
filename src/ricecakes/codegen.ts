import { FlourChunk, FlourOpCode } from '@module/common';
import { Expr } from './expr';

/**
 * An abstract type representing a code generation emitter.
 */
export interface CodegenEmitter {
  // emitChunk()
};

export module CodegenEmitter {
  export function create(): CodegenEmitter {
    throw new Error('not implemented yet!');
  }

  class NaiveCodegenEmitter implements CodegenEmitter {

  }
};