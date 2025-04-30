'use client';

import { useState } from 'react';
import { Button } from './ui/Button';

export function ImageUpload({ onUpload }) {
  const [loading, setLoading] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'your_upload_preset');

    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );
      const data = await res.json();
      onUpload(data.public_id);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        id="product-image"
        accept="image/*"
        onChange={handleUpload}
        className="hidden"
      />
      <Button asChild variant="outline" disabled={loading}>
        <label htmlFor="product-image">
          {loading ? 'Uploading...' : 'Upload Image'}
        </label>
      </Button>
    </div>
  );
}