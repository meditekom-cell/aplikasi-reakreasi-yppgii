import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function generate() {
  const svgBuffer = fs.readFileSync('public/favicon.svg');

  // 1. pwa-192x192.png
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile('public/pwa-192x192.png');
  console.log('Generated pwa-192x192.png');

  // 2. pwa-512x512.png
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile('public/pwa-512x512.png');
  console.log('Generated pwa-512x512.png');

  // 3. apple-touch-icon.png (180x180)
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile('public/apple-touch-icon.png');
  console.log('Generated apple-touch-icon.png');

  // 4. pwa-maskable-512x512.png (512x512 with ~15% safe padding)
  // Maskable icon requires safe area inside 80% circle
  const innerIcon = await sharp(svgBuffer)
    .resize(410, 410)
    .toBuffer();

  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 2, g: 132, b: 199, alpha: 1 } // #0284c7 brand blue
    }
  })
    .composite([
      {
        input: innerIcon,
        top: 51,
        left: 51
      }
    ])
    .png()
    .toFile('public/pwa-maskable-512x512.png');
  console.log('Generated pwa-maskable-512x512.png');
}

generate().catch(err => {
  console.error(err);
  process.exit(1);
});
