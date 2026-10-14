/**
 * Pure TypeScript QR Code generator (ISO/IEC 18004).
 * Standalone, zero external dependencies.
 */

export type EccLevel = "L" | "M" | "Q" | "H";

// Table of error correction code word lengths per block for each version and ECC level
const ECC_CODEWORDS_PER_BLOCK: number[][] = [
  // 0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10
  [0, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18], // L
  [0, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26], // M
  [0, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24], // Q
  [0, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28], // H
];

const NUM_ERROR_CORRECTION_BLOCKS: number[][] = [
  [0, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4], // L
  [0, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5], // M
  [0, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8], // Q
  [0, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8], // H
];

const CAPACITY_BYTES_L = [0, 19, 34, 55, 80, 108, 136, 156, 194, 232, 274];

// Galois Field GF(256) arithmetic with primitive polynomial 0x11D
const EXP_TABLE = new Uint8Array(512);
const LOG_TABLE = new Uint8Array(256);
(() => {
  let val = 1;
  for (let i = 0; i < 255; i++) {
    EXP_TABLE[i] = val;
    EXP_TABLE[i + 255] = val;
    LOG_TABLE[val] = i;
    val = (val << 1) ^ (val >= 128 ? 0x11d : 0);
  }
})();

function gfMultiply(x: number, y: number): number {
  if (x === 0 || y === 0) return 0;
  return EXP_TABLE[LOG_TABLE[x]! + LOG_TABLE[y]!];
}

function reedSolomonComputeDivisor(degree: number): Uint8Array {
  let result = new Uint8Array([1]);
  for (let i = 0; i < degree; i++) {
    const next = new Uint8Array(result.length + 1);
    for (let j = 0; j < result.length; j++) {
      next[j] ^= gfMultiply(result[j]!, EXP_TABLE[i]!);
      next[j + 1] ^= result[j]!;
    }
    result = next;
  }
  return result;
}

function reedSolomonComputeRemainder(data: Uint8Array, divisor: Uint8Array): Uint8Array {
  const result = new Uint8Array(divisor.length - 1);
  for (const byte of data) {
    const factor = byte ^ result[0]!;
    for (let i = 0; i < result.length - 1; i++) {
      result[i] = result[i + 1]! ^ gfMultiply(divisor[i + 1]!, factor);
    }
    result[result.length - 1] = gfMultiply(divisor[divisor.length - 1]!, factor);
  }
  return result;
}

