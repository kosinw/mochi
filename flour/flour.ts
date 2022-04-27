interface AddressMap {
    [key: string]: number;
}
type NestedExpression = string | NestedExpression[]
const address_modes:AddressMap = {
    "register":0x10, 
    "const": 0x01
}
const registerCodes:AddressMap = {
    "a": 0x01, 
    "b": 0x02, 
    "c": 0x03,
    "d": 0x04,
    "e": 0x05,
    "f": 0x06,
}
const opcodes:AddressMap = {
    "move": 0x01, 
    "add": 0x02, 
    "sub": 0x03,
    "div": 0x04,
    "mult": 0x05,

    "goto": 0x10,
}

const instructionLength = 16
const JUMP_INSTRUCTION = "goto"
export class FlourAssembler {

    
    public static assemble(assembler_text: string): Uint8Array {
        const parsed:NestedExpression = assembler_text.trim().split("\n").map(FlourAssembler.parse_expression)

        const processed:NestedExpression[] = FlourAssembler.process_labels(parsed)

        const bytes: Uint8Array[] = processed.map(FlourAssembler.bytify_expression)
        
        const merged: Uint8Array = new Uint8Array(bytes.length*instructionLength)

        for(let i=0; i<merged.length; i+=instructionLength){
            merged.set(bytes[i/instructionLength], i)
        }

        console.log(processed)
        console.log(bytes)
        console.log(merged)

        return merged
    }




    private static is_expression(expr: string):boolean{
        return expr.startsWith('(') && expr.endsWith(')')
    }

    private static parse_expression(expr: string):NestedExpression{
        expr = expr.trim()
        const parsed:NestedExpression = []
        if(FlourAssembler.is_expression(expr)){
            // Use negative lookahead to split on spaces not nested in parens
            const expr_components: string[] = expr.slice(1,-1).split(/ \s*(?![^()]*\))/);
            for(const component of expr_components){
                parsed.push(FlourAssembler.parse_expression(component));
            }
        }
        else{
            return expr
        }

        return parsed
    }

    // TODO: is there a more general way to do this
    private static bytify_data(data: string, address_mode: string):Uint8Array{
        const data_bytes:Uint8Array = new Uint8Array(4)
        if(address_mode == "register"){
            data_bytes[0] = registerCodes[data]
        }
        else if(address_mode == "const"){
            // coerce int to unsigned mode and print it in binary
            const bits: string = (parseInt(data) >>> 0).toString(2)
            if(bits.length>32){
                throw 'Integer overflow'
            }
            const padded: string = bits.padStart(32,'0')
            console.log(padded)
            for(let i=0; i<32; i+=8){
                data_bytes[i/8] = parseInt(padded.slice(i,i+8),2)
            }
        }
        
        return data_bytes;
    }

    private static bytify_expression(expr: NestedExpression): Uint8Array{
        const bytes:Uint8Array = new Uint8Array(instructionLength);
        let byteIndex = 0;
        if(typeof expr[0] != 'string'){
            throw 'format error'
        }
        const operation:string = expr[0]
        const opcode:number = opcodes[operation]
        bytes[byteIndex] = opcode
        byteIndex++;
        for(const argument of expr.slice(1)){
            if(typeof argument[0] != 'string' || typeof argument[1] != 'string'){
                throw 'format error'
            }
            const address_mode = argument[0]
            const data = argument[1]
            bytes[byteIndex] = address_modes[address_mode]
            byteIndex++;
            
            for(const byte of FlourAssembler.bytify_data(data, address_mode)){
                bytes[byteIndex] = byte;
                byteIndex++;
            }
        }

        return bytes
    }

    private static process_labels(expressionList: NestedExpression):NestedExpression[]{
        const labelMap = new Map<string, number>();
        let index: number = 0;
        const proccessedExpressionList: NestedExpression[] = [] 
        for(const expr of expressionList){
            if(expr[0]==='label'){
                if (typeof expr[1]=='string'){
                    labelMap.set(expr[1], index);
                } 
            }
            else{
                let cur_instruction:NestedExpression = expr
                if (expr[0]==JUMP_INSTRUCTION){
                    const jump_target = expr[1]
                    if(jump_target[0]=='label' && typeof jump_target[1]=='string'){
                        if(!labelMap.has(jump_target[1])){
                            throw `Label ${jump_target[1]} does not exist expression:\n${expr}`
                        }
                        else{
                            cur_instruction = [cur_instruction[0], ['const', (labelMap.get(jump_target[1])||0).toString()]]
                        }
                    }

                }
                proccessedExpressionList.push(cur_instruction)
                index+=instructionLength
            }
        }
        return proccessedExpressionList
    }
}


FlourAssembler.assemble(`
(label bigchungus)
(move (register a) (register b))
(add (register a) (const 12))
(add (register a) (const 112312132))
(add (register a) (const -131231))
(label shumah)
(goto (label bigchungus))
(goto (label shumah))
`)

/**
 * INSTRUCTION
 * 1 byte  | 5 bytes    | 5 bytes   | 5 bytes
 * opcode    argument A   argument B    argument C
 * Argument
 * 1 byte address mode
 * 4 byte data
 */

// 0: (label bigchungus)
// 16:    (lt (register a) (const 12))
// 32:    (goto (register a))  => // goto opcode | 0 | ... | ...

// instructions:
// move: (move (target a) (target b))
// add: (add (target destination) (target source-a) (target source-b))
// sub: (sub ...)
// div: (div ...)
// mul: (mul ...)
// goto: (goto ...)
// branch: (branch ...)
// test: (test ...)
// eq: (eq ...)
// lt: (lt ...)
// gt: (gt ...)
// lteq: (lteq ...)
// gteq: (gteq ...)
// and: (and ...)
// or: (or ...)
// not: (not ...)
// call: (call ...)
// ret: (ret ...)
// load: (load ...)
// store: (store ...)
// nop: (nop)

// addressing modes:
// register
// const
// indirect

// FlourReader (lexing + parsing)
// FlourLabelReplacer
// FlourEncoder ()

// mov a, b // 01 00 01 (opcode)
// load ..a..