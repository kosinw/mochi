# mochi

> An implementation of the Scheme programming language targeting the WebAssembly platform.

## Overview

The mochi project is a toolchain which comprises the implementation of the Scheme programming language on the WebAssembly platform. mochi is a subset of the R<sup>5</sup>RS standard of Scheme designed with a bare amount of functionality. 

Our ahead-of-time compiler, `ricecakes`, compiles Scheme programs into a bytecode format which is then later interpreted.

Flour is an assembly language based on both the register machine specification from [Structure and Interpretation of Computer Programs](https://sarabander.github.io/sicp/html/) and takes inspiration from the [Lua](https://www.lua.org/doc/jucs05.pdf) virtual machine implementation.

The assembler, `flour`, then assembles Flour programs into a bytecode format that is understood and executed by our register-based virtual machine, `dango` which is compiled to run in a WebAssembly enivronment.

Our compiler `ricecakes` is written in MIT/GNU Scheme, the standard Scheme implementation used in several MIT courses such as 6.945 and the defunct 6.001. The assembler, `flour`, is written in TypeScript and our virtual machine implementation is written in AssemblyScript, which is a specialized form of TypeScript created to target WebAssembly.

## Stage 1: `ricecakes`

## Stage 2: `flour`

Flour is an assembly language which contains operations for basic control flow, arithmetic, procedure creation and execution.

### Registers
ip
env
flags


### Values

Flour 

### Types

Flour has types assosciated to values living on our linear memory data structure (an equivalent to the role of a heap in the JVM or Lua). These types include: *nil*, *boolean*, *number*, *pair*, *procedure*, and *symbol*, and *environment*. Nil is a type which is a set with one element called nil. Boolean values can be *true* or *false*. *Pair* values are types which hold pointers to two values, *car* and *cdr*.

### Instruction Set

### Addressing Modes

```lisp
move
add
sub
div
mul
goto
branch
eq
lt
gt
lteq
gteq
and
or
not
call
ret
push
pop
lambda
```

## Stage 3: `dango`

## Stage 4: `mochivm`
The vm will be written in AssemblyScript the program will accepts a stream of bytecode which it will interpret chunk by chunk by simulating a register machine. The vm will consist of registers, a heap, and a stack implemented using fixed length ArrayBuffers in AssemblyScript. This means we will have a fixed limit on the memory available to programs running on our vm.
The AssemblyScript register will be compiled down to WebAssembly and then executed in the browser.

## References
* Write your Own Virtual Machine - https://justinmeiners.github.io/lc3-vm/
* SICP - https://sarabander.github.io/sicp/
* The Implementation of Lua 5.0 - https://www.lua.org/doc/jucs05.pdf
* A Small Scheme VM, Compiler, and REPL - http://www.iro.umontreal.ca/~feeley/papers/YvonFeeleyVMIL21.pdf