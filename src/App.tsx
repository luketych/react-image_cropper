import React, { useState } from 'react';
import { ImageCropper } from './components/ImageCropper';
import { SavedImage, SavedImages } from './components/SavedImages';
import './App.css';

const App: React.FC = () => {
  const [savedImages, setSavedImages] = useState<SavedImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleImageSave = (filePath: string, filename: string) => {
    const newImage: SavedImage = { filePath, filename };
    setSavedImages(prev => [...prev, newImage]);
  };

  const handleImageSelect = (image: SavedImage) => {
    setSelectedImage(`http://localhost:3001${image.filePath}`);
  };

  return (
    <div className="app-container">
      <div className="cropper-section">
        <h2>Image Cropper</h2>
        <ImageCropper
          src={selectedImage || 'https://picsum.photos/800/600'}
          onSave={handleImageSave}
        />
      </div>
      <div className="saved-images-section">
        <h2>Saved Images</h2>
        <SavedImages
          images={savedImages}
          onImageSelect={handleImageSelect}
        />
      </div>
    </div>
  );
};

export default App;
