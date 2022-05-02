import assert from "assert";
import { evaluate } from "../build/debug.js";
import "../build/debug.wasm"
 
// import { instantiateStreaming } from "assemblyscript/lib/loader";

evaluate([0])
// assert.strictEqual(evaluate(new Uint8Array(4)), 0);
console.log("ok");
