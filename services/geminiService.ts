import { GoogleGenAI, Type } from "@google/genai";
import { BniFormData } from "../types";

// Helper to convert file to base64
export const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

const SYSTEM_INSTRUCTION = `
你是一位專業的 BNI（Business Network International）分會秘書。
你的任務是仔細聆聽訪談委員與申請人之間的訪談錄音，並提取詳細資訊來填寫「會員申請入會訪談表」。

重要要求：
1. 仔細聆聽每一段對話，提取完整的資訊
2. 對於表單中的 23 個問題，必須提供詳細且完整的回答，不要只寫簡短的摘要
3. 如果申請人提供了具體的例子、數字、時間、地點等細節，務必完整記錄
4. 對於申請人的動機、期望、優勢等問題，要記錄完整的表達，包括具體原因和說明
5. 提取表頭資訊：姓名、公司、日期、地點、專業類別等
6. 如果資訊未明確提及，可以根據上下文合理推斷，或留空

回答格式要求：
- 使用繁體中文
- 每個問題的回答應該詳細完整，至少 50-200 字（視問題而定）
- 回答時不要使用主語（不要用「我」、「我的」等第一人稱），直接陳述內容，語氣自然流暢
- 不要使用「申請人說」、「申請人表示」等第三人稱描述
- 如果資訊未明確提及，直接留空（空字串 ""），不要寫「未明確提及」、「未提到」等字樣
- 保留申請人的原始意圖和表達方式，讓回答聽起來自然真實
- 對於規則說明類問題（如問題 5、問題 19），要記錄申請人的理解和確認，同樣不使用主語

嚴格遵循提供的 JSON 架構。
`;

