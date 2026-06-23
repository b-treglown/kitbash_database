/**
 * API Route: Upload image to Supabase Storage
 * POST /api/upload
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import {
  enforceRateLimit,
  isSafePathSegment,
  sanitizeText,
  secureJson,
} from '@/lib/requestSecurity';

/**
 * Uploads file to Supabase Storage bucket
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const isDevelopment = process.env.NODE_ENV === 'development';

  try {
    console.log('[upload] POST /api/upload started');

    const limited = enforceRateLimit(request, 'api:upload:post', 20, 60_000);
    if (limited) {
      console.log('[upload] Rate limit exceeded');
      return limited;
    }

    console.log('[upload] Parsing FormData...');
    let formData: FormData;
    try {
      formData = await request.formData();
      console.log('[upload] FormData parsed successfully');
    } catch (parseError) {
      console.error('[upload] FormData parse error:', parseError);
      return secureJson({ error: 'Invalid form data' }, { status: 400 });
    }

    const file = formData.get('file') as File;
    const prefixRaw = (formData.get('prefix') as string) || 'uploads';
    const typeRaw = (formData.get('type') as string) || 'image';

    console.log('[upload] Extracted FormData fields:', {
      hasFile: !!file,
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      prefixRaw,
      typeRaw,
    });

    if (!file) {
      console.warn('[upload] Validation failed: No file provided');
      return secureJson({ error: 'No file provided' }, { status: 400 });
    }

    const prefix = sanitizeText(prefixRaw, 80);
    if (!isSafePathSegment(prefix)) {
      console.warn('[upload] Validation failed: Invalid upload prefix', { prefixRaw, prefix });
      return secureJson({ error: 'Invalid upload prefix' }, { status: 400 });
    }

    const type = typeRaw === 'thumbnail' ? 'thumbnail' : 'image';

    // Validate file
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      console.warn('[upload] Validation failed: File too large', { fileSize: file.size, maxSize });
      return secureJson({ error: 'File too large (max 10MB)' }, { status: 400 });
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      console.warn('[upload] Validation failed: Unsupported file type', { fileType: file.type, allowedTypes });
      return secureJson({ error: 'Unsupported file type (JPEG, PNG, WebP, GIF only)' }, { status: 400 });
    }

    console.log('[upload] File validation passed');

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

    console.log('[upload] Generated storage path:', {
      filename,
      storagePath,
      ext,
      timestamp,
      randomId,
    });

    console.log('[upload] Converting file to buffer...');
    let buffer: Buffer;
    try {
      buffer = Buffer.from(await file.arrayBuffer());
      console.log('[upload] Buffer created:', { bufferSize: buffer.length });
    } catch (bufferError) {
      console.error('[upload] Buffer creation error:', bufferError);
      return secureJson({ error: 'Failed to process file' }, { status: 500 });
    }

    console.log('[upload] Uploading to Supabase Storage...');
    const uploadResponse = await supabase.storage
      .from('uploaded_images')
      .upload(storagePath, buffer, {
        contentType: file.type,
        cacheControl: '31536000', // 1 year
        upsert: false,
      });

    const { data, error: uploadError } = uploadResponse;

    console.log('[upload] Supabase upload response:', {
      hasError: !!uploadError,
      hasData: !!data,
      errorCode: (uploadError as any)?.code,
      errorMessage: (uploadError as any)?.message,
      errorStatus: (uploadError as any)?.status,
      dataPath: (data as any)?.path,
    });

    if (uploadError) {
      console.error('[upload] Supabase storage error - Full details:', {
        code: (uploadError as any)?.code,
        message: (uploadError as any)?.message,
        status: (uploadError as any)?.status,
        name: (uploadError as any)?.name,
      });

      const errorMessage = isDevelopment
        ? `Upload failed: ${(uploadError as any)?.message || String(uploadError)}`
        : 'Upload failed';

      return secureJson({ error: errorMessage }, { status: 500 });
    }

    console.log('[upload] File uploaded successfully to:', (data as any)?.path);

    // Get public URL
    console.log('[upload] Generating public URL for:', storagePath);
    const urlResponse = supabase.storage
      .from('uploaded_images')
      .getPublicUrl(storagePath);

    const publicUrlData = urlResponse?.data;

    if (!publicUrlData) {
      console.error('[upload] Error getting public URL: null response', {
        storagePath,
        urlResponse,
      });
      return secureJson({ error: 'Failed to generate public URL' }, { status: 500 });
    }

    const publicUrl = publicUrlData?.publicUrl;

    if (!publicUrl) {
      console.error('[upload] Public URL is empty', {
        publicUrlData,
        storagePath,
      });
      return secureJson({ error: 'Invalid public URL response' }, { status: 500 });
    }

    console.log('[upload] Upload successful:', {
      filename,
      storagePath,
      publicUrl: publicUrl.substring(0, 100) + '...',
      bufferSize: buffer.length,
    });

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
    console.error('[upload] Unexpected error:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: error instanceof Error ? error.constructor.name : typeof error,
    });

    const errorMessage = isDevelopment
      ? `Server error: ${error instanceof Error ? error.message : String(error)}`
      : 'Upload failed';

    return secureJson({ error: errorMessage }, { status: 500 });
  }
}
