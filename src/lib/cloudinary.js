import { Cloudinary } from '@cloudinary/url-gen';

const cld = new Cloudinary({
  cloud: {
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  },
  url: {
    secure: true
  }
});

export function getCloudinaryImage(publicId, transformations = []) {
  return cld.image(publicId).addTransformation(transformations.join(','));
}