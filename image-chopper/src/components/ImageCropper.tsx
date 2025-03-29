import React, { useState, useRef } from 'react';
import { Box, Button, Paper } from '@mui/material';
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

interface ImageCropperProps {
  /**
   * The source URL of the image to crop
   */
  src: string;
  /**
   * Optional alt text for the image
   */
  alt?: string;
  /**
   * Optional width of the container
   */
  width?: number | string;
  /**
   * Optional height of the container
   */
  height?: number | string;
  /**
   * Callback function when crop is complete
   */
  onCrop?: (croppedImage: string) => void;
}

function getCroppedImg(image: HTMLImageElement, crop: PixelCrop): Promise<string> {
  const canvas = document.createElement('canvas');
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context');
  }

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    crop.width,
    crop.height
  );

  return new Promise((resolve, reject) => {
    try {
      resolve(canvas.toDataURL('image/jpeg'));
    } catch (e) {
      reject(e);
    }
  });
}

export const ImageCropper: React.FC<ImageCropperProps> = ({
  src,
  alt = '',
  width = '100%',
  height = '400px',
  onCrop
}) => {
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    x: 10,
    y: 10,
    width: 80,
    height: 80
  });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const handleCrop = async () => {
    if (!imgRef.current || !completedCrop) return;

    try {
      const croppedImageUrl = await getCroppedImg(imgRef.current, completedCrop);
      onCrop?.(croppedImageUrl);
    } catch (e) {
      console.error('Error cropping image:', e);
    }
  };

  return (
    <Paper
      elevation={3}
      sx={{
        position: 'relative',
        width,
        height,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        p: 2
      }}
    >
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: 'calc(100% - 60px)', // Account for button height
          overflow: 'hidden',
          '& .ReactCrop': {
            width: '100%',
            height: '100%'
          }
        }}
      >
        <ReactCrop
          crop={crop}
          onChange={(_, percentCrop) => setCrop(percentCrop)}
          onComplete={(c) => setCompletedCrop(c)}
          aspect={1}
        >
          <img
            ref={imgRef}
            src={src}
            alt={alt}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain'
            }}
            crossOrigin="anonymous" // Add this to handle CORS
          />
        </ReactCrop>
      </Box>
      <Button
        variant="contained"
        color="primary"
        onClick={handleCrop}
        disabled={!completedCrop}
        sx={{ mt: 'auto' }}
      >
        Crop Image
      </Button>
    </Paper>
  );
}; 