export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';

const GUEST_DAILY_LIMIT = 3;

function getTodayCookieKey(): string {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `guest_usage_${y}${m}${day}`;
}

export async function POST(req: NextRequest) {
  try {
    const cookieKey = getTodayCookieKey();

    // Guest-only limit via cookie (no DB needed in edge runtime)
    const cookieVal = req.cookies.get(cookieKey)?.value;
    const guestCount = cookieVal ? parseInt(cookieVal, 10) : 0;

    if (guestCount >= GUEST_DAILY_LIMIT) {
      return NextResponse.json(
        { error: 'daily_limit_reached', remaining: 0, limit: GUEST_DAILY_LIMIT },
        { status: 429 }
      );
    }

    // Process image
    const formData = await req.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    const apiKey = process.env.REMOVE_BG_API_KEY;
    if (!apiKey) {
      console.error('[remove-bg] REMOVE_BG_API_KEY is not set');
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    // Convert file to ArrayBuffer for Edge Runtime compatibility
    const fileBuffer = await file.arrayBuffer();
    const fileBytes = new Uint8Array(fileBuffer);

    const form = new FormData();
    const blob = new Blob([fileBytes], { type: file.type });
    form.append('image_file', blob, file.name || 'image.png');
    form.append('size', 'auto');

    console.log('[remove-bg] Calling Remove.bg API, file size:', fileBytes.length);

    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': apiKey,
      },
      body: form,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[remove-bg] Remove.bg API error:', response.status, errorText);
      return NextResponse.json(
        { error: `Background removal failed (${response.status}). ${errorText}` },
        { status: 500 }
      );
    }

    const buffer = await response.arrayBuffer();
    const newCount = guestCount + 1;
    const remaining = Math.max(0, GUEST_DAILY_LIMIT - newCount);

    const res = new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': 'attachment; filename="removed-bg.png"',
        'X-Usage-Remaining': String(remaining),
        'X-Usage-Limit': String(GUEST_DAILY_LIMIT),
      },
    });

    // Set guest usage cookie
    res.cookies.set(cookieKey, String(newCount), {
      maxAge: 86400,
      httpOnly: false,
      path: '/',
    });

    return res;
  } catch (error) {
    console.error('[remove-bg] Unexpected error:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}
