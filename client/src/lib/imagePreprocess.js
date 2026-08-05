// Improves OCR accuracy on phone-camera receipt photos before handing them
// to Tesseract: upscales small/distant shots, downsizes huge ones for
// speed, converts to grayscale, and stretches contrast so faint thermal-
// printer text reads more cleanly. Falls back to the original file on any
// failure — this is a best-effort accuracy boost, not a hard requirement.
export async function preprocessReceiptImage(file) {
  const bitmap = await loadImage(file);

  const MIN_LONG_EDGE = 1400;
  const MAX_LONG_EDGE = 2200;
  const longEdge = Math.max(bitmap.width, bitmap.height);

  let scale = 1;
  if (longEdge < MIN_LONG_EDGE) scale = MIN_LONG_EDGE / longEdge;
  else if (longEdge > MAX_LONG_EDGE) scale = MAX_LONG_EDGE / longEdge;

  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0, width, height);

  const imageData = ctx.getImageData(0, 0, width, height);
  const { data } = imageData;

  const gray = new Uint8ClampedArray(width * height);
  let min = 255;
  let max = 0;
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const g = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    gray[p] = g;
    if (g < min) min = g;
    if (g > max) max = g;
  }

  const range = Math.max(max - min, 1);
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const stretched = ((gray[p] - min) / range) * 255;
    data[i] = data[i + 1] = data[i + 2] = stretched;
  }

  ctx.putImageData(imageData, 0, 0);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('toBlob failed'))), 'image/jpeg', 0.92);
  });
}

function loadImage(file) {
  if ('createImageBitmap' in window) {
    return createImageBitmap(file);
  }
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}
