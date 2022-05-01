import { Parser, BytecodeEmitter } from "./ricecakes";

function main(): void {
  const program = `
  (define (factorial n)
  (if (= n 1)
      1
      (* n (factorial (- n 1)))))`;
  const parser = Parser.create(program);
  const output = parser.parse();
  // const emitter = BytecodeEmitter.create();

  // const chunk = emitter.compile(output)

  console.dir(output, { depth: null });
  // console.log(chunk);
}

if (require.main === module) {
  void main();
}