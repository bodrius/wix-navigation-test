import type { WithSpringConfig } from 'react-native-reanimated';

export type ListRowAnimationConfig = {
  openThreshold: number;
  openDistancePx?: number;
  openVelocityThreshold: number;
  springConfig: WithSpringConfig;
  activeOffsetX?: number;
  dragOpenTriggerOffset?: number;
  failOffsetY?: [number, number];
};
