const MAX_PROGRAM_MEMORY = 1024*1024*16
import {FlourOpcode, FlourUnboxedTypeCode} from "../../flour/opcode"
const UNBOXED_BYTE_LENGTH = 8;
const INSTRUCTION_BYTE_LENGTH = 5;

export function run(programBuffer: Uint8Array):u32{
  let vm: DangoVM = new DangoVM(programBuffer)


  return (new UnboxedValue(vm.evaluate())).getData();
}

function parseUint32(arr:Uint8Array, index: i32):u32{
  let sum:u32=0;
  for(let i=0;i<4;i++){
    sum+=(<u32>arr[index+3-i])<<(8*i)
  }
  return sum
  // return (<u32>arr[index]<<24)+(<u32>arr[index+1] << 16)+(<u32>arr[index+2] << 8)+(<u32>arr[index+3])
}
function bytify(num: u32):Uint8Array{
  // console.log("byte")
  // console.log(num.toString())
  const res = new Uint8Array(8);
  res[0] = FlourUnboxedTypeCode.FIXNUM
  for(let i=0; i<4;i++){
    res[4-i]=num & 255
    num>>=8;
  }

  return res
}

function bytifyBool(val: bool):Uint8Array{
  const res = new Uint8Array(8);
  res[0] = FlourUnboxedTypeCode.BOOLEAN
  res[4]= val?1:0
  return res
}
// let cnt = 0;


class DangoVM {
  stack: Uint8Array;
  heap: Uint8Array;
  frameCount: u32;
  stackTop: u32;
  chunks: Chunk[];
  // unboxed values are stored in 4 bytes
  globals: Map<u32, u64>;


  constructor(programBuffer: Uint8Array){
    this.stack = new Uint8Array(MAX_PROGRAM_MEMORY);
    this.stackTop = 0;
    this.frameCount = 0;
    this.heap = new Uint8Array(MAX_PROGRAM_MEMORY);
    this.globals = new Map<u32, u64>();
    const num_chunks: u32 = parseUint32(programBuffer, 0)
    // console.log(num_chunks.toString())
    this.chunks = new Array<Chunk>(num_chunks);

    for(let i:u32=0; i<num_chunks; i++){
      let start_ptr = parseUint32(programBuffer,4*i+4)
      let end_ptr = parseUint32(programBuffer, 4*i+8)  

      if(i==num_chunks-1){
        end_ptr = programBuffer.length
      }

      this.chunks[i] = new Chunk(programBuffer.slice(start_ptr, end_ptr))
    }

    this.push(bytify(12))
  }

  evaluate(): Uint8Array{
    return this.runChunk(this.chunks[this.chunks.length-1])
  }

  private push(pushBuffer: Uint8Array):void{
    if(pushBuffer.length!=UNBOXED_BYTE_LENGTH){
      throw "Stack push error";
    }
    this.stack.set(pushBuffer, this.stackTop)
    this.stackTop += UNBOXED_BYTE_LENGTH
  }

  

  private pop():Uint8Array{
    this.stackTop -= UNBOXED_BYTE_LENGTH;
    return this.peek(-1);
  }

  private stackLength():u32{
    return this.stackTop / UNBOXED_BYTE_LENGTH
  }

  private peek(i: u32): Uint8Array{
    return this.stack.slice(this.stackTop-(i+1)*UNBOXED_BYTE_LENGTH,this.stackTop-i*UNBOXED_BYTE_LENGTH)
  }

