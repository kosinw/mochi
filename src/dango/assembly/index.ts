const MAX_PROGRAM_MEMORY = 1024*1024*16
import {FlourOpcode} from "../../flour/opcode"
import {FlourUnboxedTypeCode, FlourBoxedTypeCode} from "../../flour/typecode"

const UNBOXED_BYTE_LENGTH = 8;
const UNBOXED_TYPE_LENGTH = 1;
const UNBOXED_DATA_LENGTH = 4;

const FILE_HEADER: u64 = 0x464c4f5552000000

const INSTRUCTION_BYTE_LENGTH = 5;
const INSTRUCTION_OPCODE_LENGTH = 1
const INSTRUCTION_DATA_LENGTH = 4;

let vm: DangoVM;


export function initVM(programBuffer: Uint8Array):void{
  console.log("INITING")
  vm = new DangoVM(programBuffer)
}

export function run():u32{
  const res = getData(vm.evaluate());
  // const res = parseBytesAsUint(vm.evaluate(),1,4)
  vm.reset();
  return res;
}

function parseBytesAsUint32(arr:Uint8Array, offset: i32):u32{
  let sum:u32=0;
  for(let i=0;i<4;i++){
    sum+=(<u32>arr[offset+4-1-i])<<(8*i)
  }  
  return sum
}

function parseBytesAsUint64(arr:Uint8Array, offset: i32):u64{
  let sum:u64=0;
  for(let i=0;i<8;i++){
    sum+=(<u64>arr[offset+8-1-i])<<(8*i);
  }
  return sum
}

function getData(unboxed:u64):u32{
  return <u32>((unboxed<<8)>>32);
}

function getType(unboxed:u64):u32{
  return <u32>(unboxed>>56);
}

function makeUnboxed(type:u64, data:u64):u64{
  return (type<<56)|(data<<24);
}


class Environment{
  map: Map<u32, u64>;
  parent: Environment|null;

  constructor(parent: Environment|null){
    this.parent=parent;
    this.map = new Map();
  }

  public get(key:u32):u64{
    if(this.map.has(key)){
      return this.map.get(key)
    }
    if(this.parent!==null){
      return (<Environment>this.parent).get(key);
    }
    throw new Error("Tried getting variable thats not in scope")
  }

  public set(key:u32, value:u64):void{
    if(this.map.has(key)){
      this.map.set(key, value)
    }
    else if(this.parent!==null){
      (<Environment>this.parent).set(key, value);
    }
    else{
      throw new Error("Tried setting variable thats not in scope")
    }
  }

  public define(key:u32, value:u64):void{
    this.map.set(key, value)
  }
}

class Closure{
  // num_args: u32;
  chunkNum: u32;
  enclosing: Environment;
  constructor(chunkNum:u32, env:Environment){
    this.chunkNum = chunkNum;
    this.enclosing = env;
  }
}
class DangoVM {
  stack: Uint64Array;
  heap: Uint8Array;
  stackTop: u32;
  chunks: Chunk[];
  closures: Closure[];
  topEnvironment: Environment;
  // environmentMap: Map<u32, Environment>;
  environmentIndex: u32;

  constructor(programBuffer: Uint8Array){
    this.stack = new Uint64Array(1024);
    this.stackTop = 0;
    this.heap = new Uint8Array(1024);
    this.environmentIndex = 0;
    this.topEnvironment = new Environment(null);
    this.closures = new Array();
    // this.environmentMap = new Map();

    if(parseBytesAsUint64(programBuffer, 0) != FILE_HEADER){
      throw new Error("Incorrect file header")
    }

    const num_chunks: u32 = parseBytesAsUint32(programBuffer, 8)
    console.log("num chunks")
    console.log(num_chunks.toString())
    this.chunks = new Array<Chunk>(num_chunks);

    for(let i:u32=0; i<num_chunks; i++){
      let start_ptr = parseBytesAsUint32(programBuffer,4*i+12)
      let end_ptr = parseBytesAsUint32(programBuffer, 4*i+16)  

      if(i==num_chunks-1){
        end_ptr = programBuffer.length
      }

      this.chunks[i] = new Chunk(start_ptr, end_ptr-start_ptr, programBuffer)
    }

  }

