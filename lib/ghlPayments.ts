/**
 * GoHighLevel Payments API Wrapper
 * 
 * Provides functions for GHL payment operations:
 * - Create payment orders
 * - Create invoices
 * - Get payment details
 */

import { ghlClientRequest, GHLClientOptions } from './ghlClient';

/**
 * GHL Payment Order Request
 */
export interface GHLPaymentOrderRequest {
  contactId: string;
  amount: number;
  currency?: string;
  description?: string;
  paymentMethod?: string;
  paymentMethodId?: string;
  metadata?: Record<string, unknown>;
  items?: Array<{
    name: string;
    quantity: number;
    price: number;
    description?: string;
  }>;
}

/**
 * GHL Payment Order Response
 */
export interface GHLPaymentOrderResponse {
  payment: {
    id: string;
    contactId: string;
    amount: number;
    currency: string;
    status: string;
    paymentMethod: string;
    createdAt: string;
    updatedAt: string;
    [key: string]: unknown;
  };
}

/**
 * GHL Invoice Request
 */
export interface GHLInvoiceRequest {
  contactId: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    description?: string;
  }>;
  dueDate?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
}

/**
 * GHL Invoice Response
 */
export interface GHLInvoiceResponse {
  invoice: {
    id: string;
    contactId: string;
    amount: number;
    currency: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    [key: string]: unknown;
  };
}

/**
 * GHL Payment Response
 */
export interface GHLPaymentResponse {
  payment: {
    id: string;
    contactId: string;
    amount: number;
    currency: string;
    status: string;
    paymentMethod: string;
    createdAt: string;
    updatedAt: string;
    [key: string]: unknown;
  };
}

/**
 * Create a payment order
 * POST /payments/orders
 */
export async function createPaymentOrder(
  orderData: GHLPaymentOrderRequest,
  locationId?: string,
  options?: GHLClientOptions
): Promise<GHLPaymentOrderResponse> {
  return ghlClientRequest<GHLPaymentOrderResponse>(
    '/payments/orders',
    {
      method: 'POST',
      body: JSON.stringify(orderData),
    },
    { locationId, ...options }
  );
}

/**
 * Create an invoice
 * POST /invoices
 */
export async function createInvoice(
  invoiceData: GHLInvoiceRequest,
  locationId?: string,
  options?: GHLClientOptions
): Promise<GHLInvoiceResponse> {
  return ghlClientRequest<GHLInvoiceResponse>(
    '/invoices',
    {
      method: 'POST',
      body: JSON.stringify(invoiceData),
    },
    { locationId, ...options }
  );
}

/**
 * Get payment by ID
 * GET /payments/{id}
 */
export async function getPayment(
  paymentId: string,
  locationId?: string,
  options?: GHLClientOptions
): Promise<GHLPaymentResponse> {
  return ghlClientRequest<GHLPaymentResponse>(
    `/payments/${paymentId}`,
    {
      method: 'GET',
    },
    { locationId, ...options }
  );
}

/**
 * GHL Subscription Request
 */
export interface GHLSubscriptionRequest {
  contactId: string;
  planId?: string;
  planName: string;
  amount: number;
  currency?: string;
  interval: 'monthly' | 'yearly' | 'weekly' | 'daily';
  startDate?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

/**
 * GHL Subscription Response
 */
export interface GHLSubscriptionResponse {
  subscription: {
    id: string;
    contactId: string;
    planName: string;
    amount: number;
    currency: string;
    interval: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    [key: string]: unknown;
  };
}

/**
 * Create a subscription
 * POST /subscriptions
 */
export async function createSubscription(
  subscriptionData: GHLSubscriptionRequest,
  locationId?: string,
  options?: GHLClientOptions
): Promise<GHLSubscriptionResponse> {
  return ghlClientRequest<GHLSubscriptionResponse>(
    '/subscriptions',
    {
      method: 'POST',
      body: JSON.stringify(subscriptionData),
    },
    { locationId, ...options }
  );
}

/**
 * Cancel a subscription
 * DELETE /subscriptions/{id}
 */
export async function cancelSubscription(
  subscriptionId: string,
  locationId?: string,
  options?: GHLClientOptions
): Promise<{ success: boolean }> {
  return ghlClientRequest<{ success: boolean }>(
    `/subscriptions/${subscriptionId}`,
    {
      method: 'DELETE',
    },
    { locationId, ...options }
  );
}

