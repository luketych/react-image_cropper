declare module 'lamejs' {
  export interface Mp3EncoderOptions {
    sampleRate?: number;
    kbps?: number;
  }

  export class Mp3Encoder {
    constructor(channels: number, sampleRate: number, kbps: number);
    encodeBuffer(left: Int16Array, right?: Int16Array): Uint8Array;
    flush(): Uint8Array;
  }

  export function Mp3Encoder(channels: number, sampleRate: number, kbps: number): Mp3Encoder;
} 