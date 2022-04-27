# mochi

> An implementation of the Scheme programming language targeting the WebAssembly platform.

## Overview

The mochi project is a collection of tools and libraries which make up the implementation of the Scheme programming language to be used on platforms supporting WebAssembly. mochi is a subset of the R<sup>5</sup>RS standard of Scheme designed with a bare amount of functionality. 

Among these tools include a compiler (`mochicc`) which translates a program from Scheme to an intermediate, register-machine based language known as `flour`.

`flour` is an assembly language based on both the register machine specification from [Structure and Interpretation of Computer Programs](https://sarabander.github.io/sicp/html/) and the [Lua](https://www.lua.org/doc/jucs05.pdf) 5.0 virtual machine implementation.

The assembler, `mochias`, then assembles `flour` programs into a bytecode format that is understood and executed by our register-based virtual machine, `mochivm` which is compiled to run in a WebAssembly enivronment.

Our compiler `mochicc` is written in GNU Guile, a Scheme implementation supporting R<sup>5</sup>RS created by the GNU project. The assembler, `mochias`, is written in Python and our virtual machine implementation is written in AssemblyScript, which is a specialized

## Stage 1: `mochicc`

## Stage 2: `flour`

## Stage 3: `mochias`

## Stage 4: `mochivm`
The vm will be written in AssemblyScript the program will accepts a stream of bytecode which it will interpret chunk by chunk by simulating a register machine. The vm will consist of registers, a heap, and a stack implemented using fixed length ArrayBuffers in AssemblyScript. This means we will have a fixed limit on the memory available to programs running on our vm.
The AssemblyScript register will be compiled down to WebAssembly and then executed in the browser.


## License

