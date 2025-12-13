import React, { useState, useRef, useCallback } from 'react';
import { 
  Upload, 
  Music, 
  Download, 
  FileAudio, 
  CheckCircle2, 
  RefreshCw,
  Zap,
  Bot
} from 'lucide-react';
import { Button } from './components/Button';
import { ProcessedAudio, TargetFormat } from './types';
import { processAudio, formatBytes } from './services/audioService';
import { verifyAudioWithGemini } from './services/geminiService';

const App: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedFile, setProcessedFile] = useState<ProcessedAudio | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [targetFormat, setTargetFormat] = useState<TargetFormat>(TargetFormat.Format_16k);
  
  // Gemini Stats
  const [isVerifying, setIsVerifying] = useState(false);
  const [transcription, setTranscription] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      // Basic validation
      if (!selectedFile.type.startsWith('audio/')) {
        setError('Please upload a valid audio file.');
        return;
      }
      setFile(selectedFile);
      setProcessedFile(null);
      setError(null);
      setTranscription(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selectedFile = e.dataTransfer.files[0];
      if (!selectedFile.type.startsWith('audio/')) {
        setError('Please upload a valid audio file.');
        return;
      }
      setFile(selectedFile);
      setProcessedFile(null);
      setError(null);
      setTranscription(null);
    }
  };

  const handleProcess = async () => {
    if (!file) return;

    setIsProcessing(true);
    setError(null);

    try {
      const targetRate = targetFormat === TargetFormat.Format_24k ? 24000 : 16000;
      const { blob, duration } = await processAudio(file, targetRate);
      
      const newFilename = `${file.name.replace(/\.[^/.]+$/, "")}_${targetFormat}.mp3`;
      const url = URL.createObjectURL(blob);

      setProcessedFile({
        blob,
        url,
        filename: newFilename,
        originalSize: file.size,
        newSize: blob.size,
        sampleRate: targetRate,
        bitDepth: 16,
        duration
      });
    } catch (err: any) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      if (errorMessage.includes("Mp3 Encoder")) {
        setError(`Library Error: ${errorMessage}`);
      } else if (errorMessage.includes("decodeAudioData")) {
        setError("Could not decode audio file. The format might be unsupported or the file is corrupted.");
      } else {
         setError(`Processing failed: ${errorMessage}`);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVerifyWithGemini = async () => {
    if (!processedFile) return;
    setIsVerifying(true);
    setTranscription(null);
    try {
      const text = await verifyAudioWithGemini(processedFile.blob);
      setTranscription(text);
    } catch (err) {
      setTranscription("Error verifying with Gemini. Check your API Key configuration.");
    } finally {
      setIsVerifying(false);
    }
  };

  const reset = () => {
    setFile(null);
    setProcessedFile(null);
    setTranscription(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-blue-600 rounded-xl shadow-lg shadow-blue-900/50">
              <Music className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              SonicShrink
            </h1>
          </div>
          <p className="text-slate-400 max-w-lg mx-auto">
            Professional audio compressor. Downsample to MP3 16kHz or 24kHz. 
            Perfect for reducing API latency and storage costs.
          </p>
        </header>

        {/* Main Card */}
        <main className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-sm relative overflow-hidden">
          {/* Decorative Gradients */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-600/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

          {!processedFile ? (
            <div className="space-y-8 relative z-10">
              {/* Format Selection */}
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setTargetFormat(TargetFormat.Format_16k)}
                  className={`px-6 py-3 rounded-xl border transition-all duration-200 flex flex-col items-center gap-1 ${
                    targetFormat === TargetFormat.Format_16k
                      ? 'bg-blue-600/10 border-blue-500 text-blue-400'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <span className="font-bold text-lg">16 kHz</span>
                  <span className="text-xs opacity-70">MP3 Standard</span>
                </button>
                <button
                  onClick={() => setTargetFormat(TargetFormat.Format_24k)}
                  className={`px-6 py-3 rounded-xl border transition-all duration-200 flex flex-col items-center gap-1 ${
                    targetFormat === TargetFormat.Format_24k
                      ? 'bg-blue-600/10 border-blue-500 text-blue-400'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <span className="font-bold text-lg">24 kHz</span>
                  <span className="text-xs opacity-70">MP3 High Quality</span>
                </button>
              </div>

              {/* Upload Area */}
              <div
                className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-200 cursor-pointer ${
                  file
                    ? 'border-blue-500/50 bg-blue-500/5'
                    : 'border-slate-700 hover:border-slate-600 hover:bg-slate-800/30'
                }`}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="audio/*"
                  className="hidden"
                />
                
                {file ? (
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto text-blue-400">
                      <FileAudio className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-xl font-medium text-slate-200">{file.name}</h3>
                      <p className="text-slate-500 mt-1">{formatBytes(file.size)}</p>
                    </div>
                    <Button 
                      onClick={(e) => { e.stopPropagation(); handleProcess(); }}
                      isLoading={isProcessing}
                      className="w-full max-w-xs"
                      icon={<Zap className="w-4 h-4" />}
                    >
                      Compress Audio
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-500">
                      <Upload className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-xl font-medium text-slate-200">Drop your audio file here</h3>
                      <p className="text-slate-500 mt-1">Supports MP3, WAV, M4A, OGG</p>
                    </div>
                    <span className="inline-block px-4 py-1 rounded-full bg-slate-800 text-slate-400 text-sm">
                      Click to browse
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-8 relative z-10 animate-fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-500/20 rounded-full text-green-400">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Compression Complete!</h2>
                    <p className="text-slate-400 text-sm">Target: MP3 / {processedFile.sampleRate}Hz Mono</p>
                  </div>
                </div>
                <Button variant="secondary" onClick={reset} icon={<RefreshCw className="w-4 h-4" />}>
                  Start Over
                </Button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-950/50 p-6 rounded-2xl border border-slate-800">
                  <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold mb-1">Original Size</p>
                  <p className="text-xl font-mono text-slate-300">{formatBytes(processedFile.originalSize)}</p>
                </div>
                <div className="bg-slate-950/50 p-6 rounded-2xl border border-slate-800 border-l-4 border-l-green-500">
                  <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold mb-1">New Size</p>
                  <p className="text-3xl font-mono text-white">{formatBytes(processedFile.newSize)}</p>
                </div>
                <div className="bg-slate-950/50 p-6 rounded-2xl border border-slate-800">
                  <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold mb-1">Reduction</p>
                  <p className="text-xl font-mono text-green-400">
                    {Math.round((1 - processedFile.newSize / processedFile.originalSize) * 100)}%
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col md:flex-row gap-4">
                <a 
                  href={processedFile.url} 
                  download={processedFile.filename}
                  className="flex-1"
                >
                  <Button className="w-full py-4 text-lg" icon={<Download className="w-5 h-5" />}>
                    Download Compressed MP3
                  </Button>
                </a>
                
                <Button 
                  variant="secondary" 
                  className="flex-1 py-4"
                  onClick={handleVerifyWithGemini}
                  isLoading={isVerifying}
                  icon={<Bot className="w-5 h-5 text-indigo-400" />}
                >
                  Test Quality with Gemini
                </Button>
              </div>

              {/* Transcription Area */}
              {transcription && (
                <div className="bg-slate-950 rounded-xl border border-indigo-500/30 p-6 space-y-3">
                  <div className="flex items-center gap-2 text-indigo-400 mb-2">
                    <Bot className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Gemini 2.5 Flash Verification</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed font-light">
                    "{transcription}"
                  </p>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="mt-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400 text-center text-sm">
              {error}
            </div>
          )}
        </main>

        <footer className="text-center text-slate-600 text-xs">
          <p>Local processing only. Your audio files are processed entirely within your browser.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;