import { useWindowDimensions } from 'react-native';

export type Breakpoint = 'sm' | 'md' | 'lg' | 'xl';

export const breakpoints = {
  sm: 0,
  md: 720,
  lg: 1024,
  xl: 1280,
} as const;

export function useBreakpoint() {
  const { width } = useWindowDimensions();
  const bp: Breakpoint = width >= breakpoints.xl ? 'xl' : width >= breakpoints.lg ? 'lg' : width >= breakpoints.md ? 'md' : 'sm';
  return {
    width,
    bp,
    isMobile: bp === 'sm',
    isTablet: bp === 'md',
    isDesktop: bp === 'lg' || bp === 'xl',
    atLeast(target: Breakpoint) {
      return width >= breakpoints[target];
    },
  };
}
