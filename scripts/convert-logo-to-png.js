#!/usr/bin/env node

/**
 * Convert Hyred SVG logo to PNG
 * Generates multiple sizes: 48px, 128px, 512px, 1024px
 */

const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');

const svgPath = './public/hyred-logo.svg';
const sizes = [
  { name: 'hyred-logo-48.png', size: 48 },
  { name: 'hyred-logo-128.png', size: 128 },
  { name: 'hyred-logo-512.png', size: 512 },
  { name: 'hyred-logo-1024.png', size: 1024 },
];

async function convertSvgToPng() {
  try {
    // Read SVG
    const svgBuffer = fs.readFileSync(svgPath);
    const svgDataUrl = `data:image/svg+xml;base64,${svgBuffer.toString('base64')}`;

    // Generate each size
    for (const { name, size } of sizes) {
      const canvas = createCanvas(size, size);
      const ctx = canvas.getContext('2d');

      // Load and draw the SVG
      const img = await loadImage(svgDataUrl);
      ctx.drawImage(img, 0, 0, size, size);

      // Save as PNG
      const out = fs.createWriteStream(`./public/${name}`);
      const stream = canvas.createPNGStream();
      stream.pipe(out);

      await new Promise((resolve, reject) => {
        out.on('finish', () => {
          console.log(`✅ Created: public/${name} (${size}x${size})`);
          resolve();
        });
        out.on('error', reject);
      });
    }

    console.log('\n🎉 All PNG logos generated successfully!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

convertSvgToPng();
