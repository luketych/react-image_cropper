/** @jsxImportSource react */
import React, { useState, useRef, useEffect } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.js';
import { Mp3Encoder } from 'lamejs';
import './AudioCropper.css';

interface AudioRegion {
  id: string;
  start: number;
  end: number;
  remove(): void;
}

interface RegionsList {
  [key: string]: AudioRegion;
}

// Extended Regions interface
interface RegionsInstance {
  list: RegionsList;
  add(params: {
    start: number;
    end: number;
    drag?: boolean;
    resize?: boolean;
    color?: string;
  }): AudioRegion;
  enableDragSelection(options: { color: string }): void;
}

// WaveSurfer configuration options
interface WaveSurferOptions {
  container: HTMLElement | string;
  height?: number;
  cursorColor?: string;
  progressColor?: string;
  waveColor?: string;
  minPxPerSec?: number;
  normalize?: boolean;
  [key: string]: any;
}

// WaveSurfer static factory
interface WaveSurferStatic {
  create(options: WaveSurferOptions): WaveSurfer;
}

// Custom event types
type EventCallback = () => void;
type RegionCallback = (region: AudioRegion) => void;

// Combined WaveSurfer instance interface with strict typing
interface CustomWaveSurfer {
  regions: RegionsInstance;
  getDuration(): number;
  destroy(): void;
  playPause(): Promise<void>;
  load(url: string): Promise<void>;
  on(event: 'ready' | 'play' | 'pause', callback: EventCallback): this;
  on(event: 'region-created' | 'region-updated', callback: RegionCallback): this;
  once(event: 'ready', callback: EventCallback): this;
}

export interface AudioCropperProps {
  src: string;
  fileNamePrefix?: string;
  onCropComplete?: (blob: Blob) => void;
  onSave?: (filePath: string, filename: string) => void;
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
  const wavesurferRef = useRef<CustomWaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [outputFormat, setOutputFormat] = useState<'wav' | 'mp3'>(initialOutputFormat);
  const [savedSegments, setSavedSegments] = useState<{ start: number; end: number; duration: number }[]>([]);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const togglePlay = async () => {
    if (wavesurferRef.current && isLoaded) {
      await wavesurferRef.current.playPause();
    }
  };

