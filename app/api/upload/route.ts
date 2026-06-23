/**
 * API Route: Upload image to Supabase Storage
 * POST /api/upload
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import {
  enforceRateLimit,
  isSafePathSegment,
  requireWriteToken,
  sanitizeText,
  secureJson,
} from '@/lib/requestSecurity';

/**
 * Uploads file to Supabase Storage bucket
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
      return secureJson({ error: 'File too large (max 10MB)' }, { status: 400 });
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return secureJson({ error: 'Unsupported file type (JPEG, PNG, WebP, GIF only)' }, { status: 400 });
    }

    // Generate filename and storage path
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
    const storagePath = `${prefix}/${filename}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload to Supabase Storage
    const { data, error: uploadError } = await supabase.storage
      .from('images')
      .upload(storagePath, buffer, {
        contentType: file.type,
        cacheControl: '31536000', // 1 year
        upsert: false,
      });

    if (uploadError) {
      console.error('Supabase storage error:', uploadError);
      return secureJson({ error: 'Upload failed' }, { status: 500 });
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('images')
      .getPublicUrl(storagePath);

    const publicUrl = publicUrlData.publicUrl;

    return secureJson(
      {
        success: true,
        url: publicUrl,
        filename,
        path: storagePath,
        provider: 'supabase',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Upload error:', error);
    return secureJson({ error: 'Upload failed' }, { status: 500 });
  }
}
