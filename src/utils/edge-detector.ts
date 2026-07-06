import { Point } from './geometry';

const DEG = Math.PI / 180;

// Hough search space: lines within ±28° of vertical/horizontal,
// which covers a card that is roughly aligned with the capture guide.
const THETA_RANGE_DEG = 28;
const THETA_STEP_DEG = 2;
const RHO_STEP = 2;

// Fraction of strongest-gradient pixels kept as edge pixels.
const EDGE_PIXEL_FRACTION = 0.1;

interface Line {
  cos: number;
  sin: number;
  rho: number;
  votes: number;
}

function grayscale(pixels: Uint8Array, width: number, height: number): Float32Array {
  const gray = new Float32Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const offset = i * 4;
    gray[i] = 0.299 * pixels[offset] + 0.587 * pixels[offset + 1] + 0.114 * pixels[offset + 2];
  }
  return gray;
}

function blur(gray: Float32Array, width: number, height: number): Float32Array {
  const result = new Float32Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0, count = 0;
      for (let ky = -1; ky <= 1; ky++) {
        const ny = y + ky;
        if (ny < 0 || ny >= height) continue;
        for (let kx = -1; kx <= 1; kx++) {
          const nx = x + kx;
          if (nx < 0 || nx >= width) continue;
          sum += gray[ny * width + nx];
          count++;
        }
      }
      result[y * width + x] = sum / count;
    }
  }
  return result;
}

function sobel(gray: Float32Array, width: number, height: number): {
  gx: Float32Array;
  gy: Float32Array;
  mag: Float32Array;
} {
  const gx = new Float32Array(width * height);
  const gy = new Float32Array(width * height);
  const mag = new Float32Array(width * height);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      const dx =
        -gray[(y - 1) * width + (x - 1)] + gray[(y - 1) * width + (x + 1)]
        - 2 * gray[y * width + (x - 1)] + 2 * gray[y * width + (x + 1)]
        - gray[(y + 1) * width + (x - 1)] + gray[(y + 1) * width + (x + 1)];
      const dy =
        -gray[(y - 1) * width + (x - 1)] - 2 * gray[(y - 1) * width + x] - gray[(y - 1) * width + (x + 1)]
        + gray[(y + 1) * width + (x - 1)] + 2 * gray[(y + 1) * width + x] + gray[(y + 1) * width + (x + 1)];
      gx[i] = dx;
      gy[i] = dy;
      mag[i] = Math.sqrt(dx * dx + dy * dy);
    }
  }
  return { gx, gy, mag };
}

/** Threshold that keeps roughly the top EDGE_PIXEL_FRACTION strongest gradients. */
function pickThreshold(mag: Float32Array): number {
  const hist = new Uint32Array(256);
  for (let i = 0; i < mag.length; i++) {
    const v = mag[i];
    hist[v >= 255 ? 255 : v | 0]++;
  }
  const target = mag.length * EDGE_PIXEL_FRACTION;
  let cum = 0;
  for (let t = 255; t >= 0; t--) {
    cum += hist[t];
    if (cum >= target) return Math.min(120, Math.max(20, t));
  }
  return 20;
}

function bestLine(
  acc: Uint32Array,
  cosT: Float32Array,
  sinT: Float32Array,
  nRho: number,
  diag: number,
  minVotes: number,
  inBand: (cos: number, sin: number, rho: number) => boolean
): Line | null {
  let best: Line | null = null;
  for (let t = 0; t < cosT.length; t++) {
    for (let r = 0; r < nRho; r++) {
      const votes = acc[t * nRho + r];
      if (votes < minVotes || (best && votes <= best.votes)) continue;
      const rho = r * RHO_STEP - diag;
      if (!inBand(cosT[t], sinT[t], rho)) continue;
      best = { cos: cosT[t], sin: sinT[t], rho, votes };
    }
  }
  return best;
}

/** Intersection of two lines given as x·cosθ + y·sinθ = ρ. */
function intersect(l1: Line, l2: Line): Point | null {
  const det = l1.cos * l2.sin - l1.sin * l2.cos;
  if (Math.abs(det) < 1e-6) return null;
  return {
    x: (l1.rho * l2.sin - l2.rho * l1.sin) / det,
    y: (l1.cos * l2.rho - l2.cos * l1.rho) / det,
  };
}