  private runChunk(c: Chunk): Uint8Array{
    for(let i=0;i<c.instructions.length;i++){
      const instruction = c.instructions[i];
      let a:UnboxedValue;
      let b:UnboxedValue;

      switch(instruction.getOpCode()) {
        case FlourOpcode.ADD:
          b = new UnboxedValue(this.pop())
          a = new UnboxedValue(this.pop())
          this.push(bytify(a.getData()+b.getData()))
          break;
        case FlourOpcode.SUBTRACT:
          // console.log("sub")
          b = new UnboxedValue(this.pop())
          a = new UnboxedValue(this.pop())
          // console.log(b.getData().toString())
          // console.log((a.getData()-b.getData()).toString())
          this.push(bytify(a.getData()-b.getData()))
          break;
        case FlourOpcode.MULTIPLY:
          // console.log("mult")
          b = new UnboxedValue(this.pop())
          a = new UnboxedValue(this.pop())
          // console.log(a.getData().toString())
          // console.log("*")
          // console.log(b.getData().toString())
          // console.log((a.getData()*b.getData()).toString())
          this.push(bytify(a.getData()*b.getData()))
          break;
        case FlourOpcode.DIVIDE:
          b = new UnboxedValue(this.pop())
          a = new UnboxedValue(this.pop())
          this.push(bytify(a.getData()/b.getData()))
          break;
        case FlourOpcode.EQUAL:
          b = new UnboxedValue(this.pop())
          a = new UnboxedValue(this.pop())
          this.push(bytifyBool(a.getData()==b.getData()))
          break;
        case FlourOpcode.LESS:
          // console.log("less")
          b = new UnboxedValue(this.pop())
          a = new UnboxedValue(this.pop())
          // console.log(a.getData().toString())
          // console.log("<")
          // console.log(b.getData().toString())

          this.push(bytifyBool(a.getData()<b.getData()))
          break;
        case FlourOpcode.GREATER:
          b = new UnboxedValue(this.pop())
          a = new UnboxedValue(this.pop())
          this.push(bytifyBool(a.getData()>b.getData()))
          break;
        case FlourOpcode.JUMP:
          i+=instruction.getData()
          break;
        case FlourOpcode.JUMP_IF_FALSE:
          // console.log("jfalse")
          a = new UnboxedValue(this.peek(0))
          // console.log(a.getData().toString())
          if(a.getData()==0)
            i+=instruction.getData()
          break;
        case FlourOpcode.GET_LOCAL:
          // console.log("local")
          this.push(this.peek(instruction.getData()))
          break;
        case FlourOpcode.CONSTANT:
          // console.log("constant")
          // console.log(instruction.getData().toString())
          // console.log("out of")
          // console.log(c.constants.length.toString())
          this.push(c.constants[instruction.getData()].unboxedBytes )
          break;
        case FlourOpcode.POP:
          // console.log("pop")
          this.pop();
          break;
        case FlourOpcode.RETURN:
          // console.log("return")
          const res: Uint8Array = this.pop();
          // console.log((new UnboxedValue(res)).getData().toString())
          // for(let i:u32=0;i<this.stackTop/UNBOXED_BYTE_LENGTH;i++){
          //   console.log((new UnboxedValue(this.peek(i))).getData().toString())
          // }
          return res;
        case FlourOpcode.CALL:
          // console.log("call")
          this.push(this.runChunk(this.chunks[instruction.getData()]))
      }
    }

    return bytify(11111);
  }
 
}

class Chunk {
  constants: UnboxedValue[];
  instructions: Instruction[];

  constructor(chunkBuffer: Uint8Array){
    const len:u32 = chunkBuffer.length;
    // console.log(len.toString())

    const instructions_start: u32 = parseUint32(chunkBuffer, 0)
    const num_constants: u32 = (instructions_start-4)/UNBOXED_BYTE_LENGTH
    this.constants = new Array<UnboxedValue>(num_constants)
    let ind:u32 = 0;
    // console.log(num_constants.toString())
    for(let i:u32=4; i<instructions_start; i+=UNBOXED_BYTE_LENGTH){
      this.constants[ind] = new UnboxedValue(chunkBuffer.slice(i,i+UNBOXED_BYTE_LENGTH));
      // console.log("Constant")
      // console.log(FlourUnboxedTypeCode.FIXNUM)
      // console.log(this.constants[ind].getData().toString())
      ind++;
    }
    ind = 0;
    const instLen:u32 = (len-instructions_start)/INSTRUCTION_BYTE_LENGTH
    this.instructions = new Array<Instruction>(instLen)
    // console.log("instruction len")
    // console.log(instLen.toString())
    for(let i:u32=instructions_start; i<len; i+=INSTRUCTION_BYTE_LENGTH){
      this.instructions[ind] = new Instruction(chunkBuffer.slice(i,i+INSTRUCTION_BYTE_LENGTH));
      // console.log("instruction")
      // console.log(this.instructions[ind].getOpCode().toString())
      // console.log(this.instructions[ind].getData().toString())
      ind++;
    }
  }

}

class UnboxedValue{
  unboxedBytes: Uint8Array;
  constructor (unboxedBuffer: Uint8Array){
    this.unboxedBytes = unboxedBuffer;
  }

  getType():u8{
    return this.unboxedBytes[0]
  }

  getData():u32{
    return parseUint32(this.unboxedBytes, 1)
  }

}

class Instruction{
  instruction: Uint8Array;
  constructor (instructionBuffer: Uint8Array){
    this.instruction = instructionBuffer;
  }

  getOpCode():u8{
    return this.instruction[0]
  }

  getData():u32{
    return parseUint32(this.instruction, 1)
  }
}



