// The top of each project's capture (public/projects/<id>.webp, a tall screenshot of the site) as a small picture
// for the proof cards on /services: public/projects/thumbs/<id>.webp, 640 × 400. Run it again when a capture
// changes: `npm run thumbs`.
import { readdir, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const dir = new URL('../public/projects/', import.meta.url);
const out = new URL('thumbs/', dir);
await mkdir(out, { recursive: true });
for (const f of (await readdir(dir)).filter((f) => f.endsWith('.webp'))) {
  const img = sharp(fileURLToPath(new URL(f, dir)));
  const { width } = await img.metadata();
  // the first screen of the page, as wide as the capture and 10:16 of it tall
  await img.extract({ left: 0, top: 0, width, height: Math.round((width * 10) / 16) })
    .resize(640, 400).webp({ quality: 72 }).toFile(fileURLToPath(new URL(f, out)));
  console.log(`thumbs/${f}`);
}
