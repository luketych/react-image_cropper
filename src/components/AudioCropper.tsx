import React, { useState, useRef, useEffect } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Mp3Encoder } from 'lamejs';
import './AudioCropper.css';

export interface AudioCropperProps {
  /**
   * The source URL of the audio file to crop
   */
  src: string;
  /**
   * Optional prefix for saved audio files
   */
  fileNamePrefix?: string;
  /**
   * Optional callback when audio is cropped
   * @param blob - The cropped audio as a Blob
   */
  onCropComplete?: (blob: Blob) => void;
  /**
   * Optional callback when an audio file is saved
   * @param filePath - The path where the audio was saved
   * @param filename - The filename of the saved audio
   */
  onSave?: (filePath: string, filename: string) => void;
  /**
   * Output format for the cropped audio
   */
  outputFormat?: 'wav' | 'mp3';
}

export const AudioCropper: React.FC<AudioCropperProps> = ({
  src,
  fileNamePrefix = 'cropped-audio',
  onCropComplete,
  onSave,
  outputFormat: initialOutputFormat = 'mp3',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [outputFormat, setOutputFormat] = useState<'wav' | 'mp3'>(initialOutputFormat);

  useEffect(() => {
    let isMounted = true;

    const initWaveSurfer = async () => {
      if (!containerRef.current) return;

      try {
        // Clean up previous instance
        if (wavesurferRef.current) {
          wavesurferRef.current.destroy();
        }

        // Create new instance
        const wavesurfer = WaveSurfer.create({
          container: containerRef.current,
          waveColor: '#4a9eff',
          progressColor: '#1976d2',
          cursorColor: '#1976d2',
          height: 100,
          normalize: true,
          backend: 'WebAudio'
        });

        // Add event listeners
        wavesurfer.on('ready', async () => {
          if (!isMounted) return;
          const duration = wavesurfer.getDuration();
          setDuration(duration);
          setEndTime(duration);
          setIsLoaded(true);

          // Get the audio buffer
          try {
            const audioContext = new AudioContext();
            const response = await fetch(src);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            setAudioBuffer(audioBuffer);
            console.log('Audio buffer loaded successfully');
          } catch (err) {
            console.error('Error loading audio buffer:', err);
          }
        });

        wavesurfer.on('play', () => isMounted && setIsPlaying(true));
        wavesurfer.on('pause', () => isMounted && setIsPlaying(false));

        // Load audio file
        await wavesurfer.load(src);
        
        // Store reference
        wavesurferRef.current = wavesurfer;
      } catch (err) {
        console.error('Error loading audio:', err);
      }
    };

    initWaveSurfer();

    return () => {
      isMounted = false;
      if (wavesurferRef.current) {
        try {
          wavesurferRef.current.destroy();
        } catch (err) {
          console.error('Error cleaning up wavesurfer:', err);
        }
      }
    };
  }, [src]);

  const togglePlay = () => {
    if (wavesurferRef.current && isLoaded) {
      wavesurferRef.current.playPause();
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSave = async () => {
    console.log('Save button clicked');
    if (!isLoaded || !audioBuffer) {
      console.log('Audio not loaded or buffer not available:', { isLoaded, hasBuffer: !!audioBuffer });
      return;
    }

    try {
      console.log('Starting save process...');
      // Calculate start and end samples
      const sampleRate = audioBuffer.sampleRate;
      const startSample = Math.floor(startTime * sampleRate);
      const endSample = Math.floor(endTime * sampleRate);
      const length = endSample - startSample;

      console.log('Creating new buffer...');
      // Create new buffer for the cropped section
      const audioContext = new AudioContext();
      const newBuffer = audioContext.createBuffer(
        audioBuffer.numberOfChannels,
        length,
        sampleRate
      );

      // Copy the selected portion of audio
      for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
        const channelData = audioBuffer.getChannelData(channel);
        const newData = newBuffer.getChannelData(channel);
        for (let i = 0; i < length; i++) {
          newData[i] = channelData[startSample + i];
        }
      }

      let blob: Blob;
      if (outputFormat === 'mp3') {
        console.log('Converting to MP3...');
        // Convert to MP3
        const mp3Encoder = new Mp3Encoder(
          newBuffer.numberOfChannels,
          newBuffer.sampleRate,
          128
        );

        // Process each channel separately
        const channels: Int16Array[] = [];
        for (let channel = 0; channel < newBuffer.numberOfChannels; channel++) {
          const channelData = newBuffer.getChannelData(channel);
          const samples = new Int16Array(channelData.length);
          for (let i = 0; i < channelData.length; i++) {
            // Convert float32 to int16
            samples[i] = Math.max(-1, Math.min(1, channelData[i])) * 0x7FFF;
          }
          channels.push(samples);
        }

        // Encode the audio data in chunks to avoid memory issues
        const chunkSize = 1152; // Standard MP3 frame size
        const mp3Data: Uint8Array[] = [];
        
        for (let i = 0; i < channels[0].length; i += chunkSize) {
          const chunk = channels.map(channel => 
            channel.slice(i, i + chunkSize)
          );
          const encoded = mp3Encoder.encodeBuffer(
            chunk[0],
            newBuffer.numberOfChannels === 2 ? chunk[1] : undefined
          );
          if (encoded.length > 0) {
            mp3Data.push(encoded);
          }
        }
        
        const mp3End = mp3Encoder.flush();
        if (mp3End.length > 0) {
          mp3Data.push(mp3End);
        }

        // Combine all chunks
        const totalLength = mp3Data.reduce((acc, chunk) => acc + chunk.length, 0);
        const mp3Array = new Uint8Array(totalLength);
        let offset = 0;
        for (const chunk of mp3Data) {
          mp3Array.set(chunk, offset);
          offset += chunk.length;
        }

        blob = new Blob([mp3Array], { type: 'audio/mp3' });
      } else {
        console.log('Creating WAV file...');
        // Create WAV file
        const wavBlob = await new Promise<Blob>((resolve) => {
          const { numberOfChannels, sampleRate } = newBuffer;
          const length = newBuffer.length * 2 * numberOfChannels;
          const buffer = new ArrayBuffer(44 + length);
          const view = new DataView(buffer);

          // Write WAV header
          const writeString = (offset: number, string: string) => {
            for (let i = 0; i < string.length; i++) {
              view.setUint8(offset + i, string.charCodeAt(i));
            }
          };

          writeString(0, 'RIFF');
          view.setUint32(4, 36 + length, true);
          writeString(8, 'WAVE');
          writeString(12, 'fmt ');
          view.setUint32(16, 16, true);
          view.setUint16(20, 1, true);
          view.setUint16(22, numberOfChannels, true);
          view.setUint32(24, sampleRate, true);
          view.setUint32(28, sampleRate * numberOfChannels * 2, true);
          view.setUint16(32, numberOfChannels * 2, true);
          view.setUint16(34, 16, true);
          writeString(36, 'data');
          view.setUint32(40, length, true);

          // Write audio data
          let offset = 44;
          for (let i = 0; i < newBuffer.length; i++) {
            for (let channel = 0; channel < numberOfChannels; channel++) {
              const sample = newBuffer.getChannelData(channel)[i];
              const scaled = Math.max(-1, Math.min(1, sample));
              view.setInt16(offset, scaled * 0x7FFF, true);
              offset += 2;
            }
          }

          resolve(new Blob([buffer], { type: 'audio/wav' }));
        });
        blob = wavBlob;
      }

      console.log('Sending to server...');
      // Send to server
      const formData = new FormData();
      const extension = outputFormat === 'mp3' ? '.mp3' : '.wav';
      formData.append('file', blob, `cropped${extension}`);

      const response = await fetch('http://localhost:3001/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        console.error('Server response not OK:', response.status, response.statusText);
        throw new Error('Failed to save audio');
      }

      const { filePath, filename } = await response.json();
      console.log('Save successful:', { filePath, filename });
      onSave?.(filePath, filename);
      onCropComplete?.(blob);

    } catch (err) {
      console.error('Error saving audio:', err);
    }
  };

  return (
    <div className="audio-cropper">
      <div className="waveform" ref={containerRef} />
      <div className="controls">
        <div className="time-controls">
          <input
            type="range"
            min={0}
            max={duration}
            value={startTime}
            onChange={(e) => setStartTime(parseFloat(e.target.value))}
            disabled={!isLoaded}
          />
          <span>{formatTime(startTime)}</span>
        </div>
        <button onClick={togglePlay} disabled={!isLoaded}>
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <div className="time-controls">
          <input
            type="range"
            min={0}
            max={duration}
            value={endTime}
            onChange={(e) => setEndTime(parseFloat(e.target.value))}
            disabled={!isLoaded}
          />
          <span>{formatTime(endTime)}</span>
        </div>
      </div>
      <div className="format-selector">
        <label>
          Output Format:
          <select
            value={outputFormat}
            onChange={(e) => setOutputFormat(e.target.value as 'wav' | 'mp3')}
          >
            <option value="mp3">MP3</option>
            <option value="wav">WAV</option>
          </select>
        </label>
      </div>
      <button 
        onClick={handleSave}
        className="save-button"
        disabled={!isLoaded || startTime >= endTime}
      >
        SAVE CROPPED AUDIO
      </button>
    </div>
  );
};

export default AudioCropper;
