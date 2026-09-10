import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";

const root = new URL("../", import.meta.url);
const brand = new URL("public/brand/", root);
const kit = new URL("output/branding/plutos-brand-kit/", root);
const iconSizes = [16, 20, 24, 28, 32, 36, 40, 48, 64, 72, 96, 120, 128, 144, 152, 167, 180, 192, 196, 256, 384, 512, 768, 1024, 2048];
const logoWidths = [128, 160, 192, 256, 320, 480, 640, 960, 1280, 1920, 2560, 3840, 4096];
const variants = ["plutos-logo", "plutos-logo-light", "plutos-logo-monochrome"];
for (const p of [new URL("icons/", brand), new URL("logos/", kit), new URL("icons/", kit), new URL("vector/", kit)]) await mkdir(p, { recursive: true });
const inventory = [];
async function render(svg, width, height, destination) {
  const intrinsicWidth = (await sharp(svg).metadata()).width;
  const density = Math.max(144, Math.ceil(width / intrinsicWidth * 72));
  const png = await sharp(svg, { density }).resize(width, height).png().toBuffer();
  await writeFile(destination, png);
  inventory.push({ file: destination.pathname.split("/").at(-1), width, height });
  return png;
}
const mark = await readFile(new URL("plutos-mark.svg", brand));
for (const size of iconSizes) {
  const name = `plutos-${size}.png`;
  await render(mark, size, size, new URL(`icons/${name}`, brand));
  await copyFile(new URL(`icons/${name}`, brand), new URL(`icons/${name}`, kit));
}
await copyFile(new URL("icons/plutos-512.png", brand), new URL("plutos-mark.png", brand));
for (const name of variants) {
  const svg = await readFile(new URL(`${name}.svg`, brand));
  await render(svg, 1280, 320, new URL(`${name}.png`, brand));
  for (const width of logoWidths) await render(svg, width, width / 4, new URL(`logos/${name}-${width}x${width / 4}.png`, kit));
  await copyFile(new URL(`${name}.svg`, brand), new URL(`vector/${name}.svg`, kit));
}
await copyFile(new URL("plutos-mark.svg", brand), new URL("vector/plutos-mark.svg", kit));

// iOS opaque icon; Android maskable content fits entirely in the central safe circle.
for (const [name, size, inset] of [["plutos-apple-180.png", 180, 20], ["plutos-maskable-512.png", 512, 112]]) {
  const content = await sharp(mark, { density: 144 }).resize(size - inset * 2, size - inset * 2).png().toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: "#008767" } }).composite([{ input: content, left: inset, top: inset }]).flatten({ background: "#008767" }).png().toFile(new URL(`icons/${name}`, brand).pathname);
  await copyFile(new URL(`icons/${name}`, brand), new URL(`icons/${name}`, kit));
}

// ICO container with lossless PNG entries supported by modern browsers and Windows.
const icoSizes = [16, 24, 32, 48, 64, 128, 256];
const icoPngs = await Promise.all(icoSizes.map(s => readFile(new URL(`icons/plutos-${s}.png`, brand))));
const header = Buffer.alloc(6 + icoSizes.length * 16);
header.writeUInt16LE(1, 2); header.writeUInt16LE(icoSizes.length, 4);
let offset = header.length;
icoPngs.forEach((png, i) => {
  const pos = 6 + i * 16, size = icoSizes[i];
  header[pos] = size === 256 ? 0 : size; header[pos + 1] = header[pos];
  header.writeUInt16LE(1, pos + 4); header.writeUInt16LE(32, pos + 6);
  header.writeUInt32LE(png.length, pos + 8); header.writeUInt32LE(offset, pos + 12);
  offset += png.length;
});
const ico = Buffer.concat([header, ...icoPngs]);
await writeFile(new URL("app/favicon.ico", root), ico);
await writeFile(new URL("icons/favicon.ico", kit), ico);
await writeFile(new URL("inventory.json", kit), JSON.stringify({ iconSizes, logoWidths, palette: { emerald: "#008767", apricot: "#FFBA73", wordmark: "#123A32" }, files: inventory }, null, 2) + "\n");
console.log(`Exported ${iconSizes.length} square sizes, ${logoWidths.length} sizes × 3 wordmark variants, SVG masters, Apple/Android icons and favicon.ico.`);
