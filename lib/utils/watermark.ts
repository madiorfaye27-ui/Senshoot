import sharp from 'sharp';

const WATERMARK_TEXT = 'SENSHOOT SÉNÉGAL';

/**
 * Génère un motif SVG de filigrane répété en diagonale sur toute l'image.
 * Le filigrane est semi-transparent et non retirable sans dégrader
 * fortement l'image (cf. cahier des charges section 6 : le simple
 * blocage du clic droit n'est pas une protection suffisante).
 */
function buildWatermarkSvg(width: number, height: number): Buffer {
  const fontSize = Math.max(16, Math.round(width / 20));
  const tileW = fontSize * 10;
  const tileH = fontSize * 7;
  const cols = Math.ceil(width / tileW) + 2;
  const rows = Math.ceil(height / tileH) + 2;

  let texts = '';
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * tileW - tileW / 2;
      const y = r * tileH;
      texts += `<text x="${x}" y="${y}" transform="rotate(-30 ${x} ${y})" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold" fill="#ffffff" fill-opacity="0.32">${WATERMARK_TEXT}</text>`;
    }
  }

  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">${texts}</svg>`;
  return Buffer.from(svg);
}

async function watermarkedResize(
  original: ReturnType<typeof sharp>,
  width: number,
  quality: number
): Promise<Buffer> {
  const base = await original.clone().resize({ width, withoutEnlargement: true }).toBuffer();
  const meta = await sharp(base).metadata();

  return sharp(base)
    .composite([{ input: buildWatermarkSvg(meta.width!, meta.height!), top: 0, left: 0 }])
    .jpeg({ quality })
    .toBuffer();
}

export type ProcessedPhoto = {
  web: Buffer;       // version filigranée, résolution moyenne (affichage galerie / zoom)
  thumbnail: Buffer; // version filigranée, petite résolution (grille de la galerie)
  width: number | undefined;
  height: number | undefined;
};

/**
 * Traite une photo originale : jamais exposée publiquement telle quelle.
 * Retourne uniquement des versions filigranées, destinées au bucket public.
 * L'original doit rester dans un bucket privé, accessible uniquement via
 * une URL signée temporaire après paiement confirmé.
 */
export async function processPhoto(originalBuffer: Buffer): Promise<ProcessedPhoto> {
  const image = sharp(originalBuffer).rotate(); // corrige l'orientation EXIF
  const metadata = await image.metadata();

  const [web, thumbnail] = await Promise.all([
    watermarkedResize(image, 1400, 82),
    watermarkedResize(image, 500, 75),
  ]);

  return { web, thumbnail, width: metadata.width, height: metadata.height };
}
