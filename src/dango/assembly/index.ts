const MAX_PROGRAM_MEMORY = 1024*1024*16
import {FlourOpcode, UnboxedValueVariant as FlourUnboxedTypeCode} from "../../flour"

const UNBOXED_BYTE_LENGTH = 8;
const UNBOXED_TYPE_LENGTH = 1;
const UNBOXED_DATA_LENGTH = 4;


const INSTRUCTION_BYTE_LENGTH = 5;
const INSTRUCTION_OPCODE_LENGTH = 1
const INSTRUCTION_DATA_LENGTH = 4;

let vm: DangoVM;


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
  return sum
}

function getData(unboxed:u64):u32{
  return ((unboxed<<8)>>32);
}

function getType(unboxed:u64):u32{
  return (unboxed>>56);
}

function makeUnboxed(type:u64, data:u64):u64{
  return (type<<56)|(data<<24);
}


class Environment{
  map: Map<u32, u64>;
  parent: Environment|null;
  index: u32;
  constructor(parent: Environment|null, index:u32){
    this.parent=parent;
    this.map = new Map();
    this.index = index;
  }

  public get(key:u32):u64{
    if(this.map.has(key)){
      return this.map.get(key)
    }
    if(this.parent!=null){
      return this.parent.get(key);
    }
    throw new Error("Tried getting variable thats not in scope")
  }

  public set(key:u32, value:u64):void{
    if(this.map.has(key)){
      this.map.set(key, value)
    }
    else if(this.parent!=null){
      this.parent.set(key, value);
    }
    throw new Error("Tried setting variable thats not in scope")
  }

  public define(key:u32, value:u64){
    this.map.set(key, value)
  }

}
class DangoVM {
  stack: Uint64Array;
  heap: Uint8Array;
  stackTop: u32;
  chunks: Chunk[];
  topEnvironment: Environment;
  environmentMap: Map<u32, Environment>;
  environmentIndex: u32;

  constructor(programBuffer: Uint8Array){
    this.stack = new Uint64Array(MAX_PROGRAM_MEMORY/8);
    this.stackTop = 0;
    this.heap = new Uint8Array(MAX_PROGRAM_MEMORY);
    this.environmentIndex = 0;
    this.topEnvironment = new Environment(null, this.environmentIndex++);
    this.environmentMap = new Map()    

    const num_chunks: u32 = parseBytesAsUint(programBuffer, 0, 4)
    this.chunks = new Array<Chunk>(num_chunks);

    for(let i:u32=0; i<num_chunks; i++){
      let start_ptr = parseBytesAsUint(programBuffer,4*i+4,4)
      let end_ptr = parseBytesAsUint(programBuffer, 4*i+8,4)  

      if(i==num_chunks-1){
        end_ptr = programBuffer.length
      }

      this.chunks[i] = new Chunk(start_ptr, end_ptr-start_ptr, programBuffer)
    }

    this.pushUint(12)
  }

  evaluate(): void{
    return this.runChunk(this.chunks[this.chunks.length-1], this.topEnvironment)
  }

  reset():void{
    this.stackTop = 0;
    this.pushUint(12);
  }

  private push(val: u64):void{
    this.stack[this.stackTop]=val
    this.stackTop++;
  }

  private pushConstant(c: Chunk, ind: u32):void{
    // this.stack.set(c.buffer.subarray(c.constants_start+UNBOXED_BYTE_LENGTH*ind, c.constants_start+UNBOXED_BYTE_LENGTH*(ind+1)), this.stackTop)
    this.stack[this.stackTop] = c.constants[ind]
    this.stackTop++;
  }

  private pushUint(i: u32):void{
    this.push(makeUnboxed(FlourUnboxedTypeCode.FIXNUM, i))
  }

  private pushBool(i: bool):void{
    this.push(makeUnboxed(FlourUnboxedTypeCode.BOOLEAN, i?1:0))
  }

  private pushPtr(i: u32):void{
    this.push(makeUnboxed(FlourUnboxedTypeCode.PTR, i))

  }

