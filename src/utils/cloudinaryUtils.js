// utils/cloudinaryUtils.js
export const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'dxd-magnate'); // Your Cloudinary upload preset
    formData.append('cloud_name', 'dsbt1j73t'); // Your Cloudinary cloud name
  
    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/dsbt1j73t/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );
  
      if (!response.ok) {
        throw new Error('Failed to upload file');
      }
  
      const data = await response.json();
      return {
        url: data.secure_url,
        publicId: data.public_id,
        type: data.resource_type,
        format: data.format,
        bytes: data.bytes
      };
    } catch (error) {
      console.error('Error uploading to Cloudinary:', error);
      throw error;
    }
  };