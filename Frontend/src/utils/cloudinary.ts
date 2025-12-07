/**
 * Cloudinary Upload Utility
 * 
 * This function uploads an image file to Cloudinary.
 * Replace the CLOUDINARY_UPLOAD_PRESET and CLOUDINARY_URL with your actual credentials.
 * 
 * Usage:
 * const imageUrl = await uploadToCloudinary(file);
 */

const CLOUDINARY_UPLOAD_PRESET = 'your_upload_preset'; // Replace with your Cloudinary upload preset
const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/your_cloud_name/image/upload'; // Replace with your Cloudinary URL

export async function uploadToCloudinary(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  try {
    const response = await fetch(CLOUDINARY_URL, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
}

/**
 * Alternative: Upload via your backend API
 * This is the recommended approach for security
 */
export async function uploadViaBackend(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('avatar', file);

  try {
    const response = await fetch('/api/upload/avatar', {
      method: 'POST',
      body: formData,
      // Include auth token if needed
      // headers: {
      //   'Authorization': `Bearer ${token}`
      // }
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    const data = await response.json();
    return data.url; // Your backend should return { url: 'https://...' }
  } catch (error) {
    console.error('Backend upload error:', error);
    throw error;
  }
}

