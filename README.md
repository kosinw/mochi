# mochi

> A compiler and stack machine for the Scheme programming language targeting the WebAssembly platform.

See the accompanying [paper](https://www.overleaf.com/download/project/626c4f35b8fdddec4415ce6b/build/18080af280b-68be2c11d42e40a6/output/output.pdf?compileGroup=standard&clsiserverid=clsi-pre-emp-e2-c-d-0031&popupDownload=true) for an introduction on the deisgn and methodlogy used in this project. 

The compiler's source langauge is Scheme, the implementation langauge is TypeScript, and the object language is the Flour bytecode format.

## References
* Nystrom. Crafting Interpreters - https://craftinginterpreters.com/
* Abelson, Sussman, and Sussman. Structure and Interpretation of Computer Programs, 2e - https://sarabander.github.io/sicp/
* Hanson and Sussman. Software Design for Flexiblity - https://mitpress.mit.edu/books/software-design-flexibility
* The Implementation of Lua 5.0 - https://www.lua.org/doc/jucs05.pdf
* An Incremental Approach to Compiler Construction - https://raw.githubusercontent.com/namin/inc/master/docs/paper.pdf

## License
mochi is licensed under [GNU LGPLv3](./LICENSE).