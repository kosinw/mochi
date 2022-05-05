import * as debug from "../build/debug.js";
let code = `00 00 00 01
00 00 00 08
00 00 00 0C
00 00 00 00 01 00 00 00
06 00 00 00 00//local
00 00 00 00 00//constant
0D 00 00 00 00//less
19 00 00 00 04//jumpiffalse
05 00 00 00 00//pop
05 00 00 00 00//pop
00 00 00 00 00//const
1B 00 00 00 00//return
05 00 00 00 00//pop
06 00 00 00 00//local
00 00 00 00 00//const
0F 00 00 00 00//SUB
1A 00 00 00 00//call
10 00 00 00 00//mult
1B 00 00 00 00//return`

code = code.replace(/\/\/.*/ig, " ")
code = code.replace(/\n/g, " ").replace(/  /g, " ")

console.log(code)
const bytes = code.split(" ")
const buffer = new Uint8Array(bytes.length)
for(let i=0;i<bytes.length;i++){
    buffer[i]=parseInt(bytes[i], 16);
}
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

