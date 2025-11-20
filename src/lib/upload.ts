/**
 * Uploads a file directly to Cloudinary using the unsigned upload API
 * @param file - File to upload
 * @param cloudName - Cloudinary cloud name
 * @param uploadPreset - Cloudinary upload preset
 * @returns Promise with public_id and secure_url
 */
export async function uploadToCloudinary(
  file: File,
  cloudName: string,
  uploadPreset: string
): Promise<{ public_id: string; secure_url: string }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Upload failed');
  }

  const data = await response.json();
  return {
    public_id: data.public_id,
    secure_url: data.secure_url,
  };
}

