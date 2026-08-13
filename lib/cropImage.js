// Not true background removal (that needs a segmentation model) — but for
// a book cover, the frame it needs to sit in is already a rectangle, so a
// tight, deskewed-free crop to the cover's bounding box achieves the same
// visual result: no desk/hand/background clutter, cover fills the frame.

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

// box: { xMin, yMin, xMax, yMax } normalized 0..1, as returned by
// /api/books/cover. Returns a Blob (image/jpeg).
export async function cropImageToBox(file, box) {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadImage(objectUrl);
    const sx = Math.round(box.xMin * img.naturalWidth);
    const sy = Math.round(box.yMin * img.naturalHeight);
    const sw = Math.round((box.xMax - box.xMin) * img.naturalWidth);
    const sh = Math.round((box.yMax - box.yMin) * img.naturalHeight);

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, sw);
    canvas.height = Math.max(1, sh);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

    return await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
