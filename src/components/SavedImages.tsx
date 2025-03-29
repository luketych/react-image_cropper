import React from 'react';

export interface SavedImage {
  filePath: string;
  filename: string;
}

interface SavedImagesProps {
  images: SavedImage[];
  onImageSelect: (image: SavedImage) => void;
}

export const SavedImages: React.FC<SavedImagesProps> = ({ images, onImageSelect }) => {
  if (images.length === 0) {
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        color: '#666'
      }}>
        No saved images yet
      </div>
    );
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
      gap: '20px',
      padding: '20px'
    }}>
      {images.map((image, index) => (
        <div
          key={image.filePath}
          onClick={() => onImageSelect(image)}
          style={{
            cursor: 'pointer',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            transition: 'transform 0.2s ease'
          }}
        >
          <img
            src={`http://localhost:3001${image.filePath}`}
            alt={`Saved image ${index + 1}`}
            style={{
              width: '100%',
              height: '200px',
              objectFit: 'cover'
            }}
          />
          <div style={{
            padding: '10px',
            backgroundColor: '#f5f5f5'
          }}>
            <div style={{
              fontSize: '14px',
              color: '#666'
            }}>
              {image.filename}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SavedImages;
