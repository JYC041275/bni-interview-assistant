export interface ProcessedAudio {
  blob: Blob;
  url: string;
  filename: string;
  originalSize: number;
  newSize: number;
  sampleRate: number;
  bitDepth: number;
  duration: number;
}

export enum TargetFormat {
  Format_16k = '16kHz',
  Format_24k = '24kHz',
}

export interface ProcessingStats {
  compressionRatio: string;
  originalSizeMb: string;
  newSizeMb: string;
}

export interface TranscriptionResult {
  text: string;
  model: string;
}
