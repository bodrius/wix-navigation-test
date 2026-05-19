import {
  GRID_GAP,
  GRID_HORIZONTAL_PADDING,
  GRID_IMAGE_ASPECT,
  GRID_LIST_PADDING_TOP,
  GRID_NUM_COLUMNS,
} from '../constants/grid';
import type { ImageLayoutBounds } from '../types/imageLayout';

export function getGridImageSize(screenWidth: number): number {
  const totalGap = GRID_GAP * (GRID_NUM_COLUMNS - 1);
  const totalPadding = GRID_HORIZONTAL_PADDING * 2;
  return (screenWidth - totalPadding - totalGap) / GRID_NUM_COLUMNS;
}

export function getGridItemBounds(
  index: number,
  screenWidth: number,
  imageSize: number,
  listTopY: number,
  scrollY: number,
): ImageLayoutBounds {
  const imageHeight = imageSize * GRID_IMAGE_ASPECT;
  const col = index % GRID_NUM_COLUMNS;
  const row = Math.floor(index / GRID_NUM_COLUMNS);

  const x =
    col === 0
      ? GRID_HORIZONTAL_PADDING
      : screenWidth - GRID_HORIZONTAL_PADDING - imageSize;

  const y =
    listTopY + GRID_LIST_PADDING_TOP + row * (imageHeight + GRID_GAP) - scrollY;

  return {
    x,
    y,
    width: imageSize,
    height: imageHeight,
  };
}
