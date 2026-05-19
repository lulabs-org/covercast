import sharp from 'sharp';
import path from 'path';

async function generateFavicon() {
  const svgPath = path.join(process.cwd(), 'public', 'favicon.svg');
  const icoPath = path.join(process.cwd(), 'app', 'favicon.ico');
  
  await sharp(svgPath)
    .resize(256, 256)
    .png()
    .toFile(icoPath);
  
  console.log('Favicon generated successfully!');
}

generateFavicon().catch(console.error);
