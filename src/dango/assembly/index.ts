const MAX_PROGRAM_MEMORY = 1024*1024*16
import {FlourOpcode} from "../../flour/opcode"
const UNBOXED_BYTE_LENGTH = 8;
const UNBOXED_TYPE_LENGTH = 1;
const UNBOXED_DATA_LENGTH = 4;


const INSTRUCTION_BYTE_LENGTH = 5;
const INSTRUCTION_OPCODE_LENGTH = 1
const INSTRUCTION_DATA_LENGTH = 4;

let vm: DangoVM;

enum FlourUnboxedTypeCode {
  FIXNUM,
  BOOLEAN
}

export function initVM(programBuffer: Uint8Array):void{
  vm = new DangoVM(programBuffer)
}

export function run():u32{
  vm.evaluate();
  // const res = parseBytesAsUint(vm.evaluate(),1,4)
  vm.reset();
  return 1;
}

function parseBytesAsUint(arr:Uint8Array, offset: i32, numBytes: i32):u32{
  let sum:u32=0;
  for(let i=0;i<numBytes;i++){
    sum+=(<u32>arr[offset+numBytes-1-i])<<(8*i)
  }
  
  // const dView = new DataView(arr.buffer)
  
  return sum
}

function bytify(num: u32, buffer: Uint8Array, offset: u32):void{

  buffer[offset] = FlourUnboxedTypeCode.FIXNUM
  // const dView = new DataView(buffer.buffer)
  // dView.setUint32(offset+1,num)
  for(let i=0; i<4;i++){
    buffer[offset+4-i]=num & 255
    num>>=8;
  }

}

function bytifyBool(val: bool, buffer: Uint8Array, offset: u32):void{
  buffer[offset] = FlourUnboxedTypeCode.BOOLEAN
  buffer[offset+1]= 0
  buffer[offset+2]= 0
  buffer[offset+3]= 0
  buffer[offset+4]= val?1:0
}
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
    const num_chunks: u32 = parseBytesAsUint(programBuffer, 0, 4)
    this.chunks = new Array<Chunk>(num_chunks);

    for(let i:u32=0; i<num_chunks; i++){
      let start_ptr = parseBytesAsUint(programBuffer,4*i+4,4)
      let end_ptr = parseBytesAsUint(programBuffer, 4*i+8,4)  

      if(i==num_chunks-1){
        end_ptr = programBuffer.length
      }

      this.chunks[i] = new Chunk(start_ptr,end_ptr-start_ptr, programBuffer)
    }

    this.pushUint(12)
  }

  evaluate(): void{
    return this.runChunk(this.chunks[this.chunks.length-1])
  }

  reset():void{
    this.stackTop = 0;
    this.pushUint(12);
  }

  private push(pushBuffer: Uint8Array):void{
    if(pushBuffer.length!=UNBOXED_BYTE_LENGTH){
      throw "Stack push error";
    }
    this.stack.set(pushBuffer, this.stackTop)
    this.stackTop += UNBOXED_BYTE_LENGTH
  }

  private pushConstant(c: Chunk, ind: u32):void{
    this.stack.set(c.buffer.subarray(c.constants_start+UNBOXED_BYTE_LENGTH*ind, c.constants_start+UNBOXED_BYTE_LENGTH*(ind+1)), this.stackTop)
    this.stackTop += UNBOXED_BYTE_LENGTH
  }

  private pushLocal(ind: u32):void{
    // console.log("stack top")
    // console.log(this.stackTop.toString())
    // console.log("ind")
    // console.log(ind.toString())
    this.stack.copyWithin(this.stackTop, this.stackTop-(ind+1)*UNBOXED_BYTE_LENGTH,this.stackTop-(ind)*UNBOXED_BYTE_LENGTH)
    // this.stack.set(c.buffer.subarray(c.constants_start+UNBOXED_BYTE_LENGTH*ind, c.constants_start+UNBOXED_BYTE_LENGTH*(ind+1)), this.stackTop)
    this.stackTop += UNBOXED_BYTE_LENGTH
  }

  private pushUint(i: u32):void{
    bytify(i, this.stack, this.stackTop)
    this.stackTop+=UNBOXED_BYTE_LENGTH
  }

  private pushBool(i: bool):void{
    bytifyBool(i, this.stack, this.stackTop)
    this.stackTop+=UNBOXED_BYTE_LENGTH
  }

  private pop():void{
    this.stackTop -= UNBOXED_BYTE_LENGTH;
  }

  private popTwo():void{
    this.stackTop -= 2*UNBOXED_BYTE_LENGTH;
  }

  private peek(i: u32): Uint8Array{
    if(this.stackTop-(i+1)*UNBOXED_BYTE_LENGTH<0){
      throw "Stack access error"
    }
    return this.stack.slice(this.stackTop-(i+1)*UNBOXED_BYTE_LENGTH,this.stackTop-i*UNBOXED_BYTE_LENGTH)
  }

  private printStack():void{
    console.log("stak")
    for(let i:u32=0;i<this.stackTop;i+=UNBOXED_BYTE_LENGTH){
      console.log(parseBytesAsUint(this.stack,i+1,4).toString())
    }
  }

  private peekData(i: u32): u32{
    if(this.stackTop-(i+1)*UNBOXED_BYTE_LENGTH<0){
      throw "Stack access error"
    }
    return parseBytesAsUint(this.stack, this.stackTop-(i+1)*UNBOXED_BYTE_LENGTH+1,4)
  }

  private runChunk(c: Chunk): void{

    for(let i:u32=c.instructions_start;i<=c.chunkLen+c.instructions_start;i+=INSTRUCTION_BYTE_LENGTH){
      const opCode = c.buffer[i];
      // this.printStack()

      // console.log("code")
      // console.log(opCode.toString())
      // console.log("data")
      // console.log(c.getInstructionData(i).toString())
      switch(opCode) {
        case FlourOpcode.ADD:
          this.popTwo();
          this.pushUint(this.peekData(-1)+this.peekData(-2))
          break;
        case FlourOpcode.SUBTRACT:
          // console.log("sub")
          this.popTwo();
          // console.log((this.peekData(-2)-this.peekData(-1)).toString())
          this.pushUint(this.peekData(-1)-this.peekData(-2))
          break;
        case FlourOpcode.MULTIPLY:
          // console.log("mult")
          this.popTwo();
          this.pushUint(this.peekData(-1)*this.peekData(-2))
          break;
        case FlourOpcode.DIVIDE:
          // console.log("div")
          this.popTwo();
          this.pushUint(this.peekData(-1)/this.peekData(-2))
          break;
        case FlourOpcode.EQUAL:
          // console.log("eq")
          this.popTwo();
          this.pushBool(this.peekData(-1)==this.peekData(-2))
          break;
        case FlourOpcode.LESS:
          // console.log("less")
          this.popTwo();
          // console.log(this.peekData(-2).toString())
          // console.log("<")
          // console.log(this.peekData(-1).toString())
          this.pushBool(this.peekData(-1)<this.peekData(-2))
          break;
        case FlourOpcode.GREATER:
          console.log("gre")
          this.popTwo();
          this.pushBool(this.peekData(-1)>this.peekData(-2))
          break;
        case FlourOpcode.JUMP:
          // console.log("j")
          i+=c.getInstructionData(i)*INSTRUCTION_BYTE_LENGTH
          break;
        case FlourOpcode.JUMP_IF_FALSE:
          // console.log("jfalse")
          if(this.peekData(0)==0){
            // console.log("jumped")
            i+=c.getInstructionData(i)*INSTRUCTION_BYTE_LENGTH
          }
          break;
        case FlourOpcode.GET_VARIABLE:
          // console.log("locsl")
          this.pushLocal(c.getInstructionData(i))
          break;
        case FlourOpcode.CONSTANT:
          // console.log("const")
          this.pushConstant(c, c.getInstructionData(i))
          break;
        case FlourOpcode.POP:
          // console.log("pop")
          this.pop();
          break;
        case FlourOpcode.RETURN:
          // this.pop();
          // console.log("RETURN")
          return;
        case FlourOpcode.CALL:
          // console.log("Call")
          this.runChunk(this.chunks[parseBytesAsUint(c.buffer, i+1, 4)])
          // console.log("resolved")
          // console.log(i.toString())
          // console.log(c.chunkLen.toString())
          break;
      }
    }
    // console.log("last op")
    // console.log(lastop.toString())
    // console.log("reached end")
    throw "error"
    // return bytify(1);
  }
 
}

