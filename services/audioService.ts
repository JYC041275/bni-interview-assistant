// Declare the global window interface to include lamejs
declare global {
  interface Window {
    lamejs: any;
  }
}

/**
 * Encodes an AudioBuffer to an MP3 Blob
 */
function bufferToMp3(buffer: AudioBuffer): Blob {
  const channels = 1; // Force mono for compression efficiency
  const sampleRate = buffer.sampleRate; // 16000 or 24000
  const kbps = 64; // 64kbps is generally sufficient for 16-24kHz speech

  // Access lamejs from the global window object
  const lamejs = window.lamejs;

  if (!lamejs || !lamejs.Mp3Encoder) {
    throw new Error("MP3 Encoder library (lamejs) failed to load. Please refresh the page and try again.");
  }

  const Mp3EncoderConstructor = lamejs.Mp3Encoder;
  const mp3encoder = new Mp3EncoderConstructor(channels, sampleRate, kbps);

  // Flatten to mono if needed
  let data: Float32Array;
  if (buffer.numberOfChannels === 1) {
    data = buffer.getChannelData(0);
  } else {
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);
    data = new Float32Array(left.length);
    for (let i = 0; i < left.length; i++) {
      data[i] = (left[i] + right[i]) / 2;
    }
  }

  // Convert Float32 to Int16
  const samples = new Int16Array(data.length);
  for (let i = 0; i < data.length; i++) {
    // Clamp between -1 and 1
    const s = Math.max(-1, Math.min(1, data[i]));
    // Scale to 16-bit integer range
    samples[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }

  // Encode in chunks
  const mp3Data: Int8Array[] = [];
  // 1152 samples per frame for MP3
  const sampleBlockSize = 1152;

  for (let i = 0; i < samples.length; i += sampleBlockSize) {
    const chunk = samples.subarray(i, i + sampleBlockSize);
    const mp3buf = mp3encoder.encodeBuffer(chunk);
    if (mp3buf.length > 0) {
      mp3Data.push(mp3buf);
    }
  }

  // Finish encoding
  const mp3buf = mp3encoder.flush();
  if (mp3buf.length > 0) {
    mp3Data.push(mp3buf);
  }

  return new Blob(mp3Data as any, { type: 'audio/mp3' });
}

export const processAudio = async (
  file: File,
  targetSampleRate: number
): Promise<{ blob: Blob, duration: number }> => {
  try {
    // 1. Read File
    const arrayBuffer = await file.arrayBuffer();

    // 2. Decode Audio
    const audioContext = new AudioContext();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    // 3. Resample using OfflineAudioContext
    // We force mono (1 channel) for the output to save space
    // FIX: Length must be an integer or it throws TypeError
    const length = Math.ceil(audioBuffer.duration * targetSampleRate);

    const offlineCtx = new OfflineAudioContext(
      1,
      length,
      targetSampleRate
    );

    const source = offlineCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(offlineCtx.destination);
    source.start();

    const resampledBuffer = await offlineCtx.startRendering();

    // 4. Encode to MP3
    const mp3Blob = bufferToMp3(resampledBuffer);

    // Close context to free resources
    await audioContext.close();

    return { blob: mp3Blob, duration: resampledBuffer.duration };
  } catch (error) {
    console.error("Audio Processing Error:", error);
    throw error;
  }
};

export const formatBytes = (bytes: number, decimals = 2) => {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * 判斷是否需要壓縮音頻
 * @param file 音頻文件
 * @returns true 如果文件大小超過 5MB
 */
export const shouldCompressAudio = (file: File): boolean => {
  const FILE_SIZE_THRESHOLD = 5 * 1024 * 1024; // 5MB
  return file.size > FILE_SIZE_THRESHOLD;
};
