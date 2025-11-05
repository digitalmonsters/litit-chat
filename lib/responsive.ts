/**
 * Responsive Layout Utilities
 * 
 * Breakpoints and responsive helpers for mobile, tablet, desktop
 */

export const breakpoints = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
  wide: 1280,
} as const;

export type Breakpoint = keyof typeof breakpoints;

/**
 * Get current breakpoint based on window width
 */
export function getCurrentBreakpoint(width: number): Breakpoint {
  if (width >= breakpoints.wide) return 'wide';
  if (width >= breakpoints.desktop) return 'desktop';
  if (width >= breakpoints.tablet) return 'tablet';
  return 'mobile';
}

/**
 * Check if current width matches breakpoint
 */
export function isBreakpoint(width: number, breakpoint: Breakpoint): boolean {
  const current = getCurrentBreakpoint(width);
  return current === breakpoint;
}

/**
 * Check if width is mobile
 */
export function isMobile(width: number): boolean {
  return width < breakpoints.tablet;
}

/**
 * Check if width is tablet
 */
export function isTablet(width: number): boolean {
  return width >= breakpoints.tablet && width < breakpoints.desktop;
}

/**
 * Check if width is desktop
 */
export function isDesktop(width: number): boolean {
  return width >= breakpoints.desktop;
}

/**
 * Responsive value helper
 * Returns different values based on breakpoint
 */
export function responsive<T>(
  values: Partial<Record<Breakpoint, T>>,
  width: number
): T | undefined {
  const breakpoint = getCurrentBreakpoint(width);
  
  // Try to find value for current breakpoint, fallback to smaller breakpoints
  const breakpointOrder: Breakpoint[] = ['wide', 'desktop', 'tablet', 'mobile'];
  const currentIndex = breakpointOrder.indexOf(breakpoint);
  
  for (let i = currentIndex; i < breakpointOrder.length; i++) {
    const bp = breakpointOrder[i];
    if (values[bp] !== undefined) {
      return values[bp];
    }
  }
  
  return undefined;
}

/**
 * Tailwind breakpoint classes
 */
export const responsiveClasses = {
  mobile: 'sm:',
  tablet: 'md:',
  desktop: 'lg:',
  wide: 'xl:',
} as const;
