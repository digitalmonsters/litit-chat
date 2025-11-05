import { NextResponse } from "next/server";

/**
 * POST /api/push/send
 * 
 * Send push notification via FCM REST API
 * 
 * Body:
 * {
 *   token: string; // FCM token
 *   title: string;
 *   bodyText: string;
 * }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, title, bodyText } = body;

    if (!token || !title || !bodyText) {
      return NextResponse.json(
        { error: 'token, title, and bodyText are required' },
        { status: 400 }
      );
    }

    const serverKey = process.env.FIREBASE_SERVER_KEY;
    if (!serverKey) {
      return NextResponse.json(
        { error: 'FIREBASE_SERVER_KEY not configured' },
        { status: 500 }
      );
    }

    const res = await fetch("https://fcm.googleapis.com/fcm/send", {
      method: "POST",
      headers: {
        Authorization: `key=${serverKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        notification: { title, body: bodyText },
        to: token,
      }),
    });

    const data = await res.json();
    
    if (!res.ok) {
      return NextResponse.json(
        { error: 'Failed to send notification', details: data },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error sending push notification:', error);
    return NextResponse.json(
      {
        error: 'Failed to send push notification',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}