class Chunk {
  offset: u32;
  constants_start: u32;

  instructions_start: u32;
  num_constants: u32;
  chunkLen: u32;
  buffer: Uint8Array;

  constructor(offset:u32, chunkLen: u32, buffer: Uint8Array){
  
    this.buffer = buffer
    this.offset = offset
    this.chunkLen = chunkLen
    this.instructions_start = this.offset+parseBytesAsUint(buffer, offset, 4)
    this.constants_start = this.offset+4;
    this.num_constants = (this.instructions_start-this.constants_start)/UNBOXED_BYTE_LENGTH
  
  }

  // getConstant(ind:u32):Uint8Array{
  //   // console.log(parseBytesAsUint(this.buffer, this.offset+1,4).toString())
  //   return this.buffer.slice(this.constants_start+UNBOXED_BYTE_LENGTH*ind, this.constants_start+UNBOXED_BYTE_LENGTH*(ind+1))
  // }

  getInstructionOpCode(ind:u32):u8{
    return this.buffer[this.instructions_start+ind*INSTRUCTION_BYTE_LENGTH]
  }

  getInstructionData(ind:u32):u32{
    return parseBytesAsUint(this.buffer, ind+1, 4)
  }

}

// class UnboxedValue{
//   offset: u32;
//   constructor (offset:u32){
//     this.offset = offset;
//   }
// }

// function getType(val: UnboxedValue, buffer:Uint8Array):u8{
//   return buffer[val.offset]
// }

// function getUnboxedData(val: UnboxedValue, buffer:Uint8Array):u32{
//   return parseUint32(buffer, val.offset+1)
// }

// class Instruction{
//   offset: u32;
//   constructor (offset: u32){
//     this.offset = offset;
//   }
// }

// function getOpCode(ins: Instruction, chunkBuffer: Uint8Array):u8{
//   return chunkBuffer[ins.offset];
// }

// function getInstructionData(ins: Instruction, chunkBuffer: Uint8Array):u32{
//   return parseUint32(chunkBuffer, ins.offset+1)
// }



