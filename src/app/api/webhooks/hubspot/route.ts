import { NextRequest, NextResponse } from 'next/server';
import {
  verifyHubSpotWebhookSignature,
  processHubSpotWebhookEvents,
  HubSpotWebhookEvent,
} from '@/lib/hubspot-service';

export async function POST(req: NextRequest) {
  try {
    const signatureHeader =
      req.headers.get('x-hubspot-signature-v3') ||
      req.headers.get('X-HubSpot-Signature-v3');
    const timestampHeader =
      req.headers.get('x-hubspot-request-timestamp') ||
      req.headers.get('X-HubSpot-Request-Timestamp');

    // 1. Signature & Timestamp presence check
    if (!signatureHeader || !timestampHeader) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized: Missing required HubSpot webhook security headers.',
        },
        { status: 401 }
      );
    }

    // 2. Read raw unparsed body for cryptographic verification
    const rawBody = await req.text();

    // 3. Cryptographic signature verification using HMAC-SHA256 & replay defense
    const verification = verifyHubSpotWebhookSignature({
      method: req.method,
      requestUrl: req.url,
      rawBody,
      signatureHeader,
      timestampHeader,
    });

    if (!verification.valid) {
      console.warn(`[HubSpot Webhook Security] Signature verification failed: ${verification.error}`);
      return NextResponse.json(
        {
          success: false,
          error: `Unauthorized: ${verification.error || 'Invalid webhook signature.'}`,
        },
        { status: 401 }
      );
    }

    // 4. Parse JSON payload
    let events: HubSpotWebhookEvent[];
    try {
      const parsed = JSON.parse(rawBody);
      events = Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'Malformed JSON payload received from webhook sender.',
        },
        { status: 400 }
      );
    }

    // 5. Process events with strict tenant isolation, durable idempotency, and atomic updates
    const syncResult = await processHubSpotWebhookEvents(events, { rawBody });

    return NextResponse.json(
      {
        success: true,
        data: syncResult,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Unhandled error in HubSpot webhook route:', error?.message || error);
    return NextResponse.json(
      {
        success: false,
        error: 'An internal error occurred while processing HubSpot webhook events.',
      },
      { status: 500 }
    );
  }
}
