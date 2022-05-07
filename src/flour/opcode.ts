///
/// File: flour/opcode.ts 
/// Copyright (c) 2022 Kosi Nwabueze and Anirudh Rahul
///
/// This program is free software: you can redistribute it and/or modify
/// it under the terms of the GNU Lesser General Public License as published by
/// the Free Software Foundation, either version 3 of the License, or
/// (at your option) any later version.
///
/// This program is distributed in the hope that it will be useful,
/// but WITHOUT ANY WARRANTY; without even the implied warranty of
/// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
/// GNU General Public License for more details.
///
/// You should have received a copy of the GNU Lesser General Public License
/// along with this program.  If not, see <https://www.gnu.org/licenses/>.
///

/**
 * An opcode for the Flour bytecode format specification.
 */
export enum FlourOpcode {
  /// Core instructions.
  CONSTANT = 0,
  DEFINE_VARIABLE,
  GET_VARIABLE,
  SET_VARIABLE,
  NOP,

  /// Control flow instructions.
  JUMP,
  JUMP_IF_FALSE,
  CALL,
  RETURN,
  POP,
  CLOSURE,
  NOT,

  /// Instructions that could be implemented as primitive procedures.
  
  POW,
  MOD,

}