  private pop():u64{
    return this.stack[this.stackTop--];
  }
  private popData():u64{
    return getData(this.stack[this.stackTop--]);
  }

  private peek(i: u32): u64{
    return this.stack[this.stackTop-i-1];
  }
  private peekData(i: u32): u32{
    return getData(this.stack[this.stackTop-i-1]);
  }

  private printStack():void{
    console.log("stak")
    for(let i:u32=0;i<this.stackTop;i+=UNBOXED_BYTE_LENGTH){
      console.log(parseBytesAsUint(this.stack,i+1,4).toString())
    }
  }



  private runChunk(c: Chunk, environment: Environment): void{
    this.environmentMap.set(environment.index, environment)
    for(let i:u32=c.instructions_start;i<=c.chunkLen+c.instructions_start;i+=INSTRUCTION_BYTE_LENGTH){
      const opCode = c.buffer[i];
      // this.printStack()

      // console.log("code")
      // console.log(opCode.toString())
      // console.log("data")
      // console.log(c.getInstructionData(i).toString())
      switch(opCode) {
        case FlourOpcode.ADD:
          this.pushUint(this.popData()+this.popData())
          break;
        case FlourOpcode.SUBTRACT:
          // console.log("sub")
          // console.log((this.peekData(-2)-this.peekData(-1)).toString())
          this.pushUint(this.popData()-this.popData())
          break;
        case FlourOpcode.MULTIPLY:
          // console.log("mult")
          this.pushUint(this.popData()*this.popData())
          break;
        case FlourOpcode.DIVIDE:
          // console.log("div")
          this.pushUint(this.popData()/this.popData())
          break;
        case FlourOpcode.EQUAL:
          // console.log("eq")
          // this.popTwo();
          this.pushBool(this.popData()==this.popData())
          break;
        case FlourOpcode.LESS:
          // console.log("less")
          // this.popTwo();
          this.pushBool(this.popData()<this.popData())
          break;
        case FlourOpcode.GREATER:
          // console.log("gre")
          this.pushBool(this.popData()>this.popData())
          break;
        case FlourOpcode.JUMP:
          i+=c.getInstructionData(i)*INSTRUCTION_BYTE_LENGTH
          break;
        case FlourOpcode.JUMP_IF_FALSE:
          if(this.peekData(0)==0){
            i+=c.getInstructionData(i)*INSTRUCTION_BYTE_LENGTH
          }
          break;
        case FlourOpcode.GET_VARIABLE:
          this.push(environment.get(c.getInstructionData(i)))
          break;
        case FlourOpcode.DEFINE_VARIABLE:
          environment.define(c.getInstructionData(i), this.pop())
          break;
        case FlourOpcode.SET_VARIABLE:
          environment.set(c.getInstructionData(i), this.pop())
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
          const last = this.pop();
          let chunkIndex = 0;
          // this.runChunk(chunkIndex, new Environment(environment, this.environmentIndex++))
          // this.runChunk(this.chunks[parseBytesAsUint(c.buffer, i+1, 4)])
          // console.log("resolved")
          // console.log(i.toString())
          // console.log(c.chunkLen.toString())
          break;
      }
    }
    throw "error"
  }
 
}

class Chunk {
  offset: u32;
  constants_start: u32;

  instructions_start: u32;
  num_constants: u32;
  chunkLen: u32;
  buffer: Uint8Array;
  constants: Uint64Array;

  constructor(offset:u32, chunkLen: u32, buffer: Uint8Array){
  
    this.buffer = buffer
    this.offset = offset
    this.chunkLen = chunkLen
    this.instructions_start = this.offset+parseBytesAsUint(buffer, offset, 4)
    this.constants_start = this.offset+4;
    this.num_constants = (this.instructions_start-this.constants_start)/UNBOXED_BYTE_LENGTH
  
    this.constants = new Uint64Array(this.num_constants);

    const data_view = new DataView(buffer.buffer)
    for(let i=this.constants_start;i<this.instructions_start;i+=UNBOXED_BYTE_LENGTH){
      this.constants[i] = data_view.getUint64(i)
    }

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


