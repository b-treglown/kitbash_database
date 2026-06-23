/**
 * API Route: Upload image to Cloudflare R2
 * POST /api/upload
 */

import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import {
  enforceRateLimit,
  isSafePathSegment,
  requireWriteToken,
  sanitizeText,
  secureJson,
} from '@/lib/requestSecurity';

/**
 * Uses Cloudflare R2 when configured, otherwise saves to /public/uploads for local dev.
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

    // Generate filename and storage key
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
    const relativeDir = join('uploads', prefix).replace(/\\/g, '/');
    const storageKey = `${relativeDir}/${filename}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    const accountId = process.env.NEXT_PUBLIC_R2_ACCOUNT_ID;
    const bucket = process.env.NEXT_PUBLIC_R2_BUCKET_NAME;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const publicBaseUrl =
      process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL || process.env.R2_CDN_URL || '';

    const r2Configured =
      !!accountId && !!bucket && !!accessKeyId && !!secretAccessKey;

    if (r2Configured) {
      const endpoint = `https://${accountId}.r2.cloudflarestorage.com`;
      const s3 = new S3Client({
        region: 'auto',
        endpoint,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });

      await s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: storageKey,
          Body: buffer,
          ContentType: file.type,
          CacheControl: 'public, max-age=31536000, immutable',
        })
      );

      const url = publicBaseUrl
        ? `${publicBaseUrl.replace(/\/$/, '')}/${storageKey}`
        : `https://${bucket}.${accountId}.r2.cloudflarestorage.com/${storageKey}`;

      return secureJson(
        {
          success: true,
          url,
          filename,
          key: storageKey,
          provider: 'r2',
        },
        { status: 200 }
      );
    }

    // Local fallback
    const absoluteDir = join(process.cwd(), 'public', relativeDir);
    const filepath = join(absoluteDir, filename);

    await mkdir(absoluteDir, { recursive: true });
    await writeFile(filepath, buffer);

    const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
    const url = `${origin}/${storageKey}`;

    return secureJson(
      {
        success: true,
        url,
        filename,
        key: storageKey,
        provider: 'local',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Upload error:', error);
    return secureJson({ error: 'Upload failed' }, { status: 500 });
  }
}
