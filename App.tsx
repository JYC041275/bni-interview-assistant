import React, { useState, useRef } from 'react';
import { Upload, FileAudio, Layout, FileText, Image as ImageIcon } from 'lucide-react';
import { BniFormData, INITIAL_FORM_DATA } from './types';
import { RecordForm } from './components/RecordForm';
import { analyzeAudio } from './services/geminiService';
import { exportToWord } from './services/exportToWord';
import { processAudio, shouldCompressAudio } from './services/audioService';
import { CONFIG } from './config';

const UploadPage = ({ fileInputRef, onFileChange }: {
  fileInputRef: React.RefObject<HTMLInputElement>,
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}) => {
  // 優先使用配置中的 API Key，如果沒有則使用 localStorage 中的
  const [geminiKey, setGeminiKey] = React.useState(() => {
    return CONFIG.API_KEY || localStorage.getItem('GEMINI_API_KEY') || '';
  });

  const handleGeminiKeyChange = (value: string) => {
    setGeminiKey(value);
    // 只有在配置中沒有設置 API Key 時才保存到 localStorage
    if (!CONFIG.API_KEY) {
      localStorage.setItem('GEMINI_API_KEY', value);
    }
  };

  // 如果配置中有 API Key，則可以直接上傳
  const isReadyToUpload = !!geminiKey;

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-10 rounded-2xl shadow-xl max-w-lg w-full">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <FileAudio className="w-10 h-10 text-red-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">BNI 入會訪談助手</h1>
        <p className="text-gray-500 mb-8 text-center">上傳會議錄音檔,AI 將自動為您生成逐字稿與會議記錄。</p>

        {/* API Key - 只有在配置允許時才顯示 */}
        {CONFIG.SHOW_API_KEY_INPUT && (
          <>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gemini API Key {CONFIG.API_KEY && '(已配置)'}
              </label>
              <input
                type="text"
                value={geminiKey}
                onChange={(e) => handleGeminiKeyChange(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-sm"
                disabled={!!CONFIG.API_KEY}
              />
            </div>

            {!CONFIG.API_KEY && (
              <p className="text-xs text-gray-500 mb-6">
                您的 API Key 會儲存在瀏覽器中,下次使用時無需重新輸入
              </p>
            )}
          </>
        )}

        <input
          type="file"
          accept="audio/*"
          className="hidden"
          ref={fileInputRef}
          onChange={onFileChange}
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={!isReadyToUpload}
          className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-md disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          <Upload size={24} />
          上傳錄音檔
        </button>
        <p className="mt-4 text-xs text-gray-400 text-center">支援 .mp3, .wav, .m4a 格式</p>
      </div>
    </div>
  );
};

export default function App() {
  const [step, setStep] = useState<'upload' | 'processing' | 'workspace'>('upload');
  const [formData, setFormData] = useState<BniFormData>(INITIAL_FORM_DATA);
  const [summary, setSummary] = useState('');
  const [transcript, setTranscript] = useState('');
  const [activeTab, setActiveTab] = useState<'form' | 'transcript'>('form');
  const [processingMessage, setProcessingMessage] = useState('AI 正在聆聽並分析會議內容...');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 優先使用配置中的 API Key,如果沒有則使用 localStorage 中的
    const apiKey = CONFIG.API_KEY || localStorage.getItem('GEMINI_API_KEY');
    if (!apiKey) {
      alert("請先輸入 Gemini API Key");
      return;
    }

    setStep('processing');
    setProcessingMessage('正在準備分析...');

    try {
      console.log('開始處理音頻文件:', file.name);
      console.log('原始文件大小:', (file.size / 1024 / 1024).toFixed(2), 'MB');

      let processedFile: File = file;

      // 檢查是否需要壓縮
      if (shouldCompressAudio(file)) {
        console.log('文件超過 5MB,開始壓縮...');
        setProcessingMessage(`正在壓縮音頻 (${(file.size / 1024 / 1024).toFixed(2)} MB)...`);

        try {
          // 壓縮音頻到 16kHz
          const { blob, duration } = await processAudio(file, 16000);

          // 將 Blob 轉換為 File
          processedFile = new File(
            [blob],
            file.name.replace(/\.[^/.]+$/, '') + '_compressed.mp3',
            { type: 'audio/mp3' }
          );

          const compressionRatio = ((1 - blob.size / file.size) * 100).toFixed(1);
          console.log('壓縮完成!');
          console.log('壓縮後大小:', (blob.size / 1024 / 1024).toFixed(2), 'MB');
          console.log('壓縮比例:', compressionRatio + '%');
          console.log('音頻時長:', duration.toFixed(1), '秒');

          setProcessingMessage(
            `壓縮完成 (${(file.size / 1024 / 1024).toFixed(1)}MB → ${(blob.size / 1024 / 1024).toFixed(1)}MB, 節省 ${compressionRatio}%)`
          );

          // 等待 1 秒讓用戶看到壓縮結果
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (compressionError: any) {
          console.error('壓縮失敗,使用原始文件:', compressionError);
          setProcessingMessage('壓縮失敗,使用原始文件繼續分析...');
          // 如果壓縮失敗,繼續使用原始文件
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } else {
        console.log('文件小於 5MB,跳過壓縮');
      }

      // 開始 AI 分析
      const result = await analyzeAudio(apiKey, processedFile, (message) => {
        console.log('進度更新:', message);
        setProcessingMessage(message);
      });

      setFormData(prev => ({ ...prev, ...result.formData }));
      setSummary(result.summary);
      setTranscript(result.transcript);
      setStep('workspace');
    } catch (error: any) {
      console.error('處理錯誤:', error);
      alert(`處理音檔時發生錯誤:\n\n${error.message || '請重試'}\n\n請檢查:\n1. API Key 是否正確\n2. 網路連線是否正常\n3. 音頻文件是否完整\n\n詳細錯誤請查看瀏覽器控制台 (F12)`);
      setStep('upload');
    }
  };

  const handleFormChange = (field: keyof BniFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleExportWord = async () => {
    try {
      await exportToWord(formData, summary, transcript);
    } catch (error) {
      console.error('Export failed:', error);
      alert('匯出 Word 文件時發生錯誤，請重試。');
    }
  };

  if (step === 'upload') {
    return <UploadPage fileInputRef={fileInputRef} onFileChange={handleFileUpload} />;
  }

  if (step === 'processing') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mb-6"></div>
        <h2 className="text-2xl font-bold text-gray-800 animate-pulse">{processingMessage}</h2>
        <p className="text-gray-500 mt-2">這可能需要幾分鐘，請勿關閉視窗。</p>
        <p className="text-xs text-gray-400 mt-4">如果超過 5 分鐘沒有回應，請檢查網路連線或重試</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 print:h-auto print:bg-white">
      {/* Header / Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 print:hidden shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center text-white font-bold text-xs mr-3">BNI</div>
                <h1 className="text-lg font-bold text-gray-900">訪談記錄助手</h1>
              </div>
              <div className="ml-10 flex space-x-8">
                <button
                  onClick={() => setActiveTab('form')}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${activeTab === 'form'
                    ? 'border-red-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  <Layout size={16} className="mr-2" />
                  訪談表單
                </button>
                <button
                  onClick={() => setActiveTab('transcript')}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${activeTab === 'transcript'
                    ? 'border-red-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  <FileText size={16} className="mr-2" />
                  逐字稿 & 摘要
                </button>
              </div>
            </div>
            <div className="flex items-center">
              <button
                onClick={handleExportWord}
                className="bg-gray-100 text-gray-600 hover:bg-gray-200 px-4 py-2 rounded-lg font-medium text-sm flex items-center transition-colors"
                title="匯出 Word 文件"
              >
                <FileText size={16} className="mr-2" />
                匯出報告
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto py-8 sm:px-6 lg:px-8 print:p-0 print:max-w-none">

        {/* Form Tab */}
        <div className={`${activeTab === 'form' ? 'block' : 'hidden'} overflow-y-auto max-h-[calc(100vh-8rem)] print:block`}>
          <RecordForm data={formData} onChange={handleFormChange} />
        </div>

        {/* Transcript Tab */}
        <div className={`${activeTab === 'transcript' ? 'block' : 'hidden'} print:hidden bg-white shadow rounded-lg p-8 min-h-[500px]`}>
          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <span className="w-1 h-6 bg-red-600 rounded-full mr-2"></span>
              重點摘要
            </h3>
            <div className="bg-red-50 p-6 rounded-xl text-gray-800 leading-relaxed whitespace-pre-line border border-red-100">
              {summary || "尚無摘要資料"}
            </div>
          </div>

          <hr className="my-8 border-gray-100" />

          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <span className="w-1 h-6 bg-gray-600 rounded-full mr-2"></span>
              詳細逐字稿
            </h3>
            <div className="font-mono text-sm text-gray-600 bg-gray-50 p-6 rounded-xl border border-gray-200 whitespace-pre-wrap leading-relaxed h-[600px] overflow-y-auto">
              {transcript || "尚無逐字稿資料"}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}