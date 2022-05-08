import {FlourOpcode} from "../../flour/opcode"
import {FlourUnboxedTypeCode, FlourBoxedTypeCode} from "../../flour/typecode"
import {FlourPrimitiveMethodCodes} from "../../flour/primitives"

const UNBOXED_BYTE_LENGTH = 8;
const UNBOXED_TYPE_LENGTH = 1;
const UNBOXED_DATA_LENGTH = 4;

const FILE_HEADER: u64 = 0x464c4f5552000000

const INSTRUCTION_BYTE_LENGTH = 5;
const INSTRUCTION_OPCODE_LENGTH = 1
const INSTRUCTION_DATA_LENGTH = 4;

let vm: DangoVM;

const debug = false;

let runResult:u64 = 0;

export function initVM(programBuffer: Uint8Array):void{
  vm = new DangoVM(programBuffer)
}

export function getConsole():string{
  return vm.log;
}

export function getError():Error{
  return new Error("bruh");
}

export function run():string{
  return printUnboxed(vm.evaluate());
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

function getSignedData(unboxed:u64):i32{
  return <i32>((unboxed<<8)>>32);
}

function getType(unboxed:u64):u32{
  return <u32>(unboxed>>56);
}

function makeUnboxed(type:u64, data:u64):u64{
  return (type<<56)|(data<<24);
}

function printUnboxed(unboxed: u64): string{
  const type = getType(unboxed)
  const data = getSignedData(unboxed)
  if(type == FlourUnboxedTypeCode.BOOLEAN){
    return data>0? "#t" : "#f"
  }
  else if(type == FlourUnboxedTypeCode.CHARACTER){
    return String.fromCharCode(data)
  }
  else if(type == FlourUnboxedTypeCode.FIXNUM){
    return data.toString()
  }
  else if(type == FlourUnboxedTypeCode.NIL){
    return "null"
  }
  else if(type == FlourUnboxedTypeCode.FUNC_PTR){
    return "[lambda #" + getData(unboxed).toString()+"]"
  }
  throw new Error("Cant print unboxed type " + type.toString())
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
  num_args: u32;
  chunkNum: u32;
  enclosing: Environment;
  constructor(num_args:u32, chunkNum:u32, env:Environment){
    this.num_args = num_args;
    this.chunkNum = chunkNum;
    this.enclosing = env;
  }
}
class DangoVM {
  stack: Uint64Array;
  log: string;
  stackTop: u32;
  chunks: Chunk[];
  closures: Closure[];
  topEnvironment: Environment;


  constructor(programBuffer: Uint8Array){
    this.stack = new Uint64Array(1024*256);
    this.stackTop = 0;
    this.topEnvironment = new Environment(null);
    this.closures = new Array();
    this.log = ""
    for(let code=0; code<100;code++){
      this.topEnvironment.define(code, makeUnboxed(FlourUnboxedTypeCode.FUNC_PTR, this.closures.length))
      this.closures.push(new Closure(-1, 0, this.topEnvironment))
    }

    if(parseBytesAsUint64(programBuffer, 0) != FILE_HEADER){
      throw new Error("Incorrect file header")
    }

    const num_chunks: u32 = parseBytesAsUint32(programBuffer, 8)
    // console.log("num chunks")
    // console.log(num_chunks.toString())
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
  }

  private push(val: u64):void{
    this.stack[this.stackTop]=val
    this.stackTop++;
  }

  private pushConstant(c: Chunk, ind: u32):void{
    if (debug) console.log("Constant "+ind.toString()+" out of " + c.constants.length.toString())
    this.stack[this.stackTop] = c.constants[ind]
    this.stackTop++;
  }

  private pushInt(i: u32):void{
    this.push(makeUnboxed(FlourUnboxedTypeCode.FIXNUM, i))
  }

  private pushNil():void{
    this.push(makeUnboxed(FlourUnboxedTypeCode.NIL, 0))
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
  private popData():i32{
    return getSignedData(this.stack[--this.stackTop]);
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
      console.log("type: "+getType(this.stack[i]).toString()+ " data: "+ getData(this.stack[i]).toString())
    }
  }



  private runChunk(c: Chunk, enclosing: Environment): u64{
    // this.environmentMap.set(environment.index, environment)
    const environment = new Environment(enclosing);
    for(let i:u32=c.instructions_start;i<=c.chunkLen+c.instructions_start;i++){
      const opCode = c.buffer[i];
      // this.printStack()

      switch(opCode) {
        case FlourOpcode.JUMP:
          if(debug) console.log("JUMP")
          i+=c.getInstructionData(i)+4
          break;
        case FlourOpcode.JUMP_IF_FALSE:
          if(debug) console.log("JUMP False")
          if(getData(this.pop())==0){
            if(debug) console.log("^")
            i+=c.getInstructionData(i)
          }
          i+=4
          break;
        case FlourOpcode.NOT:
          if(debug) console.log("NOT")
          if(getType(this.peek(0))!=FlourUnboxedTypeCode.BOOLEAN){
            throw new Error("Error can only not a boolean")
          }
          this.stack[this.stackTop-1]^=(1<<24)
          break;
        case FlourOpcode.GET_VARIABLE:
          if(debug) console.log("GET var " + c.getInstructionData(i).toString())
          this.push(environment.get(c.getInstructionData(i)))
          i+=4
          break;
        case FlourOpcode.DEFINE_VARIABLE:
          if(debug) console.log("DEFINE")
          environment.define(c.getInstructionData(i), this.pop())
          i+=4
          break;
        case FlourOpcode.SET_VARIABLE:
          if(debug) console.log("SET")
          environment.set(c.getInstructionData(i), this.pop())
          i+=4
          break;
        case FlourOpcode.CONSTANT:
          if(debug) console.log("CONST")
          this.pushConstant(c, c.getInstructionData(i))
          i+=4
          break;
        case FlourOpcode.POP:
          if(debug) console.log("POP")
          this.pop();
          break;
        case FlourOpcode.RETURN:
          if(debug) console.log("RETURN")
          return this.peek(0);
        case FlourOpcode.CLOSURE:
          if(debug) console.log("CLOSURE")
          const idata = c.getInstructionData(i)
          const args = (idata << 24) >>> 24
          const chunk_num = idata >> 8

          this.closures.push(new Closure(args, chunk_num, environment))
          this.pushFuncPtr(this.closures.length-1)
          i+=4
          break
        case FlourOpcode.CALL:
          if(debug) console.log("CALL")
          const last = this.pop();
          if(getType(last)!=FlourUnboxedTypeCode.FUNC_PTR){
            throw new Error("Must call a function")
          }
          const num_args = c.getInstructionData(i)
          const closure_ptr = getData(last)
          const closure = this.closures[closure_ptr];
          if(closure.chunkNum==0){
            this.dispatchPrimitiveMethod(closure_ptr, num_args)
          }
          else{
            if(closure.num_args != num_args){
              throw new Error("Called function with wrong number of arguments")
            }
            this.runChunk(this.chunks[closure.chunkNum], closure.enclosing)
          }
          i+=4
          break;
        default:
          throw new Error("Opcode " + opCode.toString() + " not implemented")
      }
    }
    throw new Error("Execution error")
  }

  numericOnly(args:u32):void{
    for(let i:u32=0;i<args;i++){
      if(getType(this.peek(i))!=FlourUnboxedTypeCode.FIXNUM)
        throw new Error("Operation is for fixnums only");
    }
  }


  dispatchPrimitiveMethod(code: u32, args: u32):void{
    let sum:i32 = 0;
    let prod:i32 =1;
    const original_args = args;
    switch(code) {
      case FlourPrimitiveMethodCodes.ADD:
        this.numericOnly(args)
        while(args-->0){
          sum += this.popData()
        }
        this.pushInt(sum)
      break;
      case FlourPrimitiveMethodCodes.MULTIPLY:
        this.numericOnly(args)
        while(args-->0){
          prod *= this.popData()
        }
        this.pushInt(prod)
      break;
      case FlourPrimitiveMethodCodes.SUBTRACT:
        this.numericOnly(args)
        sum = getSignedData(this.stack[this.stackTop-args])
        while(args-->1){
          sum -= getSignedData(this.stack[this.stackTop-args])
        }
        this.stackTop -= original_args
        this.pushInt(sum)
      break;
      case FlourPrimitiveMethodCodes.DIVIDE:
        this.numericOnly(args)
        prod = getSignedData(this.stack[this.stackTop-args])
        while(args-->1){
          prod /= getSignedData(this.stack[this.stackTop-args])
        }
        this.stackTop -= original_args
        this.pushInt(prod)
      break;
      case FlourPrimitiveMethodCodes.NUMERICAL_EQ:
        if(args!=2)
          throw new Error("= must take 2 arguments")
        this.numericOnly(args)

        this.pushBool(this.pop()==this.pop())
      break
      case FlourPrimitiveMethodCodes.EQV:
        if(args!=2)
          throw new Error("eqv? must take 2 arguments")
        this.pushBool(this.pop()==this.pop())
      break
      case FlourPrimitiveMethodCodes.LESS:
        if(args!=2)
          throw new Error("< must take 2 arguments")
        this.numericOnly(args)
        this.pushBool(this.popData()>this.popData())
        break;
      case FlourPrimitiveMethodCodes.LEQ:
        if(args!=2)
          throw new Error("<= must take 2 arguments")
        this.numericOnly(args)
        this.pushBool(this.popData()>=this.popData())
        break;
      case FlourPrimitiveMethodCodes.GREATER:
        if(args!=2)
          throw new Error("> must take 2 arguments")
        this.numericOnly(args)
        this.pushBool(this.popData()<this.popData())
        break;
      case FlourPrimitiveMethodCodes.GEQ:
        if(args!=2)
          throw new Error(">= must take 2 arguments")
        this.numericOnly(args)
        this.pushBool(this.popData()<=this.popData())
        break;
      case FlourPrimitiveMethodCodes.PRINT:
        let output = "";
        while(args-->0){
          output += printUnboxed(this.stack[this.stackTop-args-1])
          if(args>0){
            output+=" "
          }
        }
        this.stackTop -= original_args
        this.log += output + "\n"
        console.log(output)
        this.pushNil()
      break;
      case FlourPrimitiveMethodCodes.NOT:
        if(args!=1)
          throw new Error("not must take 1 argument")
        if(getType(this.peek(0))!=FlourUnboxedTypeCode.BOOLEAN)
          throw new Error("not must recieve boolean")
        this.stack[this.stackTop-1]^=(1<<24)
        break
      case FlourPrimitiveMethodCodes.NEGATE:
        if(args!=1)
          throw new Error("negate must take 1 argument")
        if(getType(this.peek(0))!=FlourUnboxedTypeCode.FIXNUM)
          throw new Error("negate must recieve number")
        this.pushInt(-this.popData())
        break
      case FlourPrimitiveMethodCodes.ABS:
        if(args!=1)
          throw new Error("abs must take 1 argument")
        if(getType(this.peek(0))!=FlourUnboxedTypeCode.FIXNUM)
          throw new Error("abs must recieve number")
        this.pushInt(abs(this.popData()))
        break
      case FlourPrimitiveMethodCodes.IS_BOOLEAN:
        if(args!=1)
          throw new Error("boolean? must take 1 argument")
        this.pushBool(getType(this.pop())==FlourUnboxedTypeCode.BOOLEAN)
        break
      case FlourPrimitiveMethodCodes.IS_FIXNUM:
        if(args!=1)
          throw new Error("number? must take 1 argument")
        this.pushBool(getType(this.pop())==FlourUnboxedTypeCode.FIXNUM)
        break
      case FlourPrimitiveMethodCodes.IS_CHARACTER:
        if(args!=1)
          throw new Error("character? must take 1 argument")
        this.pushBool(getType(this.pop())==FlourUnboxedTypeCode.CHARACTER)
        break
      case FlourPrimitiveMethodCodes.IS_NIL:
        if(args!=1)
          throw new Error("character? must take 1 argument")
        this.pushBool(getType(this.pop())==FlourUnboxedTypeCode.NIL)
        break
      case FlourPrimitiveMethodCodes.IS_PROCEDURE:
        if(args!=1)
          throw new Error("character? must take 1 argument")
        this.pushBool(getType(this.pop())==FlourUnboxedTypeCode.FUNC_PTR)
        break
      default:
        throw new Error("Primitive " + code.toString() + " not defined");
    
    }

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
    // console.log("num constants")
    // console.log(this.num_constants.toString())
    this.constants = new Uint64Array(this.num_constants);

    // console.log("Constants")

    let index = 0;
    for(let i=this.constants_start;i<this.data_start;i+=UNBOXED_BYTE_LENGTH){
      this.constants[index++] = parseBytesAsUint64(buffer, i)
    }

  }

  getInstructionOpCode(ind:u32):u8{
    return this.buffer[this.instructions_start+ind*INSTRUCTION_BYTE_LENGTH]
  }

  getInstructionData(ind:u32):u32{
    return parseBytesAsUint32(this.buffer, ind+1)
  }

}


