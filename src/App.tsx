import React, { useState } from 'react';
import { ImageCropper } from './components/ImageCropper';
import { SavedImage, SavedImages } from './components/SavedImages';
import { AudioCropper } from './components/AudioCropper';
import { SavedAudio, SavedAudios } from './components/SavedAudios';
import './App.css';

type TabType = 'image' | 'audio';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('image');
  const [savedImages, setSavedImages] = useState<SavedImage[]>([]);
  const [savedAudios, setSavedAudios] = useState<SavedAudio[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedAudio, setSelectedAudio] = useState<string | null>(null);

  const handleImageSave = (filePath: string, filename: string) => {
    const newImage: SavedImage = { filePath, filename };
    setSavedImages(prev => [...prev, newImage]);
  };

  const handleAudioSave = (filePath: string, filename: string) => {
    const newAudio: SavedAudio = { filePath, filename };
    setSavedAudios(prev => [...prev, newAudio]);
  };

  const handleImageSelect = (image: SavedImage) => {
    setSelectedImage(`http://localhost:3001${image.filePath}`);
  };

  const handleAudioSelect = (audio: SavedAudio) => {
    setSelectedAudio(`http://localhost:3001${audio.filePath}`);
  };

  return (
    <div className="app-container">
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'image' ? 'active' : ''}`}
          onClick={() => setActiveTab('image')}
        >
          Images
        </button>
        <button
          className={`tab ${activeTab === 'audio' ? 'active' : ''}`}
          onClick={() => setActiveTab('audio')}
        >
          Audio
        </button>
      </div>

      {activeTab === 'image' ? (
        <>
          <div className="cropper-section">
            <h2>Image Cropper</h2>
            <ImageCropper
              src={selectedImage || 'https://picsum.photos/800/600'}
              onSave={handleImageSave}
            />
          </div>
          <div className="saved-section">
            <h2>Saved Images</h2>
            <SavedImages
              images={savedImages}
              onImageSelect={handleImageSelect}
            />
          </div>
        </>
      ) : (
        <>
          <div className="cropper-section">
            <h2>Audio Cropper</h2>
            <AudioCropper
              src={selectedAudio || '/example_audio/default.mp3'}
              onSave={handleAudioSave}
            />
          </div>
          <div className="saved-section">
            <h2>Saved Audio Files</h2>
            <SavedAudios
              audios={savedAudios}
              onAudioSelect={handleAudioSelect}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default App;
