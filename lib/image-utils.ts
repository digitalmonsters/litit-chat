/**
 * Image Utilities
 * 
 * Helper functions for image optimization and Bunny CDN integration
 */

/**
 * Bunny CDN URL formatter
 * Converts storage URLs to Bunny CDN URLs for optimization
 */
export function getBunnyCDNUrl(url: string, options?: {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpg' | 'png';
}): string {
  // If already a Bunny CDN URL, return as is
  if (url.includes('bunnycdn.com') || url.includes('bunny.net')) {
    return url;
  }

  // If no Bunny CDN is configured, return original URL
  // In production, you would replace this with your actual Bunny CDN domain
  const BUNNY_CDN_DOMAIN = process.env.NEXT_PUBLIC_BUNNY_CDN_DOMAIN;
  
  if (!BUNNY_CDN_DOMAIN) {
    return url;
  }

  // Extract the path from the original URL
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname;
    
    // Build Bunny CDN URL with optimization parameters
    const params = new URLSearchParams();
    if (options?.width) params.append('w', options.width.toString());
    if (options?.height) params.append('h', options.height.toString());
    if (options?.quality) params.append('q', options.quality.toString());
    if (options?.format) params.append('f', options.format);
    
    const queryString = params.toString();
    return `${BUNNY_CDN_DOMAIN}${path}${queryString ? `?${queryString}` : ''}`;
  } catch {
    // If URL parsing fails, return original
    return url;
  }
}

/**
 * Get optimized image src for Next.js Image component
 */
export function getOptimizedImageSrc(
  url: string,
  options?: {
    width?: number;
    height?: number;
    quality?: number;
  }
): string {
  return getBunnyCDNUrl(url, {
    ...options,
    format: 'webp',
    quality: options?.quality ?? 85,
  });
}

/**
 * Get image dimensions from URL or return defaults
 */
export function getImageDimensions(url: string): { width: number; height: number } {
  // Try to extract dimensions from URL if present
  const widthMatch = url.match(/[?&]w=(\d+)/);
  const heightMatch = url.match(/[?&]h=(\d+)/);
  
  if (widthMatch && heightMatch) {
    return {
      width: parseInt(widthMatch[1], 10),
      height: parseInt(heightMatch[1], 10),
    };
  }
  
  // Default dimensions for responsive images
  return { width: 800, height: 600 };
}

