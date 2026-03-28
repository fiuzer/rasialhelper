export interface Alt1Like {
  permissionOverlay?: boolean;
  overLayText?: (
    text: string,
    color: number,
    size: number,
    x: number,
    y: number,
    timeout: number
  ) => boolean;
}

declare global {
  interface Window {
    alt1?: Alt1Like;
  }
}

export function isAlt1Available(): boolean {
  return typeof window !== "undefined" && Boolean(window.alt1);
}

export function sendOverlayPreview(text: string): boolean {
  if (!isAlt1Available() || !window.alt1?.permissionOverlay || !window.alt1.overLayText) {
    return false;
  }
  return window.alt1.overLayText(text, 0xffffffff, 18, 120, 120, 1800);
}
