/**
 * Generate PWA Icons from SVG Template
 * 
 * Requires: sharp package
 * Run: node scripts/generate-icons.js
 */

/* eslint-disable @typescript-eslint/no-require-imports */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [192, 256, 384, 512];
const inputSvg = path.join(__dirname, '../public/icons/icon-template.svg');
const outputDir = path.join(__dirname, '../public/icons');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function generateIcons() {
  console.log('🔥 Generating PWA icons...');
  
  try {
    const svgBuffer = fs.readFileSync(inputSvg);
    
    for (const size of sizes) {
      const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);
      
      await sharp(svgBuffer)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 30, g: 30, b: 30, alpha: 1 }, // #1E1E1E
        })
        .png()
        .toFile(outputPath);
      
      console.log(`✅ Generated: icon-${size}x${size}.png`);
    }
    
    console.log('🎉 All icons generated successfully!');
  } catch (error) {
    console.error('❌ Error generating icons:', error);
    console.log('\n💡 Alternative: Use an online SVG to PNG converter:');
    console.log('   1. Open public/icons/icon-template.svg');
    console.log('   2. Convert to PNG at sizes: 192, 256, 384, 512');
    console.log('   3. Save as icon-{size}x{size}.png in public/icons/');
    process.exit(1);
  }
}

// Check if sharp is installed
try {
  require.resolve('sharp');
  generateIcons();
} catch {
  console.log('⚠️  sharp package not found. Installing...');
  console.log('   Run: npm install sharp --save-dev');
  console.log('\n💡 Manual icon generation:');
  console.log('   1. Open public/icons/icon-template.svg in a browser or image editor');
  console.log('   2. Export as PNG at the following sizes:');
  sizes.forEach(size => {
    console.log(`      - ${size}x${size} → icon-${size}x${size}.png`);
  });
  console.log('   3. Save all files in public/icons/');
}