export function generateQrMatrix(text: string): boolean[][] {
  const utf8 = new TextEncoder().encode(text);
  let version = 1;
  while (version <= 10 && utf8.length > CAPACITY_BYTES_L[version]! - 3) {
    version++;
  }
  if (version > 10) version = 10;

  const size = version * 4 + 17;
  const matrix: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
  const isFunction: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  const setFunctionModule = (r: number, c: number, val: boolean) => {
    if (r >= 0 && r < size && c >= 0 && c < size) {
      matrix[r]![c] = val;
      isFunction[r]![c] = true;
    }
  };

  // Draw 7x7 finder pattern
  const drawFinder = (top: number, left: number) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const row = top + r;
        const col = left + c;
        if (row < 0 || row >= size || col < 0 || col >= size) continue;
        const inOuter = r >= 0 && r <= 6 && c >= 0 && c <= 6;
        const isBorder = inOuter && (r === 0 || r === 6 || c === 0 || c === 6);
        const isCenter = inOuter && (r >= 2 && r <= 4 && c >= 2 && c <= 4);
        setFunctionModule(row, col, isBorder || isCenter);
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  // Timing patterns
  for (let i = 0; i < size; i++) {
    if (!isFunction[6]![i]) setFunctionModule(6, i, i % 2 === 0);
    if (!isFunction[i]![6]) setFunctionModule(i, 6, i % 2 === 0);
  }

  // Alignment pattern for version >= 2
  if (version >= 2) {
    const pos = version * 4 + 10;
    for (let r = -2; r <= 2; r++) {
      for (let c = -2; c <= 2; c++) {
        const isOuter = Math.abs(r) === 2 || Math.abs(c) === 2;
        const isCenter = r === 0 && c === 0;
        setFunctionModule(pos + r, pos + c, isOuter || isCenter);
      }
    }
  }

  // Dark module
  setFunctionModule(4 * version + 9, 8, true);

  // Format info area reservation
  for (let i = 0; i < 9; i++) {
    if (!isFunction[8]![i]) isFunction[8]![i] = true;
    if (!isFunction[i]![8]) isFunction[i]![8] = true;
  }
  for (let i = 0; i < 8; i++) {
    if (!isFunction[8]![size - 1 - i]) isFunction[8]![size - 1 - i] = true;
    if (!isFunction[size - 1 - i]![8]) isFunction[size - 1 - i]![8] = true;
  }

  // Build bitstream: byte mode (0100) + character count (8 bits) + data + terminator + pad
  const bits: number[] = [];
  const appendBits = (val: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1);
  };

  appendBits(0b0100, 4); // Byte mode
  appendBits(utf8.length, 8); // Count
  for (const byte of utf8) appendBits(byte, 8);

  const numDataBytes = CAPACITY_BYTES_L[version]!;
  const targetBits = numDataBytes * 8;
  appendBits(0, Math.min(4, targetBits - bits.length));
  while (bits.length % 8 !== 0) bits.push(0);

  const padBytes = [0xec, 0x11];
  let padIdx = 0;
  while (bits.length < targetBits) {
    appendBits(padBytes[padIdx % 2]!, 8);
    padIdx++;
  }

  // Error correction calculation
  const dataBytes = new Uint8Array(numDataBytes);
  for (let i = 0; i < numDataBytes; i++) {
    let byte = 0;
    for (let b = 0; b < 8; b++) byte = (byte << 1) | bits[i * 8 + b]!;
    dataBytes[i] = byte;
  }

  const numBlocks = NUM_ERROR_CORRECTION_BLOCKS[0]![version]!;
  const eccPerBlock = ECC_CODEWORDS_PER_BLOCK[0]![version]!;
  const divisor = reedSolomonComputeDivisor(eccPerBlock);

  const shortBlockLen = Math.floor(numDataBytes / numBlocks);
  const numLongBlocks = numDataBytes % numBlocks;
  const numShortBlocks = numBlocks - numLongBlocks;

  const dataBlocks: Uint8Array[] = [];
  const eccBlocks: Uint8Array[] = [];
  let byteOffset = 0;

  for (let b = 0; b < numBlocks; b++) {
    const len = b < numShortBlocks ? shortBlockLen : shortBlockLen + 1;
    const blockData = dataBytes.slice(byteOffset, byteOffset + len);
    byteOffset += len;
    dataBlocks.push(blockData);
    eccBlocks.push(reedSolomonComputeRemainder(blockData, divisor));
  }

  // Interleave data codewords
  const interleaved: number[] = [];
  const maxBlockLen = shortBlockLen + (numLongBlocks > 0 ? 1 : 0);
  for (let i = 0; i < maxBlockLen; i++) {
    for (let b = 0; b < numBlocks; b++) {
      if (i < dataBlocks[b]!.length) interleaved.push(dataBlocks[b]![i]!);
    }
  }
  // Interleave ECC codewords
  for (let i = 0; i < eccPerBlock; i++) {
    for (let b = 0; b < numBlocks; b++) {
      interleaved.push(eccBlocks[b]![i]!);
    }
  }

  const finalBits: number[] = [];
  for (const byte of interleaved) {
    for (let b = 7; b >= 0; b--) finalBits.push((byte >>> b) & 1);
  }

  // Place data bits in matrix (zig-zag 2-column traversal right to left)
  let bitIdx = 0;
  let upwards = true;
  for (let right = size - 1; right > 0; right -= 2) {
    if (right === 6) right--; // Skip vertical timing pattern
    for (let vert = 0; vert < size; vert++) {
      const r = upwards ? size - 1 - vert : vert;
      for (let c = right; c >= right - 1; c--) {
        if (!isFunction[r]![c]) {
          const bit = bitIdx < finalBits.length ? finalBits[bitIdx]! === 1 : false;
          // Apply mask 0: (r + c) % 2 === 0
          matrix[r]![c] = ((r + c) % 2 === 0) ? !bit : bit;
          bitIdx++;
        }
      }
    }
    upwards = !upwards;
  }

  // Write format info for ECC L (01) and mask 0 (000) => 0b01000 with BCH => 0x77c4 ^ 0x5412 = 0x23d6
  // Standard format bits for L, mask 0:
  const formatBits = 0x23d6;
  const fBits: boolean[] = [];
  for (let i = 14; i >= 0; i--) fBits.push(((formatBits >>> i) & 1) === 1);

  // Horizontal format
  for (let i = 0; i <= 5; i++) matrix[8]![i] = fBits[i]!;
  matrix[8]![7] = fBits[6]!;
  matrix[8]![8] = fBits[7]!;
  matrix[7]![8] = fBits[8]!;
  for (let i = 9; i <= 14; i++) matrix[14 - i]![8] = fBits[i]!;

  // Vertical format
  for (let i = 0; i <= 7; i++) matrix[size - 1 - i]![8] = fBits[i]!;
  for (let i = 8; i <= 14; i++) matrix[8]![size - 15 + i] = fBits[i]!;

  return matrix;
}

export function renderQrSvg(text: string, x: number, y: number, size: number, color = "#17202B"): string {
  try {
    const matrix = generateQrMatrix(text);
    const n = matrix.length;
    const cellSize = size / n;
    let path = "";
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (matrix[r]![c]) {
          const px = (x + c * cellSize).toFixed(2);
          const py = (y + r * cellSize).toFixed(2);
          const w = (cellSize + 0.1).toFixed(2); // Overlap slightly to prevent anti-aliasing seams
          path += `M${px},${py}h${w}v${w}h-${w}z `;
        }
      }
    }
    return `<path d="${path.trim()}" fill="${color}"/>`;
  } catch {
    return "";
  }
}