function quadArea(corners: Point[]): number {
  let sum = 0;
  for (let i = 0; i < corners.length; i++) {
    const a = corners[i];
    const b = corners[(i + 1) % corners.length];
    sum += a.x * b.y - b.x * a.y;
  }
  return Math.abs(sum) / 2;
}

/**
 * Detects a card in the image by finding its four straight edges with a
 * gradient-oriented Hough transform, then intersecting them.
 * Returns corners as [top-left, top-right, bottom-right, bottom-left],
 * or null if no plausible card outline is found.
 */
export function detectCardEdges(
  pixels: Uint8Array,
  width: number,
  height: number
): [Point, Point, Point, Point] | null {
  const gray = grayscale(pixels, width, height);
  const blurred = blur(gray, width, height);
  const { gx, gy, mag } = sobel(blurred, width, height);
  const thresh = pickThreshold(mag);

  const nTheta = Math.round((THETA_RANGE_DEG * 2) / THETA_STEP_DEG) + 1;
  const cosV = new Float32Array(nTheta);
  const sinV = new Float32Array(nTheta);
  const cosH = new Float32Array(nTheta);
  const sinH = new Float32Array(nTheta);
  for (let t = 0; t < nTheta; t++) {
    const theta = (-THETA_RANGE_DEG + t * THETA_STEP_DEG) * DEG;
    cosV[t] = Math.cos(theta);
    sinV[t] = Math.sin(theta);
    cosH[t] = Math.cos(theta + Math.PI / 2);
    sinH[t] = Math.sin(theta + Math.PI / 2);
  }

  const diag = Math.hypot(width, height);
  const nRho = Math.ceil((2 * diag) / RHO_STEP) + 1;
  const accV = new Uint32Array(nTheta * nRho);
  const accH = new Uint32Array(nTheta * nRho);

  // Each edge pixel votes only for the line family matching its gradient
  // direction, which keeps text and texture inside the card from swamping
  // the accumulator.
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      if (mag[i] < thresh) continue;
      const ax = Math.abs(gx[i]);
      const ay = Math.abs(gy[i]);
      let acc: Uint32Array, cosT: Float32Array, sinT: Float32Array;
      if (ax >= ay * 1.2) {
        acc = accV; cosT = cosV; sinT = sinV;
      } else if (ay >= ax * 1.2) {
        acc = accH; cosT = cosH; sinT = sinH;
      } else {
        continue;
      }
      for (let t = 0; t < nTheta; t++) {
        const r = Math.round((x * cosT[t] + y * sinT[t] + diag) / RHO_STEP);
        acc[t * nRho + r]++;
      }
    }
  }

  const minVotesV = Math.max(25, height * 0.12);
  const minVotesH = Math.max(25, width * 0.12);
  const midX = width / 2;
  const midY = height / 2;

  // Each card edge is searched for in its own half of the frame, measured
  // where the line crosses the image's center row/column.
  const left = bestLine(accV, cosV, sinV, nRho, diag, minVotesV, (c, s, rho) => {
    const x = (rho - midY * s) / c;
    return x >= width * 0.01 && x <= width * 0.47;
  });
  const right = bestLine(accV, cosV, sinV, nRho, diag, minVotesV, (c, s, rho) => {
    const x = (rho - midY * s) / c;
    return x >= width * 0.53 && x <= width * 0.99;
  });
  const top = bestLine(accH, cosH, sinH, nRho, diag, minVotesH, (c, s, rho) => {
    const y = (rho - midX * c) / s;
    return y >= height * 0.01 && y <= height * 0.47;
  });
  const bottom = bestLine(accH, cosH, sinH, nRho, diag, minVotesH, (c, s, rho) => {
    const y = (rho - midX * c) / s;
    return y >= height * 0.53 && y <= height * 0.99;
  });

  if (!left || !right || !top || !bottom) return null;

  const tl = intersect(top, left);
  const tr = intersect(top, right);
  const br = intersect(bottom, right);
  const bl = intersect(bottom, left);
  if (!tl || !tr || !br || !bl) return null;

  const corners: [Point, Point, Point, Point] = [tl, tr, br, bl];
  for (const p of corners) {
    if (p.x < -width * 0.05 || p.x > width * 1.05) return null;
    if (p.y < -height * 0.05 || p.y > height * 1.05) return null;
    p.x = Math.min(Math.max(p.x, 0), width - 1);
    p.y = Math.min(Math.max(p.y, 0), height - 1);
  }

  if (quadArea(corners) < width * height * 0.15) return null;

  return corners;
}
