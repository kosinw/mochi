import { Parser, BytecodeEmitter } from "./ricecakes";

function main(): void {
  const program = `(b:+ (b:* 22 15) (b:- 99 98))`;
  const parser = Parser.create(program);
  const emitter = BytecodeEmitter.create();

  const chunk = emitter.compile(parser.parse());

  console.log(chunk);
}

if (require.main === module) {
  void main();
}