// Pure JavaScript PNG generator without external dependencies
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function createPng(width, height, drawFn) {
  // RGBA buffer
  const rgba = Buffer.alloc(width * height * 4);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const color = drawFn(x, y, width, height);
      rgba[idx] = color.r;
      rgba[idx + 1] = color.g;
      rgba[idx + 2] = color.b;
      rgba[idx + 3] = color.a;
    }
  }

  // PNG structure
  // Scanlines with filter byte 0 (None)
  const rowBytes = width * 4;
  const scanlines = Buffer.alloc((rowBytes + 1) * height);
  for (let y = 0; y < height; y++) {
    scanlines[y * (rowBytes + 1)] = 0; // Filter: None
    rgba.copy(scanlines, y * (rowBytes + 1) + 1, y * rowBytes, (y + 1) * rowBytes);
  }

  const idatData = zlib.deflateSync(scanlines);

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR Chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth
  ihdr[9] = 6; // Color type: RGBA
  ihdr[10] = 0; // Compression
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // Interlace

  const ihdrChunk = createChunk('IHDR', ihdr);
  const idatChunk = createChunk('IDAT', idatData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const length = data.length;
  const chunk = Buffer.alloc(4 + 4 + length + 4);
  chunk.writeUInt32BE(length, 0);
  chunk.write(type, 4);
  data.copy(chunk, 8);

  const crcData = Buffer.concat([Buffer.from(type), data]);
  const crc = crc32(crcData);
  chunk.writeUInt32BE(crc, 8 + length);
  return chunk;
}

// CRC32 table
const crcTable = new Int32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) {
      c = 0xedb88320 ^ (c >>> 1);
    } else {
      c = c >>> 1;
    }
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

// Drawing BingeBlocker icon (Sleek dark blue shield with emerald focus target & play block symbol)
function drawIcon(x, y, w, h) {
  const cx = w / 2;
  const cy = h / 2;
  const dx = (x - cx) / (w / 2);
  const dy = (y - cy) / (h / 2);
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Background rounded squircle / shield base
  const cornerRadius = 0.85;
  const inSquircle = Math.abs(dx) <= cornerRadius && Math.abs(dy) <= cornerRadius;
  const inCircle = dist <= 0.95;

  if (!inCircle && !inSquircle) {
    return { r: 0, g: 0, b: 0, a: 0 };
  }

  // Base gradient: Deep indigo / slate (#0f172a to #1e293b)
  let r = Math.round(15 + (dy + 1) * 10);
  let g = Math.round(23 + (dy + 1) * 15);
  let b = Math.round(42 + (dy + 1) * 20);
  let a = 255;

  // Outer border / glow ring
  if (dist >= 0.82 && dist <= 0.94) {
    // Emerald green / cyan focus ring (#10b981 to #06b6d4)
    r = 16;
    g = 185;
    b = 129;
  }

  // Center symbol: Target Focus + Play block
  // Draw inner focus crosshairs or play polygon
  // Play triangle bounds: from x=-0.3 to 0.3, y=-0.35 to 0.35
  const px = dx;
  const py = dy;

  // Target reticle rings
  const innerDist = Math.sqrt(px * px + py * py);
  if (innerDist > 0.45 && innerDist < 0.6) {
    r = 52;
    g = 211;
    b = 153; // #34d399 bright emerald
  }

  // Inner Play triangle with clean blocker dot
  const insideTriangle = px >= -0.25 && px <= 0.35 && Math.abs(py) <= (0.35 - px * 0.4);
  if (insideTriangle) {
    // Crisp white / electric cyan (#ffffff to #38bdf8)
    r = 255;
    g = 255;
    b = 255;
  }

  // Center focus dot
  if (innerDist <= 0.12) {
    r = 239;
    g = 68;
    b = 68; // Vibrant red block accent (#ef4444)
  }

  return { r, g, b, a };
}

// Generate icons in assets/icons
const outDir = path.join(__dirname, 'assets', 'icons');
fs.mkdirSync(outDir, { recursive: true });

[16, 48, 128].forEach(size => {
  const png = createPng(size, size, drawIcon);
  fs.writeFileSync(path.join(outDir, `icon-${size}.png`), png);
  console.log(`Generated icon-${size}.png (${size}x${size})`);
});
