/**
 * API Route: Upload image to Cloudflare R2
 * POST /api/upload
 */

import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { NextRequest, NextResponse } from 'next/server';
import {
  enforceRateLimit,
  isSafePathSegment,
  requireWriteToken,
  sanitizeText,
  secureJson,
} from '@/lib/requestSecurity';

/**
 * For local development, saves to /public/uploads
 * In production, would use R2 API
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const limited = enforceRateLimit(request, 'api:upload:post', 20, 60_000);
    if (limited) {
      return limited;
    }

    const authError = requireWriteToken(request);
    if (authError) {
      return authError;
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const prefixRaw = (formData.get('prefix') as string) || 'uploads';
    const typeRaw = (formData.get('type') as string) || 'image';

    if (!file) {
      return secureJson({ error: 'No file provided' }, { status: 400 });
    }

    const prefix = sanitizeText(prefixRaw, 80);
    if (!isSafePathSegment(prefix)) {
      return secureJson({ error: 'Invalid upload prefix' }, { status: 400 });
    }

    const type = typeRaw === 'thumbnail' ? 'thumbnail' : 'image';

    // Validate file
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return secureJson({ error: 'File too large' }, { status: 400 });
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return secureJson({ error: 'Unsupported file type' }, { status: 400 });
    }

    // Generate filename
    const timestamp = Date.now();
    const randomId = crypto.randomUUID();
    const extMap: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
    };
    const ext = extMap[file.type] || 'jpg';
    const filename = `${type}-${timestamp}-${randomId}.${ext}`;
    const relativeDir = join('uploads', prefix);
    const absoluteDir = join(process.cwd(), 'public', relativeDir);
    const filepath = join(absoluteDir, filename);

    // For local dev, save to public folder
    // In production, this would upload to R2
    const buffer = Buffer.from(await file.arrayBuffer());

    await mkdir(absoluteDir, { recursive: true });
    await writeFile(filepath, buffer);

    const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
    const url = `${origin}/${relativeDir.replace(/\\/g, '/')}/${filename}`;

    return secureJson(
      {
        success: true,
        url,
        filename,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Upload error:', error);
    return secureJson({ error: 'Upload failed' }, { status: 500 });
  }
}
