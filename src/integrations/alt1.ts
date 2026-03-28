import type { PixelSource } from "../visual/detector";
import type { BrightnessProbeDefinition, NormalizedRect, TextProbeDefinition } from "../visual/profiles";

export interface Alt1Like {
  permissionOverlay?: boolean;
  permissionPixel?: boolean;
  rsLinked?: boolean;
  rsWidth?: number;
  rsHeight?: number;
  overLayText?: (
    text: string,
    color: number,
    size: number,
    x: number,
    y: number,
    timeout: number
  ) => boolean;
  bindRegion?: (x: number, y: number, w: number, h: number) => number;
  bindGetPixel?: (id: number, x: number, y: number) => number;
  bindReadStringEx?: (id: number, x: number, y: number, args: string) => string;
  clearBinds?: () => void;
}

declare global {
  interface Window {
    alt1?: Alt1Like;
  }
}

function getAlt1(): Alt1Like | undefined {
  return typeof window !== "undefined" ? window.alt1 : undefined;
}

export function isAlt1Available(): boolean {
  return Boolean(getAlt1());
}

export function isPixelAccessReady(): boolean {
  const alt1 = getAlt1();
  return Boolean(
    alt1 &&
      alt1.permissionPixel &&
      alt1.rsLinked &&
      alt1.bindRegion &&
      alt1.bindReadStringEx &&
      alt1.bindGetPixel
  );
}

export function sendOverlayPreview(text: string): boolean {
  const alt1 = getAlt1();
  if (!alt1?.permissionOverlay || !alt1.overLayText) {
    return false;
  }
  return alt1.overLayText(text, 0xffffffff, 18, 120, 120, 1800);
}

function bindRect(rect: NormalizedRect): {
  id: number;
  width: number;
  height: number;
} | null {
  const alt1 = getAlt1();
  if (
    !alt1?.permissionPixel ||
    !alt1.rsLinked ||
    !alt1.bindRegion ||
    !alt1.rsWidth ||
    !alt1.rsHeight
  ) {
    return null;
  }

  const x = Math.round(rect.x * alt1.rsWidth);
  const y = Math.round(rect.y * alt1.rsHeight);
  const width = Math.max(1, Math.round(rect.w * alt1.rsWidth));
  const height = Math.max(1, Math.round(rect.h * alt1.rsHeight));
  const id = alt1.bindRegion(x, y, width, height);

  if (!id) {
    return null;
  }

  return { id, width, height };
}

function unpackAverageBrightness(pixel: number): number {
  const channel1 = pixel & 0xff;
  const channel2 = (pixel >> 8) & 0xff;
  const channel3 = (pixel >> 16) & 0xff;
  return Math.round((channel1 + channel2 + channel3) / 3);
}

export function createAlt1PixelSource(): PixelSource | undefined {
  const alt1 = getAlt1();
  if (!alt1) {
    return undefined;
  }

  return {
    isReady(): boolean {
      return isPixelAccessReady();
    },
    readText(rect: NormalizedRect, probe: TextProbeDefinition): string {
      const alt = getAlt1();
      if (!alt?.bindReadStringEx) {
        return "";
      }
      const bound = bindRect(rect);
      if (!bound) {
        return "";
      }

      const x = Math.round(probe.anchorX * bound.width);
      const y = Math.round(probe.anchorY * bound.height);
      try {
        return (
          alt.bindReadStringEx(
            bound.id,
            x,
            y,
            JSON.stringify({
              allowgap: Boolean(probe.allowGap),
              fontname: probe.fontName
            })
          ) ?? ""
        ).trim();
      } finally {
        alt.clearBinds?.();
      }
    },
    readBrightness(rect: NormalizedRect, probe: BrightnessProbeDefinition) {
      const alt = getAlt1();
      if (!alt?.bindGetPixel) {
        return { average: 0, hits: 0, total: 0 };
      }
      const bound = bindRect(rect);
      if (!bound) {
        return { average: 0, hits: 0, total: 0 };
      }

      let totalBrightness = 0;
      let hits = 0;
      try {
        for (const point of probe.points) {
          const px = Math.round(point.x * bound.width);
          const py = Math.round(point.y * bound.height);
          const rawPixel = alt.bindGetPixel(bound.id, px, py);
          const brightness = unpackAverageBrightness(rawPixel);
          totalBrightness += brightness;
          if (brightness >= point.min && brightness <= point.max) {
            hits += 1;
          }
        }
      } finally {
        alt.clearBinds?.();
      }

      return {
        average: probe.points.length ? totalBrightness / probe.points.length : 0,
        hits,
        total: probe.points.length
      };
    },
    readSignature(rect: NormalizedRect, gridSize: number): number[] {
      const alt = getAlt1();
      if (!alt?.bindGetPixel) {
        return [];
      }
      const bound = bindRect(rect);
      if (!bound) {
        return [];
      }

      const size = Math.max(2, Math.min(16, Math.round(gridSize)));
      const signature: number[] = [];
      try {
        for (let row = 0; row < size; row += 1) {
          for (let col = 0; col < size; col += 1) {
            const px = Math.max(0, Math.min(bound.width - 1, Math.round(((col + 0.5) / size) * bound.width)));
            const py = Math.max(0, Math.min(bound.height - 1, Math.round(((row + 0.5) / size) * bound.height)));
            const rawPixel = alt.bindGetPixel(bound.id, px, py);
            signature.push(unpackAverageBrightness(rawPixel));
          }
        }
      } finally {
        alt.clearBinds?.();
      }

      return signature;
    }
  };
}
