export const EXPO_OUT = [0.16, 1, 0.3, 1] as const;

export const EDITORIAL_TRANSITION = {
  duration: 0.7,
  ease: EXPO_OUT,
} as const;

export const DRAWER_TRANSITION = {
  duration: 0.42,
  ease: EXPO_OUT,
} as const;

export const MODAL_TRANSITION = {
  duration: 0.34,
  ease: EXPO_OUT,
} as const;

export const TAB_SPRING = {
  type: 'spring' as const,
  stiffness: 420,
  damping: 36,
  mass: 0.85,
};
