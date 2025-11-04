/**
 * DM2Pay Builder Utilities
 * Helper functions for DM2Pay Builder
 */

import type { DM2PayConfig } from './types';

/**
 * Validates DM2Pay configuration
 */
export function validateDM2PayConfig(config: DM2PayConfig): {
  isValid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  if (config.apiKey && config.apiKey.trim().length === 0) {
    errors.apiKey = 'API Key cannot be empty';
  }

  if (config.merchantId && config.merchantId.trim().length === 0) {
    errors.merchantId = 'Merchant ID cannot be empty';
  }

  if (config.environment && !['sandbox', 'production'].includes(config.environment)) {
    errors.environment = 'Environment must be either "sandbox" or "production"';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Gets default DM2Pay configuration
 */
export function getDefaultDM2PayConfig(): DM2PayConfig {
  return {
    apiKey: '',
    environment: 'sandbox',
    merchantId: '',
    enabled: false,
  };
}

/**
 * Initializes DM2Pay Builder
 */
export async function initializeDM2PayBuilder(
  config: DM2PayConfig
): Promise<{ success: boolean; message?: string }> {
  try {
    // Validate configuration
    const validation = validateDM2PayConfig(config);
    if (!validation.isValid) {
      return {
        success: false,
        message: 'Configuration validation failed',
      };
    }

    // Initialize DM2Pay (placeholder for actual initialization logic)
    if (config.enabled) {
      // TODO: Add actual DM2Pay SDK initialization here
      console.log('DM2Pay Builder initialized with config:', config);
    }

    return {
      success: true,
      message: 'DM2Pay Builder initialized successfully',
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Saves DM2Pay configuration (placeholder for actual save logic)
 */
export async function saveDM2PayConfig(
  config: DM2PayConfig
): Promise<{ success: boolean; message?: string }> {
  try {
    // TODO: Implement actual save logic (localStorage, API call, etc.)
    if (typeof window !== 'undefined') {
      localStorage.setItem('dm2pay-config', JSON.stringify(config));
    }
    return {
      success: true,
      message: 'Configuration saved successfully',
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to save configuration',
    };
  }
}

/**
 * Loads DM2Pay configuration (placeholder for actual load logic)
 */
export function loadDM2PayConfig(): DM2PayConfig | null {
  try {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dm2pay-config');
      if (saved) {
        return JSON.parse(saved) as DM2PayConfig;
      }
    }
    return null;
  } catch (error) {
    console.error('Failed to load DM2Pay configuration:', error);
    return null;
  }
}






