import * as common from '@module/common';
import { Expr } from './expr';

/**
 * An abstract type representing a code generation emitter.
 */
export interface CodegenEmitter {

};

export module CodegenEmitter {
  export function create(ast: Expr) {
    throw new Error('not implemented yet!');
  }
};