  evaluate(): u64{
    return this.runChunk(this.chunks[0], this.topEnvironment)
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

  private pushFuncPtr(i: u32):void{
    this.push(makeUnboxed(FlourUnboxedTypeCode.FUNC_PTR, i))
  }

  private pop():u64{
    return this.stack[--this.stackTop];
  }
  private popData():u32{
    return getData(this.stack[--this.stackTop]);
  }

  private peek(i: u32): u64{
    return this.stack[this.stackTop-i-1];
  }
  private peekData(i: u32): u32{
    return getData(this.stack[this.stackTop-i-1]);
  }

  private printStack():void{
    console.log("stak")
    for(let i:u32=0;i<this.stackTop;i++){
      console.log(getData(this.stack[i]).toString())
    }
  }



  private runChunk(c: Chunk, enclosing: Environment): u64{
    // this.environmentMap.set(environment.index, environment)
    const environment = new Environment(enclosing);
    for(let i:u32=c.instructions_start;i<=c.chunkLen+c.instructions_start;i++){
      const opCode = c.buffer[i];
      // this.printStack()
      console.log("code")
      console.log(opCode.toString())
      // console.log("data")
      // console.log(c.getInstructionData(i).toString())
      switch(opCode) {
        case FlourOpcode.JUMP:
          i+=c.getInstructionData(i)*INSTRUCTION_BYTE_LENGTH
          i+=4
          break;
        case FlourOpcode.JUMP_IF_FALSE:
          if(this.peekData(0)==0){
            i+=c.getInstructionData(i)*INSTRUCTION_BYTE_LENGTH
            i+=4
          }
          break;
        case FlourOpcode.GET_VARIABLE:
          console.log("GET")
          this.push(environment.get(c.getInstructionData(i)))
          i+=4
          break;
        case FlourOpcode.DEFINE_VARIABLE:
          console.log("DEFINE")
          environment.define(c.getInstructionData(i), this.pop())
          i+=4
          break;
        case FlourOpcode.SET_VARIABLE:
          environment.set(c.getInstructionData(i), this.pop())
          i+=4
          break;
        case FlourOpcode.CONSTANT:
          console.log("const")
          this.pushConstant(c, c.getInstructionData(i))
          i+=4
          break;
        case FlourOpcode.POP:
          this.pop();
          break;
        case FlourOpcode.RETURN:
          console.log("RETURNed")
          return this.pop();
        case FlourOpcode.CLOSURE:
          console.log("made closures")
          this.closures.push(new Closure(c.getInstructionData(i), environment))
          i+=4
          this.pushFuncPtr(this.closures.length-1)
          break
        case FlourOpcode.CALL:
          console.log("CALL")
          const last = this.pop();
          if(getType(last)!=FlourUnboxedTypeCode.FUNC_PTR){
            throw new Error("Must call a function")
          }
          const closure = this.closures[getData(last)];
          this.runChunk(this.chunks[closure.chunkNum], closure.enclosing)
          i+=4
          break;
        default:
          throw new Error("Opcode " + opCode.toString() + " not implemented")
      }
    }
    throw new Error("Execution error")
  }
 
}

class Chunk {
  offset: u32;
  constants_start: u32;
  name: u64;
  data_start: u32;
  instructions_start: u32;
  num_constants: u32;
  chunkLen: u32;
  buffer: Uint8Array;
  constants: Uint64Array;

  constructor(offset:u32, chunkLen: u32, buffer: Uint8Array){
    this.buffer = buffer
    this.offset = offset
    this.chunkLen = chunkLen

    this.name =  parseBytesAsUint64(buffer, offset)
    this.data_start = parseBytesAsUint32(buffer, offset+8)
    this.instructions_start = parseBytesAsUint32(buffer, offset+12)

    this.constants_start = this.offset+16;
    this.num_constants = (this.data_start-this.constants_start)/UNBOXED_BYTE_LENGTH
    console.log("num constants")
    console.log(this.num_constants.toString())
    this.constants = new Uint64Array(this.num_constants);

    console.log("Constants")

    let index = 0;
    for(let i=this.constants_start;i<this.data_start;i+=UNBOXED_BYTE_LENGTH){
      this.constants[index++] = parseBytesAsUint64(buffer, i)
      console.log(this.constants[index-1].toString())
    }

  }

  getInstructionOpCode(ind:u32):u8{
    return this.buffer[this.instructions_start+ind*INSTRUCTION_BYTE_LENGTH]
  }

  getInstructionData(ind:u32):u32{
    return parseBytesAsUint32(this.buffer, ind+1)
  }

}


