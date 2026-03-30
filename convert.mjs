import sharp from 'sharp';

async function generate() {
  try {
    await sharp('public/logo.svg').resize(512, 512).png().toFile('public/logo.png');
    await sharp('public/og-image.svg').resize(1200, 630).png().toFile('public/og-image.png');
    console.log('Successfully generated PNGs');
  } catch (e) {
    console.error('Error generating PNGs:', e);
  }
}

generate();
