import sharp from 'sharp';
import path from 'path';

const LOGO_PATH = path.join(process.cwd(), 'public', 'logo.png');
const LOGO_ASPECT = 526 / 364; // dimensions natives de public/logo.png

// Le PNG source a un fond blanc opaque (pas de canal alpha) : on le
// prétraite une seule fois (mis en cache) pour rendre ce fond transparent
// et ne garder que le dessin du logo, sinon le filigrane tuilé afficherait
// des rectangles blancs pleins sur la photo.
let logoDataUriPromise: Promise<string> | null = null;

async function getLogoDataUri(): Promise<string> {
  if (!logoDataUriPromise) {
    logoDataUriPromise = (async () => {
      const { data, info } = await sharp(LOGO_PATH)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

      for (let i = 0; i < data.length; i += 4) {
        if (data[i] > 235 && data[i + 1] > 235 && data[i + 2] > 235) {
          data[i + 3] = 0; // pixel quasi blanc -> transparent
        }
      }

      const png = await sharp(data, {
        raw: { width: info.width, height: info.height, channels: 4 },
      })
        .png()
        .toBuffer();

      return `data:image/png;base64,${png.toString('base64')}`;
    })();
  }
  return logoDataUriPromise;
}

/**
 * Génère un motif SVG du logo Senshoot Sénégal répété en diagonale sur
 * toute l'image. Le filigrane est semi-transparent et non retirable sans
 * dégrader fortement l'image (cf. cahier des charges section 6 : le
 * simple blocage du clic droit n'est pas une protection suffisante).
 * Le logo n'est encodé qu'une fois (<defs>) et référencé via <use> pour
 * chaque tuile, afin de ne pas alourdir le SVG à chaque répétition.
 */
function buildWatermarkSvg(width: number, height: number, logoDataUri: string): Buffer {
  const logoW = Math.max(50, Math.round(width / 9));
  const logoH = Math.round(logoW / LOGO_ASPECT);
  const tileW = logoW * 2.6;
  const tileH = logoH * 3.4;
  const cols = Math.ceil(width / tileW) + 2;
  const rows = Math.ceil(height / tileH) + 2;

  let tiles = '';
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * tileW - tileW / 2;
      const y = r * tileH;
      tiles += `<use href="#wm-logo" x="${x}" y="${y}" transform="rotate(-30 ${x} ${y})" opacity="0.4"/>`;
    }
  }

  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><defs><image id="wm-logo" xlink:href="${logoDataUri}" width="${logoW}" height="${logoH}"/></defs>${tiles}</svg>`;
  return Buffer.from(svg);
}

async function watermarkedResize(
  original: ReturnType<typeof sharp>,
  width: number,
  quality: number
): Promise<Buffer> {
  const base = await original.clone().resize({ width, withoutEnlargement: true }).toBuffer();
  const meta = await sharp(base).metadata();
  const logoDataUri = await getLogoDataUri();

  return sharp(base)
    .composite([{ input: buildWatermarkSvg(meta.width!, meta.height!, logoDataUri), top: 0, left: 0 }])
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
