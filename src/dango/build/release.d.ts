declare namespace __AdaptedExports {
  /**
   * assembly/index/initVM
   * @param programBuffer `~lib/typedarray/Uint8Array`
   */
  export function initVM(programBuffer: Uint8Array): void;
  /**
   * assembly/index/getConsole
   * @returns `~lib/string/String`
   */
  export function getConsole(): string;
  /**
   * assembly/index/getError
   * @returns `~lib/error/Error`
   */
  export function getError(): __Internref12;
  /**
   * assembly/index/run
   * @returns `~lib/string/String`
   */
  export function run(): string;
}
/** ~lib/error/Error */
declare class __Internref12 extends Number {
  private __nominal12: symbol;
}
/** Instantiates the compiled WebAssembly module with the given imports. */
export declare function instantiate(module: WebAssembly.Module, imports: {
  env: unknown,
}): Promise<typeof __AdaptedExports>;
