import React, { useState, useRef, useEffect } from 'react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop, PercentCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

export type AspectRatio = {
  value: number | undefined;
  label: string;
};

export const COMMON_ASPECT_RATIOS: AspectRatio[] = [
  { value: undefined, label: 'Free' },
  { value: 1, label: 'Square (1:1)' },
  { value: 16/9, label: 'Landscape (16:9)' },
  { value: 4/3, label: 'Classic (4:3)' },
  { value: 3/2, label: 'Photo (3:2)' },
  { value: 9/16, label: 'Portrait (9:16)' },
];

export interface ImageCropperProps {
  /**
   * The source URL or File of the image to crop
   */
  src: string;
  /**
   * Optional default aspect ratio for the crop (width/height)
   * If not provided, defaults to undefined (free form)
   */
  defaultAspect?: number;
  /**
   * Optional array of custom aspect ratios to show
   * If not provided, uses COMMON_ASPECT_RATIOS
   */
  aspectRatios?: AspectRatio[];
  /**
   * Optional minimum width of the crop (in pixels)
   */
  minWidth?: number;
  /**
   * Optional minimum height of the crop (in pixels)
   */
  minHeight?: number;
  /**
   * Optional prefix for saved image files
   */
  fileNamePrefix?: string;
  /**
   * Callback function when crop is complete
   * @param blob - The cropped image as a Blob
   * @param dataUrl - The cropped image as a base64 string
   */
  onCropComplete?: (blob: Blob, dataUrl: string) => void;
  /**
   * Optional callback when an image is saved
   * @param filePath - The path where the image was saved
   * @param timestamp - The timestamp when the image was saved
   */
  onSave?: (filePath: string, timestamp: string) => void;
}

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%' as const,
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  )
}

export const ImageCropper: React.FC<ImageCropperProps> = ({
  src,
  defaultAspect,
  aspectRatios = COMMON_ASPECT_RATIOS,
  minWidth = 100,
  minHeight = 100,
  fileNamePrefix = 'cropped',
  onCropComplete,
  onSave,
}) => {
  const [currentAspect, setCurrentAspect] = useState<number | undefined>(defaultAspect);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [lastCroppedBlob, setLastCroppedBlob] = useState<Blob | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    const defaultCrop: PercentCrop = {
      unit: '%',
      x: 10,
      y: 10,
      width: 80,
      height: 80
    };

    const newCrop = currentAspect 
      ? centerAspectCrop(width, height, currentAspect)
      : defaultCrop;
    
    setCrop(newCrop);

    // Convert percent crop to pixel crop for initial crop
    if (width && height) {
      const pixelCrop: PixelCrop = {
        unit: 'px',
        x: (defaultCrop.x * width) / 100,
        y: (defaultCrop.y * height) / 100,
        width: (defaultCrop.width * width) / 100,
        height: (defaultCrop.height * height) / 100
      };
      createCroppedImage(pixelCrop);
    }
  }

  // Reset crop when aspect ratio or image changes
  useEffect(() => {
    if (imgRef.current?.complete) {
      onImageLoad({ currentTarget: imgRef.current } as React.SyntheticEvent<HTMLImageElement>);
    }
  }, [currentAspect, src]);

  const createCroppedImage = async (pixelCrop: PixelCrop) => {
    try {
      if (!imgRef.current || !pixelCrop.width || !pixelCrop.height) {
        console.log('Missing required crop data');
        return;
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.error('Failed to get canvas context');
        return;
      }

      // Wait for image to load
      await new Promise((resolve) => {
        if (imgRef.current?.complete) {
          resolve(null);
        } else {
          imgRef.current?.addEventListener('load', () => resolve(null));
        }
      });

      // Account for image's natural dimensions
      const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
      const scaleY = imgRef.current.naturalHeight / imgRef.current.height;

      // Set canvas dimensions to match scaled crop size
      canvas.width = pixelCrop.width * scaleX;
      canvas.height = pixelCrop.height * scaleY;

      // Draw cropped image with proper scaling
      ctx.drawImage(
        imgRef.current,
        pixelCrop.x * scaleX,
        pixelCrop.y * scaleY,
        pixelCrop.width * scaleX,
        pixelCrop.height * scaleY,
        0,
        0,
        pixelCrop.width * scaleX,
        pixelCrop.height * scaleY
      );

      // Convert to blob and base64
      const format = 'image/jpeg'; // Always use JPEG for consistency
      const quality = 0.95;

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to create blob'));
        }, format, quality);
      });
      
      const base64 = canvas.toDataURL(format, quality);
      console.log('Created cropped image:', { width: canvas.width, height: canvas.height });

      setLastCroppedBlob(blob);
      onCropComplete?.(blob, base64);
    } catch (err) {
      console.error('Error creating cropped image:', err);
    }
  };

  const handleSave = async () => {
    if (!lastCroppedBlob) return;

    try {
      // Create FormData object to send the file
      const formData = new FormData();
      formData.append('file', lastCroppedBlob, 'image.jpg');

      // Send the file to the server
      const response = await fetch('http://localhost:3001/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to save image');
      }

      const { filePath, filename } = await response.json();
      onSave?.(filePath, filename);
    } catch (err) {
      console.error('Error saving image:', err);
    }
  };

  return (
    <div style={{ 
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      maxWidth: '100%',
      height: '100%'
    }}>
      <div style={{
        display: 'flex',
        gap: '10px',
        flexWrap: 'wrap',
        justifyContent: 'center',
        padding: '10px'
      }}>
        {aspectRatios.map((ratio) => (
          <button
            key={ratio.label}
            onClick={() => setCurrentAspect(ratio.value)}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              backgroundColor: currentAspect === ratio.value ? '#1976d2' : '#ffffff',
              color: currentAspect === ratio.value ? '#ffffff' : '#1976d2',
              border: '1px solid #1976d2',
              borderRadius: '4px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {ratio.label}
          </button>
        ))}
      </div>
      <div style={{ 
        flex: 1,
        minHeight: 0,
        position: 'relative',
        maxHeight: '600px'
      }}>
        <ReactCrop
          crop={crop}
          onChange={(_, percentCrop) => setCrop(percentCrop)}
          onComplete={(c) => {
            setCompletedCrop(c);
            createCroppedImage(c);
          }}
          aspect={currentAspect}
          minWidth={minWidth}
          minHeight={minHeight}
        >
          <img
            ref={imgRef}
            alt="Crop me"
            src={src}
            crossOrigin="anonymous"
            onLoad={onImageLoad}
            style={{ 
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              display: 'block'
            }}
          />
        </ReactCrop>
      </div>
      <button
        onClick={handleSave}
        disabled={!lastCroppedBlob}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: '#1976d2',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: lastCroppedBlob ? 'pointer' : 'not-allowed',
          opacity: lastCroppedBlob ? 1 : 0.7,
          alignSelf: 'center',
          marginTop: 'auto'
        }}
      >
        SAVE CROPPED IMAGE
      </button>
    </div>
  );
};

export default ImageCropper;
