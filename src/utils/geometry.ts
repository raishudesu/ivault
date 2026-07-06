export interface Point {
  x: number;
  y: number;
}

export function distance(a: Point, b: Point): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

export function sortCornersClockwise(points: Point[]): Point[] {
  const n = points.length;
  if (n === 0) return [];
  const center = points.reduce((acc, p) => ({ x: acc.x + p.x / n, y: acc.y + p.y / n }), { x: 0, y: 0 });
  return [...points].sort((a, b) => {
    const angleA = Math.atan2(a.y - center.y, a.x - center.x);
    const angleB = Math.atan2(b.y - center.y, b.x - center.x);
    return angleA - angleB;
  });
}

type Mat3 = [number, number, number, number, number, number, number, number, number];

const IDENTITY: Mat3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];

/**
 * Heckbert unit-square → quad homography, as a row-major 3x3 matrix in
 * Skia layout: [scaleX, skewX, transX, skewY, scaleY, transY, p0, p1, p2].
 * Maps (0,0)→q[0], (1,0)→q[1], (1,1)→q[2], (0,1)→q[3].
 */
function squareToQuad(q: [Point, Point, Point, Point]): Mat3 | null {
  const x0 = q[0].x, x1 = q[1].x, x2 = q[2].x, x3 = q[3].x;
  const y0 = q[0].y, y1 = q[1].y, y2 = q[2].y, y3 = q[3].y;

  const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3;
  const dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;

  const det = dx1 * dy2 - dy1 * dx2;
  if (Math.abs(det) < 1e-10) return null;

  const g = (dx3 * dy2 - dy3 * dx2) / det;
  const h = (dx1 * dy3 - dy1 * dx3) / det;

  return [
    x1 - x0 + g * x1, x3 - x0 + h * x3, x0,
    y1 - y0 + g * y1, y3 - y0 + h * y3, y0,
    g, h, 1,
  ];
}

/** Adjugate = inverse up to a scale factor, which is all a homography needs. */
function adjugate(m: Mat3): Mat3 {
  const [a, b, c, d, e, f, g, h, i] = m;
  return [
    e * i - f * h, c * h - b * i, b * f - c * e,
    f * g - d * i, a * i - c * g, c * d - a * f,
    d * h - e * g, b * g - a * h, a * e - b * d,
  ];
}

function multiplyMat3(a: Mat3, b: Mat3): Mat3 {
  const out = new Array(9).fill(0) as Mat3;
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      out[row * 3 + col] =
        a[row * 3] * b[col] + a[row * 3 + 1] * b[3 + col] + a[row * 3 + 2] * b[6 + col];
    }
  }
  return out;
}

/**
 * Homography mapping the source quad (TL, TR, BR, BL, in image pixel coords)
 * onto the rect (0,0)-(dstWidth,dstHeight). Row-major 3x3 for Skia.
 */
export function computePerspectiveTransform(
  src: [Point, Point, Point, Point],
  dstWidth: number,
  dstHeight: number
): number[] {
  const srcM = squareToQuad(src);
  if (!srcM) return [...IDENTITY];

  const dstM: Mat3 = [dstWidth, 0, 0, 0, dstHeight, 0, 0, 0, 1];
  const m = multiplyMat3(dstM, adjugate(srcM));
  if (Math.abs(m[8]) < 1e-12) return [...IDENTITY];

  return m.map((v) => v / m[8]);
}

export function defaultCorners(width: number, height: number): [Point, Point, Point, Point] {
  const margin = Math.min(width, height) * 0.05;
  return [
    { x: margin, y: margin },
    { x: width - margin, y: margin },
    { x: width - margin, y: height - margin },
    { x: margin, y: height - margin },
  ];
}
