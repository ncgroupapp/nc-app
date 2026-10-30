/** Longest side of the logo that is uploaded: plenty for print, small for the database. */
const MAX_SIDE = 800;
/** Pixels lighter than this on every channel count as empty background (white or near white). */
const WHITE = 245;
/** Pixels more transparent than this count as empty background. */
const MIN_ALPHA = 16;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('No se pudo leer la imagen. Probá con un PNG o JPG.'));
    };
    image.src = url;
  });
}

/** Box of the pixels that are not empty background, or null if the whole image is background. */
function contentBox(data: Uint8ClampedArray, width: number, height: number) {
  let top = height, left = width, bottom = -1, right = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const empty = data[i + 3] < MIN_ALPHA || (data[i] > WHITE && data[i + 1] > WHITE && data[i + 2] > WHITE);
      if (empty) continue;
      if (y < top) top = y;
      if (y > bottom) bottom = y;
      if (x < left) left = x;
      if (x > right) right = x;
    }
  }
  return bottom < 0 ? null : { x: left, y: top, width: right - left + 1, height: bottom - top + 1 };
}

/**
 * Gets a client logo ready to upload: trims the empty margins (white or transparent) so every logo
 * has the same visual size on the quotation, and scales it down if it is very large. Returns a PNG.
 */
export async function prepareLogo(file: File): Promise<Blob> {
  if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) {
    throw new Error('El logo tiene que ser una imagen PNG o JPG.');
  }
  const image = await loadImage(file);
  const source = document.createElement('canvas');
  source.width = image.naturalWidth;
  source.height = image.naturalHeight;
  const sourceContext = source.getContext('2d', { willReadFrequently: true });
  if (!sourceContext) throw new Error('El navegador no pudo procesar la imagen.');
  sourceContext.drawImage(image, 0, 0);

  const box = contentBox(sourceContext.getImageData(0, 0, source.width, source.height).data, source.width, source.height)
    ?? { x: 0, y: 0, width: source.width, height: source.height };
  const scale = Math.min(1, MAX_SIDE / Math.max(box.width, box.height));

  const output = document.createElement('canvas');
  output.width = Math.max(1, Math.round(box.width * scale));
  output.height = Math.max(1, Math.round(box.height * scale));
  const context = output.getContext('2d');
  if (!context) throw new Error('El navegador no pudo procesar la imagen.');
  context.imageSmoothingQuality = 'high';
  context.drawImage(source, box.x, box.y, box.width, box.height, 0, 0, output.width, output.height);

  return new Promise((resolve, reject) =>
    output.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('No se pudo preparar el logo.'))), 'image/png'),
  );
}
