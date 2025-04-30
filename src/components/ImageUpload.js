'use client';
import { useState } from 'react';
import { Button } from './ui/Button';

export function ImageUpload({ onUpload, currentImage }) {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(currentImage || null);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result);
    reader.readAsDataURL(file);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET);

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: 'POST', body: formData }
      );
      
      if (!response.ok) throw new Error('Upload failed');
      
      const data = await response.json();
      if (!data.public_id) throw new Error('No public_id returned');
      
      onUpload(data.public_id);
    } catch (error) {
      console.error('Upload error:', error);
      setPreview(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      {preview && (
        <div className="w-32 h-32 rounded-md overflow-hidden border">
          <img 
            src={preview} 
            alt="Preview" 
            className="object-cover w-full h-full"
          />
        </div>
      )}
      <input
        type="file"
        id="product-image-upload"
        accept="image/*"
        onChange={handleUpload}
        className="hidden"
        disabled={loading}
      />
      <Button asChild variant="outline" disabled={loading}>
        <label htmlFor="product-image-upload">
          {loading ? 'Uploading...' : preview ? 'Change Image' : 'Upload Image'}
        </label>
      </Button>
    </div>
  );
}