  const handleSave = async () => {
    if (!isLoaded || !audioBuffer) return;

    try {
      const sampleRate = audioBuffer.sampleRate;
      const startSample = Math.floor(startTime * sampleRate);
      const endSample = Math.floor(endTime * sampleRate);
      const length = endSample - startSample;

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
        const mp3Encoder = new Mp3Encoder(
          newBuffer.numberOfChannels,
          newBuffer.sampleRate,
          128
        );

        // Process each channel
        const channels: Int16Array[] = [];
        for (let channel = 0; channel < newBuffer.numberOfChannels; channel++) {
          const channelData = newBuffer.getChannelData(channel);
          const samples = new Int16Array(channelData.length);
          for (let i = 0; i < channelData.length; i++) {
            samples[i] = Math.max(-1, Math.min(1, channelData[i])) * 0x7FFF;
          }
          channels.push(samples);
        }

        // Encode in chunks
        const chunkSize = 1152;
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

        const totalLength = mp3Data.reduce((acc, chunk) => acc + chunk.length, 0);
        const mp3Array = new Uint8Array(totalLength);
        let offset = 0;
        for (const chunk of mp3Data) {
          mp3Array.set(chunk, offset);
          offset += chunk.length;
        }

        blob = new Blob([mp3Array], { type: 'audio/mp3' });
      } else {
        // Create WAV file
        const wavBlob = await new Promise<Blob>((resolve) => {
          const { numberOfChannels, sampleRate } = newBuffer;
          const length = newBuffer.length * 2 * numberOfChannels;
          const buffer = new ArrayBuffer(44 + length);
          const view = new DataView(buffer);

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

      const formData = new FormData();
      const extension = outputFormat === 'mp3' ? '.mp3' : '.wav';
      formData.append('file', blob, `${fileNamePrefix}${extension}`);

      const response = await fetch('http://localhost:3001/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to save audio');
      }

      const { filePath, filename } = await response.json();
      
      setSavedSegments(prev => [...prev, {
        start: startTime,
        end: endTime,
        duration: endTime - startTime
      }]);
      
      onSave?.(filePath, filename);
      onCropComplete?.(blob);

    } catch (err) {
      console.error('Error saving audio:', err);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const initWaveSurfer = async () => {
      if (!containerRef.current) return;

      try {
        if (wavesurferRef.current) {
          wavesurferRef.current.destroy();
        }

        const wavesurfer = (WaveSurfer as unknown as WaveSurferStatic).create({
          container: containerRef.current,
          height: 128,
          cursorColor: '#0066cc',
          progressColor: '#0066cc',
          waveColor: '#4d4d4d',
          minPxPerSec: 100,
          normalize: true
        });

        const regions = RegionsPlugin.create();
        wavesurfer.registerPlugin(regions);

        // Cast to CustomWaveSurfer with proper event handling
        const ws = {
          ...wavesurfer,
          regions: regions as unknown as RegionsInstance,
          on: (event: string, callback: EventCallback | RegionCallback) => {
            wavesurfer.on(event, callback as any);
            return ws;
          },
          once: (event: string, callback: EventCallback) => {
            wavesurfer.once(event, callback);
            return ws;
          }
        } as CustomWaveSurfer;

        wavesurferRef.current = ws;

        ws.once('ready', async () => {
          if (!isMounted) return;
          
          const audioDuration = ws.getDuration();
          setDuration(audioDuration);
          setEndTime(audioDuration);
          setIsLoaded(true);

          try {
            const audioContext = new AudioContext();
            const response = await fetch(src);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            setAudioBuffer(audioBuffer);
          } catch (err) {
            console.error('Error loading audio buffer:', err);
          }
        });

        ws.on('play', () => isMounted && setIsPlaying(true));
        ws.on('pause', () => isMounted && setIsPlaying(false));

        try {
          await ws.load(src);

          if (ws.regions) {
            ws.regions.add({
              start: 0,
              end: ws.getDuration(),
              color: 'rgba(0, 102, 204, 0.2)',
              drag: true,
              resize: true
            });

            ws.on('region-created', (region: AudioRegion) => {
              if (!isMounted) return;
              Object.values(ws.regions.list).forEach((existingRegion: AudioRegion) => {
                if (existingRegion.id !== region.id) {
                  existingRegion.remove();
                }
              });
              setStartTime(region.start);
              setEndTime(region.end);
            });

            ws.on('region-updated', (region: AudioRegion) => {
              if (!isMounted) return;
              setStartTime(region.start);
              setEndTime(region.end);
            });

            ws.regions.enableDragSelection({
              color: 'rgba(0, 102, 204, 0.2)'
            });
          }
        } catch (err) {
          console.error('Error loading audio:', err);
        }
      } catch (err) {
        console.error('Error initializing WaveSurfer:', err);
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

  return (
    <div className="audio-cropper">
      <div className="editor-section">
        <div className="waveform" ref={containerRef} />
        <div className="controls">
          <div className="time-controls">
            <label>
              Start Time:
              <input
                type="number"
                min={0}
                max={duration}
                value={startTime}
                onChange={(e) => setStartTime(Math.max(0, Math.min(duration, parseFloat(e.target.value))))}
                disabled={!isLoaded}
              />
            </label>
            <span>{formatTime(startTime)}</span>
          </div>
          <button onClick={togglePlay} disabled={!isLoaded}>
            {isPlaying ? "Pause" : "Play"}
          </button>
          <div className="time-controls">
            <label>
              End Time:
              <input
                type="number"
                min={0}
                max={duration}
                value={endTime}
                onChange={(e) => setEndTime(Math.max(0, Math.min(duration, parseFloat(e.target.value))))}
                disabled={!isLoaded}
              />
            </label>
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
          <button 
            onClick={handleSave}
            className="save-button"
            disabled={!isLoaded || startTime >= endTime}
          >
            SAVE CROPPED AUDIO
          </button>
        </div>
      </div>
      <div className="segments-section">
        <h3>Saved Segments</h3>
        {savedSegments.length === 0 ? (
          <p>No segments saved yet</p>
        ) : (
          <div className="saved-segments">
            {savedSegments.map((segment, index) => (
              <div key={index} className="segment">
                <div>
                  <span>{formatTime(segment.start)}</span>
                  {" - "}
                  <span>{formatTime(segment.end)}</span>
                </div>
                <span>Duration: {formatTime(segment.duration)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AudioCropper;
