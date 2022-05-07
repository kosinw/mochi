import * as debug from "../build/debug.js";
let code = `464c4f555200000000000001000000102a6d6f64756c652a0000004000000040000000000000000002010000000000000200000000000000010000000300000000000000030100000000020000000008`

const buffer = new Uint8Array(code.length/2)
for(let i=0;i<code.length;i+=2){
    buffer[i/2]=parseInt(code.substring(i,i+2), 16);
}
console.log(buffer)
debug.initVM(buffer);

console.log(debug.run());
console.log("ok");

import Benchmarkify from "benchmarkify";

// Create a new benchmark
// The `.printHeader` method will print the name of benchmark & some
// information from the OS/PC to the console.
const benchmark = new Benchmarkify("Factorial Benchmark").printHeader();

// Create a test suite
const bench1 = benchmark.createSuite("Increment integer");

// Add first func
bench1.add("Factorial with wasm", () => {
    debug.run()
});

function Factorial(n){
    if(n<1){
        return 1
    }
    return n * Factorial(n-1);
}

// Add second func. This result will be the reference
bench1.ref("Factorial with js", () => {
	Factorial(12);
});

bench1.run();

