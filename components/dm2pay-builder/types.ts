/**
 * DM2Pay Builder Types
 * Type definitions for DM2Pay Builder component
 */

export interface DM2PayConfig {
  apiKey?: string;
  environment?: 'sandbox' | 'production';
  merchantId?: string;
  enabled?: boolean;
}

export interface DM2PayBuilderProps {
  config?: DM2PayConfig;
  onConfigChange?: (config: DM2PayConfig) => void;
  className?: string;
}

export interface DM2PayBuilderState {
  config: DM2PayConfig;
  isInitialized: boolean;
  isValid: boolean;
  errors: Record<string, string>;
}

export interface DM2PayBuilderContextType {
  config: DM2PayConfig;
  updateConfig: (updates: Partial<DM2PayConfig>) => void;
  validateConfig: () => boolean;
  initialize: () => Promise<void>;
  reset: () => void;
}





