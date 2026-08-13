// Replaces the old axis-aligned box crop. Instead of a rectangle, vision
// now gives us the book cover's four corners — which may not form a
// perfect rectangle in the photo if the book was held at an angle or the
// camera wasn't square-on. This warps that quadrilateral into a straight
// rectangle using a standard two-triangle affine-warp technique (canvas
// has no native perspective transform, but two affine triangles closely
// approximate one for a roughly planar object like a book cover).
//
// This fixes two complaints at once: no more background margin baked into
// the crop (the quad IS the cover's exact edges), and tilted photos come
// out deskewed instead of staying crooked.

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function dist(p, q) {
  return Math.hypot(p.x - q.x, p.y - q.y);
}

// Closed-form affine transform (a,b,c,d,e,f) mapping 3 src points to 3 dst
// points: dst = [[a,c,e],[b,d,f]] * [src.x, src.y, 1]
function computeAffine(src, dst) {
  const [p0, p1, p2] = src;
  const [q0, q1, q2] = dst;
  const denom = p0.x * (p1.y - p2.y) + p1.x * (p2.y - p0.y) + p2.x * (p0.y - p1.y);
  if (!denom) return { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };

  const a = (q0.x * (p1.y - p2.y) + q1.x * (p2.y - p0.y) + q2.x * (p0.y - p1.y)) / denom;
  const c = (q0.x * (p2.x - p1.x) + q1.x * (p0.x - p2.x) + q2.x * (p1.x - p0.x)) / denom;
  const e = (q0.x * (p1.x * p2.y - p2.x * p1.y) + q1.x * (p2.x * p0.y - p0.x * p2.y) + q2.x * (p0.x * p1.y - p1.x * p0.y)) / denom;

  const b = (q0.y * (p1.y - p2.y) + q1.y * (p2.y - p0.y) + q2.y * (p0.y - p1.y)) / denom;
  const d = (q0.y * (p2.x - p1.x) + q1.y * (p0.x - p2.x) + q2.y * (p1.x - p0.x)) / denom;
  const f = (q0.y * (p1.x * p2.y - p2.x * p1.y) + q1.y * (p2.x * p0.y - p0.x * p2.y) + q2.y * (p0.x * p1.y - p1.x * p0.y)) / denom;

  return { a, b, c, d, e, f };
}

function drawTriangle(ctx, img, srcPts, dstPts) {
  const { a, b, c, d, e, f } = computeAffine(srcPts, dstPts);
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(dstPts[0].x, dstPts[0].y);
  ctx.lineTo(dstPts[1].x, dstPts[1].y);
  ctx.lineTo(dstPts[2].x, dstPts[2].y);
  ctx.closePath();
  ctx.clip();
  ctx.transform(a, b, c, d, e, f);
  ctx.drawImage(img, 0, 0);
  ctx.restore();
}

// corners: { tl, tr, br, bl }, each { x, y } normalized 0..1 relative to
// the full photo. Returns a Blob of the deskewed, tightly-cropped cover.
export async function warpQuadToRect(file, corners) {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadImage(objectUrl);
    const W = img.naturalWidth;
    const H = img.naturalHeight;
    const toPx = (pt) => ({ x: pt.x * W, y: pt.y * H });
    const tl = toPx(corners.tl);
    const tr = toPx(corners.tr);
    const br = toPx(corners.br);
    const bl = toPx(corners.bl);

    // Output size follows the quad's own pixel dimensions (averaged across
    // both edges) so the book's real proportions are preserved instead of
    // being stretched to some fixed ratio.
    const outW = Math.max(1, Math.round((dist(tl, tr) + dist(bl, br)) / 2));
    const outH = Math.max(1, Math.round((dist(tl, bl) + dist(tr, br)) / 2));

    const canvas = document.createElement("canvas");
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext("2d");

    const dTL = { x: 0, y: 0 };
    const dTR = { x: outW, y: 0 };
    const dBR = { x: outW, y: outH };
    const dBL = { x: 0, y: outH };

    drawTriangle(ctx, img, [tl, tr, bl], [dTL, dTR, dBL]);
    drawTriangle(ctx, img, [tr, br, bl], [dTR, dBR, dBL]);

    return await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
