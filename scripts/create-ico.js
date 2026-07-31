// Creates a minimal 256x256 PNG and ICO file for Electron packaging
// ICO format: https://en.wikipedia.org/wiki/ICO_(file_format)

const fs = require("fs");
const path = require("path");

// Create a simple 256x256 BMP-style image for ICO
// Using a solid blue square with white text area

function createPNG(size) {
  // Create a minimal PNG with RGBA data
  const { createCanvas } = (() => {
    try {
      return require("canvas");
    } catch {
      return { createCanvas: null };
    }
  })();

  if (createCanvas) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext("2d");
    
    // Blue rounded rect background
    ctx.fillStyle = "#4361ee";
    ctx.fillRect(0, 0, size, size);
    
    // White text
    ctx.fillStyle = "white";
    ctx.font = `bold ${Math.floor(size * 0.25)}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("ABC", size / 2, size * 0.4);
    ctx.font = `${Math.floor(size * 0.15)}px Arial`;
    ctx.fillText("單字", size / 2, size * 0.7);
    
    return canvas.toBuffer("image/png");
  }
  
  // Fallback: create a minimal 1-pixel blue PNG and scale concept
  // For a proper icon, user should provide a real PNG
  return createMinimalBluePNG(size);
}

function createMinimalBluePNG(size) {
  // Create a raw PNG file with a solid blue color
  const zlib = require("zlib");
  
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  
  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); // width
  ihdr.writeUInt32BE(size, 4); // height
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type (RGB)
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  
  const ihdrChunk = createChunk("IHDR", ihdr);
  
  // IDAT chunk - raw image data
  const rowSize = 1 + size * 3; // filter byte + RGB per pixel
  const rawData = Buffer.alloc(rowSize * size);
  
  for (let y = 0; y < size; y++) {
    const offset = y * rowSize;
    rawData[offset] = 0; // no filter
    for (let x = 0; x < size; x++) {
      const px = offset + 1 + x * 3;
      rawData[px] = 0x43;     // R (from #4361ee)
      rawData[px + 1] = 0x61; // G
      rawData[px + 2] = 0xee; // B
    }
  }
  
  const compressed = zlib.deflateSync(rawData);
  const idatChunk = createChunk("IDAT", compressed);
  
  // IEND chunk
  const iendChunk = createChunk("IEND", Buffer.alloc(0));
  
  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  
  const typeBuffer = Buffer.from(type, "ascii");
  const crcData = Buffer.concat([typeBuffer, data]);
  const crc = crc32(crcData);
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc >>> 0, 0);
  
  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return ~crc;
}

// Create ICO file from PNG data
function createICO(pngData256) {
  // ICO header: 6 bytes
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: 1 = ICO
  header.writeUInt16LE(1, 4); // count: 1 image
  
  // Directory entry: 16 bytes
  const entry = Buffer.alloc(16);
  entry[0] = 0; // width (0 = 256)
  entry[1] = 0; // height (0 = 256)
  entry[2] = 0; // color palette
  entry[3] = 0; // reserved
  entry.writeUInt16LE(1, 4); // color planes
  entry.writeUInt16LE(32, 6); // bits per pixel
  entry.writeUInt32LE(pngData256.length, 8); // size of image data
  entry.writeUInt32LE(22, 12); // offset (6 + 16 = 22)
  
  return Buffer.concat([header, entry, pngData256]);
}

// Generate files
const outDir = path.join(__dirname, "..", "public", "icons");
fs.mkdirSync(outDir, { recursive: true });

const png256 = createPNG(256);
const png192 = createPNG(192);
const png512 = createPNG(512);

fs.writeFileSync(path.join(outDir, "icon-192.png"), png192);
fs.writeFileSync(path.join(outDir, "icon-512.png"), png512);
fs.writeFileSync(path.join(outDir, "icon-256.png"), png256);

const ico = createICO(png256);
fs.writeFileSync(path.join(outDir, "icon.ico"), ico);

console.log("Icons generated: icon-192.png, icon-256.png, icon-512.png, icon.ico");
