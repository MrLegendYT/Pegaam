import { ImgBBResponse } from "../types";

const IMGBB_API_KEY = "3a8b3803786a5a839b54dd4a040fbc3d";

const compressImage = (file: File): Promise<Blob> => {
  return new Promise((resolve) => {
    // Skip compression for GIFs (to keep animation) or non-images
    if (!file.type.startsWith('image/') || file.type === 'image/gif') {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        const maxWidth = 1600; 
        const maxHeight = 1600;
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions while maintaining aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            resolve(file); // Fallback to original if context fails
            return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Compress to JPEG with 0.7 quality (good balance for chat)
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              resolve(file); // Fallback
            }
          }, 
          'image/jpeg', 
          0.7
        );
      };
      
      img.onerror = () => resolve(file); // Fallback on error
    };
    
    reader.onerror = () => resolve(file); // Fallback on error
  });
};

export const uploadImageToImgBB = async (file: File): Promise<string> => {
  try {
    // Compress image before upload
    const compressedBlob = await compressImage(file);
    
    const formData = new FormData();
    
    // Determine filename: if compressed (blob !== file), ensure it has .jpg extension
    const isCompressed = compressedBlob !== file;
    const fileName = isCompressed 
        ? (file.name.replace(/\.[^/.]+$/, "") + ".jpg") 
        : file.name;

    formData.append("image", compressedBlob, fileName);

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
      method: "POST",
      body: formData,
    });

    const data: ImgBBResponse = await response.json();

    if (data.success) {
      return data.data.url;
    } else {
      throw new Error("Image upload failed");
    }
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
};
