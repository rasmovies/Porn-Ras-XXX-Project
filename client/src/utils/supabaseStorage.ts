import { supabase } from '../lib/supabase';

/**
 * Upload file to Supabase Storage
 * @param file - File to upload
 * @param bucket - Storage bucket name
 * @param folder - Optional folder path within bucket
 * @returns Public URL of uploaded file
 */
export async function uploadToSupabaseStorage(
  file: File,
  bucket: string,
  folder: string = ''
): Promise<string> {
  try {
    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `${folder ? `${folder}/` : ''}${timestamp}-${randomString}.${fileExtension}`;

    console.log(`📤 Uploading to Supabase Storage: ${bucket}/${fileName}`);

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('❌ Supabase Storage upload error:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }

    console.log('✅ File uploaded to Supabase Storage:', data.path);

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    if (!urlData?.publicUrl) {
      throw new Error('Failed to get public URL');
    }

    console.log('✅ Public URL:', urlData.publicUrl);
    return urlData.publicUrl;
  } catch (error) {
    console.error('❌ Upload error:', error);
    throw error;
  }
}

/**
 * Delete file from Supabase Storage
 * @param url - Public URL of the file
 * @param bucket - Storage bucket name
 */
export async function deleteFromSupabaseStorage(
  url: string,
  bucket: string
): Promise<void> {
  try {
    // Extract file path from URL
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const bucketIndex = pathParts.findIndex(part => part === bucket);
    
    if (bucketIndex === -1) {
      throw new Error('Invalid URL: bucket not found in path');
    }

    const filePath = pathParts.slice(bucketIndex + 1).join('/');
    
    console.log(`🗑️ Deleting from Supabase Storage: ${bucket}/${filePath}`);

    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      console.error('❌ Supabase Storage delete error:', error);
      throw new Error(`Delete failed: ${error.message}`);
    }

    console.log('✅ File deleted from Supabase Storage');
  } catch (error) {
    console.error('❌ Delete error:', error);
    throw error;
  }
}

