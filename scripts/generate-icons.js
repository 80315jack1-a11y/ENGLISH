// This script generates PNG icons from SVG using Node.js canvas
// Run: node scripts/generate-icons.js
// Requires: npm install canvas (only for icon generation)

const fs = require("fs");
const path = require("path");

// Simple PNG generation - creates a basic colored icon with text
// For production, replace with proper SVG-to-PNG conversion

function createMinimalPNG(size) {
  // Create a minimal valid PNG file with solid color
  // This is a simplified approach - for best quality, use an image editor
  // or install 'canvas' / 'sharp' packages

  const { createCanvas } = require("canvas");
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");

  // Background
  const radius = size * 0.15;
  ctx.fillStyle = "#4361ee";
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, radius);
  ctx.fill();

  // Text "ABC"
  ctx.fillStyle = "white";
  ctx.font = `bold ${size * 0.22}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("ABC", size / 2, size * 0.35);

  // Text "單字卡"
  ctx.font = `${size * 0.15}px Arial`;
  ctx.globalAlpha = 0.9;
  ctx.fillText("單字卡", size / 2, size * 0.65);

  return canvas.toBuffer("image/png");
}

try {
  const icon192 = createMinimalPNG(192);
  const icon512 = createMinimalPNG(512);

  const outDir = path.join(__dirname, "..", "public", "icons");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "icon-192.png"), icon192);
  fs.writeFileSync(path.join(outDir, "icon-512.png"), icon512);
  console.log("Icons generated successfully!");
} catch (e) {
  if (e.code === "MODULE_NOT_FOUND") {
    console.log("'canvas' package not found. Generating placeholder PNGs...");
    console.log("For proper icons, install canvas: npm install canvas");
    console.log("Or manually create 192x192 and 512x512 PNG icons.");
    
    // Create minimal 1x1 PNG as placeholder
    // Real icons should be designed in an image editor
    const minimalPNG = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPj/HwADBwIAMCbHYQAAAABJRU5ErkJggg==",
      "base64"
    );
    const outDir = path.join(__dirname, "..", "public", "icons");
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, "icon-192.png"), minimalPNG);
    fs.writeFileSync(path.join(outDir, "icon-512.png"), minimalPNG);
    console.log("Placeholder PNGs created. Replace with proper icons for best results.");
  } else {
    throw e;
  }
}
