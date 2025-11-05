/**
 * Call Billing Utilities
 * 
 * Handles call billing, balance checks, and per-minute rate calculations
 */

import { getWallet } from './wallet';

/**
 * Default rate per minute in stars (1 star = 1 cent)
 */
export const DEFAULT_RATE_PER_MINUTE_STARS = 10; // 10 stars per minute

/**
 * Estimated call duration for balance checks (in minutes)
 */
const ESTIMATED_CALL_DURATION_MINUTES = 30;

/**
 * Check if user has sufficient balance for a call
 */
export interface BalanceCheckResult {
  canAfford: boolean;
  balance: number;
  estimatedCost: number;
  ratePerMinute: number;
}

export async function checkCallBalance(
  userId: string,
  ratePerMinute: number = DEFAULT_RATE_PER_MINUTE_STARS
): Promise<BalanceCheckResult> {
  try {
    const wallet = await getWallet(userId);
    const balance = wallet?.stars || 0;
    const estimatedCost = ratePerMinute * ESTIMATED_CALL_DURATION_MINUTES;
    const canAfford = balance >= estimatedCost;

    return {
      canAfford,
      balance,
      estimatedCost,
      ratePerMinute,
    };
  } catch (error) {
    console.error('Error checking call balance:', error);
    return {
      canAfford: false,
      balance: 0,
      estimatedCost: ratePerMinute * ESTIMATED_CALL_DURATION_MINUTES,
      ratePerMinute,
    };
  }
}

/**
 * Calculate call cost based on duration
 */
export function calculateCallCost(
  durationSeconds: number,
  ratePerMinute: number = DEFAULT_RATE_PER_MINUTE_STARS
): number {
  const durationMinutes = durationSeconds / 60;
  return Math.ceil(durationMinutes * ratePerMinute);
}
