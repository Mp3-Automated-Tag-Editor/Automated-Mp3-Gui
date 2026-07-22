import { DEFAULT_COVER } from "@/components/context/PlayerContext/music-utils";

const FALLBACK: [string, string] = ["rgb(30, 30, 36)", "rgb(12, 12, 16)"];

function rgb(r: number, g: number, b: number): string {
  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
}

function luminance(r: number, g: number, b: number): number {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Sample an image (data URL or path) and return two CSS rgb() colors
 * for a Spotify-like album art gradient.
 */
export function extractDominantColors(src: string): Promise<[string, string]> {
  if (!src || src === DEFAULT_COVER) {
    return Promise.resolve(FALLBACK);
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      try {
        const size = 32;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) {
          resolve(FALLBACK);
          return;
        }
        ctx.drawImage(img, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);

        const buckets = new Map<string, { r: number; g: number; b: number; n: number }>();

        for (let i = 0; i < data.length; i += 4) {
          const a = data[i + 3];
          if (a < 128) continue;
          // Quantize to reduce noise
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const lum = luminance(r, g, b);
          // Skip near-white / near-black for richer gradients
          if (lum < 18 || lum > 240) continue;
          const key = `${r >> 4},${g >> 4},${b >> 4}`;
          const existing = buckets.get(key);
          if (existing) {
            existing.r += r;
            existing.g += g;
            existing.b += b;
            existing.n += 1;
          } else {
            buckets.set(key, { r, g, b, n: 1 });
          }
        }

        const ranked = Array.from(buckets.values())
          .map((c) => ({
            r: c.r / c.n,
            g: c.g / c.n,
            b: c.b / c.n,
            n: c.n,
            sat:
              Math.max(c.r / c.n, c.g / c.n, c.b / c.n) -
              Math.min(c.r / c.n, c.g / c.n, c.b / c.n),
          }))
          .sort((a, b) => b.n * (1 + b.sat / 64) - a.n * (1 + a.sat / 64));

        if (!ranked.length) {
          resolve(FALLBACK);
          return;
        }

        const primary = ranked[0];
        // Second color: next distinct enough, or darkened primary
        let secondary = ranked.find((c) => {
          const dr = c.r - primary.r;
          const dg = c.g - primary.g;
          const db = c.b - primary.b;
          return Math.sqrt(dr * dr + dg * dg + db * db) > 40;
        });

        if (!secondary) {
          secondary = {
            r: primary.r * 0.35,
            g: primary.g * 0.35,
            b: primary.b * 0.35,
            n: 1,
            sat: 0,
          };
        } else {
          // Darken secondary slightly for depth
          secondary = {
            ...secondary,
            r: secondary.r * 0.55,
            g: secondary.g * 0.55,
            b: secondary.b * 0.55,
          };
        }

        resolve([
          rgb(primary.r, primary.g, primary.b),
          rgb(secondary.r, secondary.g, secondary.b),
        ]);
      } catch {
        resolve(FALLBACK);
      }
    };

    img.onerror = () => resolve(FALLBACK);
    img.src = src;
  });
}
