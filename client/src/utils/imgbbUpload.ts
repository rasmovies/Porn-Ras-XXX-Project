/**
 * Upload image to imgbb.com (external image hosting)
 * This uploads directly from the user's browser to imgbb, 
 * without using Vercel or Supabase resources
 * 
 * @param file - Image file to upload
 * @param apiKey - imgbb API key (optional, can be from env or localStorage)
 * @returns Direct link URL to the uploaded image
 */
export async function uploadToImgbb(
  file: File,
  apiKey?: string
): Promise<string> {
  try {
    // Get API key from parameter, environment variable, or localStorage
    const imgbbApiKey = 
      apiKey || 
      process.env.REACT_APP_IMGBB_API_KEY ||
      localStorage.getItem('imgbb_api_key') ||
      '';

    if (!imgbbApiKey) {
      throw new Error('imgbb API key is required. Please set REACT_APP_IMGBB_API_KEY or add it in localStorage as "imgbb_api_key"');
    }

    console.log('📤 Uploading to imgbb...', { fileName: file.name, fileSize: file.size });

    // Convert file to base64
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data:image/...;base64, prefix
        const base64Data = result.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });

    // Upload to imgbb API
    const formData = new FormData();
    formData.append('key', imgbbApiKey);
    formData.append('image', base64);

    const response = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `imgbb upload failed: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success || !data.data?.url) {
      throw new Error('imgbb upload failed: Invalid response');
    }

    // Get direct link (not thumbnail)
    const directUrl = data.data.url;
    console.log('✅ Uploaded to imgbb:', directUrl);

    return directUrl;
  } catch (error) {
    console.error('❌ imgbb upload error:', error);
    throw error;
  }
}

