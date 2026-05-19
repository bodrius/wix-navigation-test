import type { ImageLayoutBounds } from '../types/imageLayout';

export function getImageTargetBounds(
  screenWidth: number,
  screenHeight: number,
  aspectRatio: number,
): ImageLayoutBounds {
  const screenAspect = screenWidth / screenHeight;

  let width: number;
  let height: number;

  if (aspectRatio > screenAspect) {
    width = screenWidth;
    height = screenWidth / aspectRatio;
  } else {
    height = screenHeight;
    width = screenHeight * aspectRatio;
  }

  return {
    x: (screenWidth - width) / 2,
    y: (screenHeight - height) / 2,
    width,
    height,
  };
}
