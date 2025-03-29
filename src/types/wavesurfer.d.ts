import WaveSurfer from 'wavesurfer.js';

declare module 'wavesurfer.js' {
  interface WaveSurfer {
    backend: {
      buffer: AudioBuffer;
    };
  }
}
