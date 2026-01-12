import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Get the data from the request
    const { file, filename, contentType, bucket } = await request.json();
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file data provided' },
        { status: 400 }
      );
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(file, 'base64');

    // Generate a unique filename if not provided
    const timestamp = Date.now();
    const finalFilename = `/${filename}-${timestamp}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket || 'uploads')
      .upload(finalFilename, buffer, {
        contentType: contentType || 'application/pdf',
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error('Supabase upload error:', error);
      
      // Handle specific Supabase errors
      if (error.message.includes('Bucket not found')) {
        return NextResponse.json(
          { error: 'Storage bucket not found' },
          { status: 404 }
        );
      }
      
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { error: 'Rate limit exceeded' },
          { status: 429 }
        );
      }
      
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket || 'uploads')
      .getPublicUrl(finalFilename);

    return NextResponse.json({
      success: true,
      path: data.path,
      publicUrl: urlData.publicUrl,
      bucket: bucket || 'uploads'
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}