export const analyzeAudio = async (
  apiKey: string,
  audioFile: File,
  onProgress?: (message: string) => void
): Promise<{ formData: BniFormData, summary: string, transcript: string }> => {
  console.log('[analyzeAudio] 開始分析音頻');
  console.log('[analyzeAudio] 文件名稱:', audioFile.name);
  console.log('[analyzeAudio] 文件大小:', (audioFile.size / 1024 / 1024).toFixed(2), 'MB');
  console.log('[analyzeAudio] 文件類型:', audioFile.type);

  try {
    onProgress?.('正在初始化 AI 模型...');
    const ai = new GoogleGenAI({ apiKey });

    onProgress?.('正在處理音頻文件...');
    const audioPart = await fileToGenerativePart(audioFile);
    console.log('[analyzeAudio] 音頻已轉換為 base64');

    const model = "gemini-2.5-flash";

    onProgress?.('正在發送請求到 Gemini API...');
    console.log('[analyzeAudio] 使用模型:', model);

    // 創建超時 Promise (5 分鐘)
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('處理超時:音頻分析超過 5 分鐘。請嘗試使用較短的音頻文件,或檢查網路連線。'));
      }, 5 * 60 * 1000); // 5 分鐘
    });

    // 創建 API 請求 Promise
    const apiPromise = ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          audioPart,
          {
            text: `請仔細分析這段 BNI 訪談錄音,並完成以下任務:

1. 提取所有表單欄位資訊(BniFormData):
   - 表頭資訊:申請日期、引薦人、申請人姓名、公司名稱、統編、職稱、訪談時間、地點、專業類別、訪談委員
   - 23 個訪談問題的詳細回答:每個回答必須詳細完整,包含申請人的具體說明、例子、原因等,不要只寫簡短摘要
   - 其他資訊:網路搜尋資訊、訪談委員意見、引薦人意見

2. 生成會議摘要(summary):
   - 200-300 字的重點摘要,包含訪談的主要內容和結論

3. 生成詳細逐字稿(transcript):
   - 包含完整的對話內容,標註說話者([訪談委員] 或 [申請人])
   - 盡量完整記錄對話內容

特別注意:
- 對於問題 1-23,必須提供詳細且完整的回答,記錄申請人的完整表達
- 回答時不要使用主語(不要用「我」、「我的」等第一人稱),直接陳述內容,語氣自然流暢
- 不要使用「申請人說」、「申請人表示」等第三人稱描述
- 如果資訊未明確提及,直接留空(空字串 ""),不要寫「未明確提及」、「未提到」等字樣
- 對於問題 5(出席規定說明)和問題 19(費用說明),要記錄申請人對規則的理解和確認,同樣不使用主語
- 如果申請人提到具體數字、時間、地點、例子等,務必完整記錄
- 回答要使用繁體中文
          `
          }
        ]
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            formData: {
              type: Type.OBJECT,
              properties: {
                applicationDate: { type: Type.STRING },
                introducer: { type: Type.STRING },
                applicantName: { type: Type.STRING },
                companyName: { type: Type.STRING },
                taxId: { type: Type.STRING },
                jobTitle: { type: Type.STRING },
                interviewDate: { type: Type.STRING },
                location: { type: Type.STRING },
                category: { type: Type.STRING },
                interviewer: { type: Type.STRING },
                webSearchInfo: { type: Type.STRING },
                interviewerOpinion: { type: Type.STRING },
                introducerOpinion: { type: Type.STRING },
                q1_motivation: { type: Type.STRING },
                q2_advantage: { type: Type.STRING },
                q3_expectation: { type: Type.STRING },
                q4_attendance_commitment: { type: Type.STRING },
                q5_attendance_rules_check: { type: Type.STRING },
                q6_substitute_availability: { type: Type.STRING },
                q7_invite_guest: { type: Type.STRING },
                q8_special_events: { type: Type.STRING },
                q9_business_verification: { type: Type.STRING },
                q10_industry_background: { type: Type.STRING },
                q11_client_source: { type: Type.STRING },
                q12_team_status: { type: Type.STRING },
                q13_favorite_part: { type: Type.STRING },
                q14_previous_bni: { type: Type.STRING },
                q15_other_organizations: { type: Type.STRING },
                q16_training_commitment: { type: Type.STRING },
                q17_one_to_one: { type: Type.STRING },
                q18_leadership_role: { type: Type.STRING },
                q19_fees_awareness: { type: Type.STRING },
                q20_non_refundable: { type: Type.STRING },
                q21_induction_ceremony: { type: Type.STRING },
                q22_member_questions: { type: Type.STRING },
                q23_system_questions: { type: Type.STRING },
              }
            },
            summary: { type: Type.STRING },
            transcript: { type: Type.STRING }
          }
        }
      }
    });

    onProgress?.('AI 正在分析音頻內容,這可能需要幾分鐘...');

    // 使用 Promise.race 實現超時
    const response = await Promise.race([apiPromise, timeoutPromise]);
    console.log('[analyzeAudio] 收到 API 回應');

    const text = response.text;
    if (!text) {
      console.error('[analyzeAudio] API 未返回有效回應');
      throw new Error("AI 未返回有效回應,請重試");
    }

    console.log('[analyzeAudio] 回應長度:', text.length, '字元');
    onProgress?.('正在解析結果...');

    const result = JSON.parse(text);
    console.log('[analyzeAudio] 分析完成');
    return result;

  } catch (error: any) {
    console.error('[analyzeAudio] 錯誤:', error);
    console.error('[analyzeAudio] 錯誤堆疊:', error.stack);

    // 提供更詳細的錯誤訊息
    if (error.message?.includes('超時')) {
      throw error;
    } else if (error.message?.includes('API key')) {
      throw new Error('API Key 無效或已過期,請檢查您的 Gemini API Key');
    } else if (error.message?.includes('quota')) {
      throw new Error('API 配額已用盡,請稍後再試或檢查您的 Google Cloud 配額');
    } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
      throw new Error('網路連線錯誤,請檢查您的網路連線');
    } else {
      throw new Error(`分析音頻時發生錯誤: ${error.message || '未知錯誤'}`);
    }
  }
};

export const chatWithContext = async (apiKey: string, history: any[], newMessage: string, context: string) => {
  const ai = new GoogleGenAI({ apiKey });
  const model = "gemini-2.5-flash";

  const chat = ai.chats.create({
    model: model,
    config: {
      systemInstruction: `You are a helpful assistant analyzing a BNI meeting transcript.
      Use the provided transcript/summary context to answer user questions.
      Context: ${context}`
    },
    history: history
  });

  const result = await chat.sendMessage({ message: newMessage });
  return result.text;
}
