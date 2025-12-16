import React, { useState, useRef } from 'react';
import { Upload, FileAudio, Layout, FileText, Image as ImageIcon } from 'lucide-react';
import { BniFormData, INITIAL_FORM_DATA, TokenUsage } from './types';
import { RecordForm } from './components/RecordForm';
import { analyzeAudio } from './services/geminiService';
import { exportToWord } from './services/exportToWord';
import { processAudio, shouldCompressAudio } from './services/audioService';
import { CONFIG } from './config';
import { TokenUsageDisplay } from './components/TokenUsageDisplay';

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
  const [currentUsage, setCurrentUsage] = useState<TokenUsage | undefined>(undefined);
  const [currentModelName, setCurrentModelName] = useState<string | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<'form' | 'transcript'>('form');
  const [processingMessage, setProcessingMessage] = useState('AI 正在聆聽並分析會議內容...');
  const [processingProgress, setProcessingProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 檢查文件類型
    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/x-m4a', 'audio/mp4', 'audio/aac', 'audio/ogg', 'audio/webm'];
    // 某些瀏覽器可能無法正確識別 m4a，所以也允許空類型或 application/octet-stream，並通過副檔名檢查
    const isValidType = validTypes.includes(file.type) ||
      file.name.toLowerCase().endsWith('.m4a') ||
      file.name.toLowerCase().endsWith('.mp3') ||
      file.name.toLowerCase().endsWith('.wav');

    if (!isValidType) {
      alert('不支援的文件格式。請上傳 MP3, WAV 或 M4A 文件。');
      return;
    }

    // 檢查文件大小 (初始限制放寬到 60MB，因為會進行壓縮)
    if (file.size > 60 * 1024 * 1024) {
      alert('原始文件過大。請上傳小於 60MB 的音頻文件。\n(我們會協助壓縮，但原始檔太大會導致瀏覽器崩潰)');
      return;
    }

    // 獲取 API Key
    const apiKey = CONFIG.API_KEY || localStorage.getItem('GEMINI_API_KEY');
    if (!apiKey) {
      alert('請先輸入 Gemini API Key');
      setStep('upload');
      return;
    }

    setStep('processing');
    setProcessingMessage('準備處理音頻...');
    setProcessingProgress(0);

    try {
      console.log('開始處理音頻文件:', file.name);
      console.log('原始文件大小:', (file.size / 1024 / 1024).toFixed(2), 'MB');

      // 階段 1: 準備 (0-10%)
      setProcessingProgress(5);
      await new Promise(resolve => setTimeout(resolve, 300));
      setProcessingProgress(10);

      let processedFile: File = file;

      // 階段 2: 壓縮 (10-30%)
      if (shouldCompressAudio(file)) {
        console.log('文件超過 5MB,開始壓縮...');
        setProcessingMessage(`正在壓縮音頻 (${(file.size / 1024 / 1024).toFixed(2)} MB)...`);
        setProcessingProgress(15);

        // 檢查 lamejs 是否加載
        if (!(window as any).lamejs) {
          console.warn('lamejs not loaded');
          setProcessingMessage('壓縮元件未加載，將嘗試使用原始文件...');
          await new Promise(resolve => setTimeout(resolve, 1500));
        }

        try {
          // 壓縮音頻到 16kHz
          const { blob, duration } = await processAudio(file, 16000);

          setProcessingProgress(25);

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

          setProcessingProgress(30);
          setProcessingMessage(
            `壓縮完成 (${(file.size / 1024 / 1024).toFixed(1)}MB → ${(blob.size / 1024 / 1024).toFixed(1)}MB, 節省 ${compressionRatio}%)`
          );

          // 等待 1 秒讓用戶看到壓縮結果
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (compressionError: any) {
          console.error('壓縮失敗,使用原始文件:', compressionError);
          setProcessingProgress(30);
          setProcessingMessage('壓縮失敗 (可能是網路阻擋元件載入), 將使用原始文件繼續分析...');
          // 如果壓縮失敗,繼續使用原始文件
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } else {
        console.log('文件小於 5MB,跳過壓縮');
        setProcessingMessage('文件小於 5MB，跳過壓縮步驟...');
        setProcessingProgress(30);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // 最終檢查：壓縮後是否小於 20MB (Gemini API 限制)
      if (processedFile.size > 20 * 1024 * 1024) {
        throw new Error(`壓縮後文件仍過大 (${(processedFile.size / 1024 / 1024).toFixed(2)} MB)。\nGemini API 限制單次上傳最大 20MB。\n請嘗試使用較短的錄音或更低畫質的錄音檔。`);
      }

      // 階段 3: AI 分析 (30-90%)
      setProcessingProgress(35);
      setProcessingMessage('AI 正在聆聽並分析會議內容...\n這可能需要 1-2 分鐘，請耐心等待');

      const result = await analyzeAudio(apiKey, processedFile, (message) => {
        console.log('進度更新:', message);
        setProcessingMessage(message);

        // 根據訊息更新進度
        if (message.includes('初始化')) {
          setProcessingProgress(40);
        } else if (message.includes('處理音頻')) {
          setProcessingProgress(45);
        } else if (message.includes('發送請求')) {
          setProcessingProgress(50);
        } else if (message.includes('分析')) {
          setProcessingProgress(60);
        } else if (message.includes('解析')) {
          setProcessingProgress(85);
        }
      });

      // 階段 4: 完成 (90-100%)
      setProcessingProgress(90);
      setProcessingMessage('正在整理結果...');
      await new Promise(resolve => setTimeout(resolve, 500));

      if (result) {
        setProcessingProgress(95);
        setFormData(prev => ({ ...prev, ...result.formData }));
        setSummary(result.summary);
        setTranscript(result.transcript);

        // 更新 Token 使用量和模型名稱
        if (result.tokenUsage) {
          setCurrentUsage(result.tokenUsage);
        }
        if (result.modelName) {
          setCurrentModelName(result.modelName);
        }

        setProcessingProgress(100);
        setProcessingMessage('分析完成!');
        await new Promise(resolve => setTimeout(resolve, 500));

        setStep('workspace');
      }
    } catch (error: any) {
      console.error('處理錯誤:', error);
      alert(`處理音檔時發生錯誤:\n\n${error.message || '請重試'}\n\n請檢查:\n1. API Key 是否正確\n2. 網路連線是否正常\n3. 音頻文件是否完整\n\n詳細錯誤請查看瀏覽器控制台 (F12)`);
      setStep('upload');
      setProcessingProgress(0);
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-red-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-2xl w-full">
          {/* 進度百分比 */}
          <div className="text-center mb-6">
            <div className="text-6xl font-bold text-red-600 mb-2">
              {processingProgress}%
            </div>
            <h2 className="text-xl font-bold text-gray-800">
              {processingMessage}
            </h2>
          </div>

          {/* 進度條 */}
          <div className="relative w-full h-4 bg-gray-200 rounded-full overflow-hidden mb-6">
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-red-500 to-red-600 transition-all duration-500 ease-out"
              style={{ width: `${processingProgress}%` }}
            >
              <div className="absolute inset-0 bg-white opacity-20 animate-pulse"></div>
            </div>
          </div>

          {/* 階段指示器 */}
          <div className="flex justify-between text-xs text-gray-500 mb-8">
            <div className={`flex flex-col items-center ${processingProgress >= 10 ? 'text-red-600 font-semibold' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${processingProgress >= 10 ? 'bg-red-600 text-white' : 'bg-gray-200'}`}>
                {processingProgress >= 10 ? '✓' : '1'}
              </div>
              <span>準備</span>
            </div>
            <div className={`flex flex-col items-center ${processingProgress >= 30 ? 'text-red-600 font-semibold' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${processingProgress >= 30 ? 'bg-red-600 text-white' : 'bg-gray-200'}`}>
                {processingProgress >= 30 ? '✓' : '2'}
              </div>
              <span>壓縮</span>
            </div>
            <div className={`flex flex-col items-center ${processingProgress >= 50 ? 'text-red-600 font-semibold' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${processingProgress >= 50 ? 'bg-red-600 text-white' : 'bg-gray-200'}`}>
                {processingProgress >= 50 ? '✓' : '3'}
              </div>
              <span>分析</span>
            </div>
            <div className={`flex flex-col items-center ${processingProgress >= 90 ? 'text-red-600 font-semibold' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${processingProgress >= 90 ? 'bg-red-600 text-white' : 'bg-gray-200'}`}>
                {processingProgress >= 90 ? '✓' : '4'}
              </div>
              <span>完成</span>
            </div>
          </div>

          {/* 提示訊息 */}
          <div className="text-center space-y-2">
            <p className="text-gray-600">這可能需要幾分鐘,請勿關閉視窗。</p>
            <p className="text-xs text-gray-400">如果超過 5 分鐘沒有回應,請檢查網路連線或重試</p>
          </div>
        </div>
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

        {/* Token Usage Display */}
        <div className="mb-6 print:hidden">
          <TokenUsageDisplay currentUsage={currentUsage} modelName={currentModelName} />
        </div>

        {/* Form Tab */}
        <div className={`${activeTab === 'form' ? 'block' : 'hidden'} print:block`}>
          <RecordForm data={formData} onChange={handleFormChange} />
        </div>

        {/* Transcript Tab */}
        <div className={`${activeTab === 'transcript' ? 'block' : 'hidden'} print:hidden bg-white shadow rounded-lg p-8 mb-8`}>
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

          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <span className="w-1 h-6 bg-gray-600 rounded-full mr-2"></span>
              詳細逐字稿
            </h3>
            <div className="font-mono text-sm text-gray-600 bg-gray-50 p-6 pb-8 rounded-xl border border-gray-200 whitespace-pre-wrap leading-relaxed max-h-[600px] overflow-y-auto">
              {transcript || "尚無逐字稿資料"}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}