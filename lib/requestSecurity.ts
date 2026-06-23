import { NextRequest, NextResponse } from 'next/server';

type RateBucket = {
  count: number;
  resetAt: number;
};

const rateStore = new Map<string, RateBucket>();

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const [first] = forwarded.split(',');
    return first.trim();
  }

  return request.ip || 'unknown';
}

export function secureJson(
  body: unknown,
  init?: { status?: number; headers?: HeadersInit }
): NextResponse {
  const response = NextResponse.json(body, { status: init?.status || 200 });

  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  if (init?.headers) {
    const extra = new Headers(init.headers);
    extra.forEach((value, key) => response.headers.set(key, value));
  }

  return response;
}

export function enforceRateLimit(
  request: NextRequest,
  routeKey: string,
  limit: number,
  windowMs: number
): NextResponse | null {
  const now = Date.now();
  const ip = getClientIp(request);
  const key = `${routeKey}:${ip}`;
  const current = rateStore.get(key);

  if (!current || current.resetAt <= now) {
    rateStore.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }

  if (current.count >= limit) {
    const retryAfter = Math.ceil((current.resetAt - now) / 1000);
    return secureJson(
      { error: 'Too many requests' },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfter),
        },
      }
    );
  }

  current.count += 1;
  rateStore.set(key, current);
  return null;
}

export function sanitizeText(input: string, maxLen: number): string {
  return input.trim().replace(/\s+/g, ' ').slice(0, maxLen);
}

export function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

export function isSafePathSegment(value: string): boolean {
  if (!value || value.length > 80) {
    return false;
  }

  if (value.includes('..') || value.startsWith('/') || value.startsWith('\\')) {
    return false;
  }

  return /^[a-zA-Z0-9/_-]+$/.test(value);
}

export function requireWriteToken(request: NextRequest): NextResponse | null {
  const configuredToken = process.env.WRITE_API_TOKEN;
  if (!configuredToken) {
    return secureJson(
      { error: 'Write operations are disabled' },
      { status: 503 }
    );
  }

  const providedToken = request.headers.get('x-write-token');
  if (!providedToken || providedToken !== configuredToken) {
    return secureJson({ error: 'Unauthorized' }, { status: 401 });
  }

  return null;
}
