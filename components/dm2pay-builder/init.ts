/**
 * DM2Pay Builder Initialization
 * Initialization script for DM2Pay Builder
 */

import type { DM2PayConfig } from './types';
import { getDefaultDM2PayConfig, initializeDM2PayBuilder } from './utils';

/**
 * Initializes DM2Pay Builder with default or provided configuration
 */
export async function initDM2PayBuilder(
  config?: Partial<DM2PayConfig>
): Promise<{ success: boolean; message?: string; config: DM2PayConfig }> {
  const defaultConfig = getDefaultDM2PayConfig();
  const finalConfig: DM2PayConfig = {
    ...defaultConfig,
    ...config,
  };

  const result = await initializeDM2PayBuilder(finalConfig);

  return {
    ...result,
    config: finalConfig,
  };
}

/**
 * Checks if DM2Pay Builder is available
 */
export function isDM2PayBuilderAvailable(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Gets DM2Pay Builder version
 */
export function getDM2PayBuilderVersion(): string {
  return '1.0.0';
}





