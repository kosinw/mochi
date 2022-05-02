const MAX_PROGRAM_MEMORY = 1024*1024*16
import {FlourOpcode, UnboxedTypeCode, BoxedTypeCode, UNBOXED_BYTE_LENGTH} from "../../flour"
// let programBuffer = new Uint8Array(MAX_PROGRAM_MEMORY); // have some data in AssemblyScript

// export function getData(): Float64Array {
//   return programBuffer;
// }

export const Int32Array_ID = idof<Int32Array>()

// function parseUint32(a:u8, b:u8, c:u8, d:u8):u32{
//     return a<<24 | b << 16 | c << 8 | d
// }

function parseUint32(arr:Uint8Array, index: i32):u32{
  return arr[index]<<24 | arr[index+1] << 16 | arr[index+2] << 8 | arr[index+3]
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
    const num_chunks: u32 = parseUint32(programBuffer, 0)
    this.chunks = new Array<Chunk>(num_chunks);
    
    for(let i=0; i<num_chunks; i++){
      let start_ptr = parseUint32(programBuffer,32*i+32)
      let end_ptr = parseUint32(programBuffer, 32+i+64)  
      if(i==num_chunks-1){
        end_ptr = programBuffer.length
      }
      this.chunks[i] = new Chunk(programBuffer.slice(start_ptr, end_ptr))
    }
  }

  private push(pushBuffer: Uint8Array){
    if(pushBuffer.length!=UNBOXED_BYTE_LENGTH){
      throw "Stack push error";
    }
    this.stack.set(pushBuffer, this.stackTop)
    this.stackTop += UNBOXED_BYTE_LENGTH
  }

  private pop(){
    this.stackTop -= UNBOXED_BYTE_LENGTH;
  }

  private runChunk(c: Chunk){

  }
 
}

class Chunk {
  constants: Uint8Array;
  data: Uint8Array;
  instructions: Uint8Array;

  constructor(chunkBuffer: Uint8Array){
    const instructions_start: u32 = parseUint32(chunkBuffer, 0)
    this.constants = chunkBuffer.slice(4, instructions_start)
    this.instructions = chunkBuffer.slice(instructions_start, chunkBuffer.length)
  }

  getConstant(index: u32): u32{
    const typeCode: u8 = this.constants[index*UNBOXED_BYTE_LENGTH]
    if(typeCode == UnboxedTypeCode.FIXNUM){
      return parseUint32(this.constants, index+1)
    }
    return -1;
  }
}

class Constant{
  
}

class ChunkInstruction{

}

export function evaluate(programBuffer: Uint8Array):i32{
  let vm: DangoVM = new DangoVM(programBuffer)

  let opcode: i32 = 0
  if(opcode == FlourOpcode.ADD){
    console.log("HI")
  }

  return 0
}

