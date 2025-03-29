import React from 'react';

export interface SavedAudio {
  filePath: string;
  filename: string;
}

interface SavedAudiosProps {
  audios: SavedAudio[];
  onAudioSelect: (audio: SavedAudio) => void;
}

export const SavedAudios: React.FC<SavedAudiosProps> = ({ audios, onAudioSelect }) => {
  if (audios.length === 0) {
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        color: '#666'
      }}>
        No saved audio files yet
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
      {audios.map((audio, index) => (
        <div
          key={audio.filePath}
          onClick={() => onAudioSelect(audio)}
          style={{
            cursor: 'pointer',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            transition: 'transform 0.2s ease',
            padding: '15px',
            background: '#f5f5f5'
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '10px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: '#1976d2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{ color: 'white', fontSize: '20px' }}>♪</span>
            </div>
            <div style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1
            }}>
              {audio.filename}
            </div>
          </div>
          <audio
            controls
            src={`http://localhost:3001${audio.filePath}`}
            style={{ width: '100%' }}
          />
        </div>
      ))}
    </div>
  );
};

export default SavedAudios;
