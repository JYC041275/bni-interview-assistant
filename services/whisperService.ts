import OpenAI from 'openai';

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB in bytes

export const transcribeAudio = async (apiKey: string, audioFile: File): Promise<string> => {
    const openai = new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true
    });

    // 檢查檔案大小
    if (audioFile.size > MAX_FILE_SIZE) {
        const sizeMB = (audioFile.size / 1024 / 1024).toFixed(2);
        throw new Error(
            `音檔大小 ${sizeMB}MB 超過 Whisper API 的 25MB 限制。\n\n` +
            `建議解決方案：\n` +
            `1. 使用 Gemini 模型（無檔案大小限制）\n` +
            `2. 使用音訊編輯軟體（如 Audacity）壓縮音檔\n` +
            `3. 降低音檔的位元率或取樣率`
        );
    }

    try {
        const transcription = await openai.audio.transcriptions.create({
            file: audioFile,
            model: "whisper-1",
            language: "zh",
            response_format: "verbose_json",
            timestamp_granularities: ["segment"]
        });

        let fullTranscript = "";

        if (transcription.segments) {
            transcription.segments.forEach((segment: any, index: number) => {
                const speakerLabel = index % 2 === 0 ? "[訪談委員]" : "[申請人]";
                fullTranscript += `${speakerLabel}: ${segment.text}\n`;
            });
        } else {
            fullTranscript = transcription.text || "";
        }

        return fullTranscript;
    } catch (error: any) {
        console.error('Whisper transcription error:', error);
        throw new Error(`音檔轉錄失敗: ${error.message || '未知錯誤'}`);
    }
};
