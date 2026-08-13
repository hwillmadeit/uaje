// Phone camera photos are routinely 3–10MB, which can exceed the vision
// API's per-image size limit and returns a 400. Downscaling client-side
// before the upload avoids that entirely, and also keeps token cost down —
// Claude's vision pipeline gets no real benefit from images larger than
// ~1568px on the long edge anyway.

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

export async function resizeImageForVision(file, { maxDimension = 1568, quality = 0.85 } = {}) {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadImage(objectUrl);
    const scale = Math.min(1, maxDimension / Math.max(img.naturalWidth, img.naturalHeight));
    const width = Math.round(img.naturalWidth * scale);
    const height = Math.round(img.naturalHeight * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, width, height);

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    // Extremely rare fallback — if canvas export fails for some reason,
    // don't block the flow, just use the original file.
    return blob || file;
  } catch (e) {
    return file;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
