'use client';

/**
 * DM2Pay Builder Component
 * Main component for configuring and initializing DM2Pay
 */

import { useState, useEffect, useCallback } from 'react';
import type { DM2PayBuilderProps, DM2PayConfig } from './types';
import {
  validateDM2PayConfig,
  getDefaultDM2PayConfig,
  initializeDM2PayBuilder,
  saveDM2PayConfig,
  loadDM2PayConfig,
} from './utils';

export default function DM2PayBuilder({
  config: initialConfig,
  onConfigChange,
  className = '',
}: DM2PayBuilderProps) {
  const [config, setConfig] = useState<DM2PayConfig>(
    initialConfig || loadDM2PayConfig() || getDefaultDM2PayConfig()
  );
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string>('');

  // Validate configuration
  const validateConfig = useCallback(() => {
    const validation = validateDM2PayConfig(config);
    setErrors(validation.errors);
    return validation.isValid;
  }, [config]);

  // Update configuration
  const updateConfig = useCallback(
    (updates: Partial<DM2PayConfig>) => {
      const newConfig = { ...config, ...updates };
      setConfig(newConfig);
      setErrors({});
      setMessage('');
      
      if (onConfigChange) {
        onConfigChange(newConfig);
      }
    },
    [config, onConfigChange]
  );

  // Initialize DM2Pay Builder
  const handleInitialize = useCallback(async () => {
    if (!validateConfig()) {
      setMessage('Please fix configuration errors before initializing');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const result = await initializeDM2PayBuilder(config);
      if (result.success) {
        setIsInitialized(true);
        setMessage(result.message || 'Initialized successfully');
        
        // Save configuration
        await saveDM2PayConfig(config);
      } else {
        setMessage(result.message || 'Initialization failed');
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Initialization error');
    } finally {
      setIsLoading(false);
    }
  }, [config, validateConfig]);

  // Reset configuration
  const handleReset = useCallback(() => {
    const defaultConfig = getDefaultDM2PayConfig();
    setConfig(defaultConfig);
    setErrors({});
    setMessage('');
    setIsInitialized(false);
    
    if (onConfigChange) {
      onConfigChange(defaultConfig);
    }
  }, [onConfigChange]);

  // Validate on config change
  useEffect(() => {
    validateConfig();
  }, [config, validateConfig]);

  return (
    <div className={`dm2pay-builder ${className}`}>
      <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            DM2Pay Builder
          </h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Configure and initialize DM2Pay payment integration
          </p>
        </div>

        {/* Status Message */}
        {message && (
          <div
            className={`mb-4 rounded-md p-3 ${
              isInitialized
                ? 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                : 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400'
            }`}
          >
            {message}
          </div>
        )}

        {/* Configuration Form */}
        <div className="space-y-4">
          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Enable DM2Pay
            </label>
            <button
              type="button"
              onClick={() => updateConfig({ enabled: !config.enabled })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                config.enabled ? 'bg-blue-600' : 'bg-zinc-300 dark:bg-zinc-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  config.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* API Key */}
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              API Key
            </label>
            <input
              type="text"
              value={config.apiKey || ''}
              onChange={(e) => updateConfig({ apiKey: e.target.value })}
              placeholder="Enter your DM2Pay API key"
              className={`w-full rounded-md border px-3 py-2 text-sm ${
                errors.apiKey
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                  : 'border-zinc-300 focus:border-blue-500 focus:ring-blue-500 dark:border-zinc-700'
              } bg-white dark:bg-zinc-800 dark:text-zinc-100`}
              disabled={!config.enabled || isLoading}
            />
            {errors.apiKey && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                {errors.apiKey}
              </p>
            )}
          </div>

          {/* Merchant ID */}
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Merchant ID
            </label>
            <input
              type="text"
              value={config.merchantId || ''}
              onChange={(e) => updateConfig({ merchantId: e.target.value })}
              placeholder="Enter your merchant ID"
              className={`w-full rounded-md border px-3 py-2 text-sm ${
                errors.merchantId
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                  : 'border-zinc-300 focus:border-blue-500 focus:ring-blue-500 dark:border-zinc-700'
              } bg-white dark:bg-zinc-800 dark:text-zinc-100`}
              disabled={!config.enabled || isLoading}
            />
            {errors.merchantId && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                {errors.merchantId}
              </p>
            )}
          </div>

          {/* Environment */}
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Environment
            </label>
            <select
              value={config.environment || 'sandbox'}
              onChange={(e) =>
                updateConfig({
                  environment: e.target.value as 'sandbox' | 'production',
                })
              }
              className={`w-full rounded-md border px-3 py-2 text-sm ${
                errors.environment
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                  : 'border-zinc-300 focus:border-blue-500 focus:ring-blue-500 dark:border-zinc-700'
              } bg-white dark:bg-zinc-800 dark:text-zinc-100`}
              disabled={!config.enabled || isLoading}
            >
              <option value="sandbox">Sandbox</option>
              <option value="production">Production</option>
            </select>
            {errors.environment && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                {errors.environment}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleInitialize}
              disabled={!config.enabled || isLoading || isInitialized}
              className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? 'Initializing...' : isInitialized ? 'Initialized' : 'Initialize'}
            </button>
            <button
              onClick={handleReset}
              disabled={isLoading}
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Initialization Status */}
        {isInitialized && (
          <div className="mt-6 rounded-md bg-green-50 p-4 dark:bg-green-900/20">
            <div className="flex items-center gap-2">
              <svg
                className="h-5 w-5 text-green-600 dark:text-green-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm font-medium text-green-800 dark:text-green-400">
                DM2Pay Builder is initialized and ready to use
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}




