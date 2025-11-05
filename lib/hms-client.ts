/**
 * 100ms (HMS) API Client
 * 
 * Handles room creation, token generation, and SIP bridging
 */

const HMS_API_BASE_URL = 'https://api.100ms.live/v2';
const HMS_ACCESS_KEY = process.env.HMS_ACCESS_KEY || '';
const HMS_SECRET = process.env.HMS_SECRET || '';
const HMS_SIP_ENDPOINT = process.env.HMS_SIP_ENDPOINT || '';

/**
 * Generate HMAC signature for HMS API requests
 */
function generateHMACSignature(method: string, uri: string, body: string): string {
  const crypto = require('crypto');
  const timestamp = Math.floor(Date.now() / 1000);
  const message = `${method}\n${uri}\n${timestamp}\n${body}`;
  const signature = crypto.createHmac('sha256', HMS_SECRET).update(message).digest('hex');
  return `${HMS_ACCESS_KEY}:${timestamp}:${signature}`;
}

/**
 * Create a room in 100ms
 */
export interface CreateRoomRequest {
  name: string;
  description?: string;
  template_id?: string;
  region?: string;
  customer_id?: string;
  metadata?: Record<string, unknown>;
}

export interface CreateRoomResponse {
  id: string;
  name: string;
  description?: string;
  template_id?: string;
  region?: string;
  customer_id?: string;
  created_at: string;
  updated_at: string;
  enabled: boolean;
  [key: string]: unknown;
}

export async function createRoom(roomData: CreateRoomRequest): Promise<CreateRoomResponse> {
  if (!HMS_ACCESS_KEY || !HMS_SECRET) {
    throw new Error('HMS_ACCESS_KEY and HMS_SECRET must be set');
  }

  const uri = '/rooms';
  const body = JSON.stringify(roomData);
  const signature = generateHMACSignature('POST', uri, body);

  const response = await fetch(`${HMS_API_BASE_URL}${uri}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': signature,
    },
    body,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create HMS room: ${response.status} ${error}`);
  }

  return response.json();
}

/**
 * Generate JWT token for participant
 */
export interface GenerateTokenRequest {
  room_id: string;
  user_id: string;
  role: string;
  metadata?: Record<string, unknown>;
}

export interface GenerateTokenResponse {
  token: string;
  room_id: string;
  user_id: string;
  role: string;
}

export async function generateToken(tokenData: GenerateTokenRequest): Promise<GenerateTokenResponse> {
  if (!HMS_ACCESS_KEY || !HMS_SECRET) {
    throw new Error('HMS_ACCESS_KEY and HMS_SECRET must be set');
  }

  // Use the correct endpoint for token generation
  const uri = `/active-rooms/${tokenData.room_id}/request-token`;
  const body = JSON.stringify({
    user_id: tokenData.user_id,
    role: tokenData.role,
    metadata: tokenData.metadata,
  });
  const signature = generateHMACSignature('POST', uri, body);

  const response = await fetch(`${HMS_API_BASE_URL}${uri}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': signature,
    },
    body,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to generate HMS token: ${response.status} ${error}`);
  }

  const data = await response.json();
  return {
    token: data.token,
    room_id: tokenData.room_id,
    user_id: tokenData.user_id,
    role: tokenData.role,
  };
}

/**
 * Start SIP audio session
 */
export interface StartSIPRequest {
  room_id: string;
  phone_number: string;
  codec?: string;
}

export interface StartSIPResponse {
  id: string;
  room_id: string;
  phone_number: string;
  status: string;
  [key: string]: unknown;
}

export async function startSIPAudio(sipData: StartSIPRequest): Promise<StartSIPResponse> {
  if (!HMS_SIP_ENDPOINT) {
    throw new Error('HMS_SIP_ENDPOINT must be set');
  }

  const uri = `${HMS_SIP_ENDPOINT}/sip/start`;
  const body = JSON.stringify({
    room_id: sipData.room_id,
    phone_number: sipData.phone_number,
    codec: sipData.codec || 'opus',
  });

  const response = await fetch(uri, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${HMS_ACCESS_KEY}`,
    },
    body,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to start SIP audio: ${response.status} ${error}`);
  }

  return response.json();
}

/**
 * Get room details
 */
export interface RoomDetails {
  id: string;
  name: string;
  description?: string;
  template_id?: string;
  region?: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

export async function getRoom(roomId: string): Promise<RoomDetails> {
  if (!HMS_ACCESS_KEY || !HMS_SECRET) {
    throw new Error('HMS_ACCESS_KEY and HMS_SECRET must be set');
  }

  const uri = `/rooms/${roomId}`;
  const signature = generateHMACSignature('GET', uri, '');

  const response = await fetch(`${HMS_API_BASE_URL}${uri}`, {
    method: 'GET',
    headers: {
      'Authorization': signature,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get HMS room: ${response.status} ${error}`);
  }

  return response.json();
}
