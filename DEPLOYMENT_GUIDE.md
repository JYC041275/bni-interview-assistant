# BNI 訪談助手 - 部署指南

## 方案一：客戶自行提供 API Key（最簡單）

### 步驟 1: 構建應用
```bash
npm install
npm run build
```

### 步驟 2: 交付給客戶
將 `dist` 資料夾中的所有文件交給客戶。

### 步驟 3: 客戶使用方式
1. 客戶需要有一個 Gemini API Key（可在 https://makersuite.google.com/app/apikey 申請）
2. 打開應用後，在頁面上輸入 API Key
3. API Key 會自動儲存在瀏覽器中，下次使用時無需重新輸入

### 優點
- ✅ 實施簡單
- ✅ 成本由客戶承擔
- ✅ 無需維護後端服務器

### 缺點
- ❌ 客戶需要有 API Key
- ❌ 客戶需要了解如何申請 API Key

---

## 方案二：後端代理服務器（推薦）

### 架構說明
- 前端：客戶直接訪問的網頁應用
- 後端：您部署的服務器，負責轉發 API 請求（API Key 存儲在後端）

### 實施步驟

#### 1. 創建後端服務器

創建 `server/` 目錄和以下文件：

**server/package.json**
```json
{
  "name": "bni-interview-backend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "@google/genai": "^1.33.0"
  }
}
```

**server/server.js**
```javascript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// 允許跨域請求
app.use(cors());
app.use(express.json());

// 從環境變數讀取 API Key
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('錯誤：請設置 GEMINI_API_KEY 環境變數');
  process.exit(1);
}

// 提供靜態文件（前端構建後的 dist 文件）
app.use(express.static(join(__dirname, '../dist')));

// API 端點：分析音頻
app.post('/api/analyze-audio', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '未提供音頻文件' });
    }

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    
    // 將文件轉換為 base64
    const base64Audio = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype;

    const audioPart = {
      inlineData: { data: base64Audio, mimeType: mimeType }
    };

    // 調用 Gemini API
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          audioPart,
          {
            text: `請仔細分析這段 BNI 訪談錄音，並完成以下任務：

1. 提取所有表單欄位資訊（BniFormData）：
   - 表頭資訊：申請日期、引薦人、申請人姓名、公司名稱、統編、職稱、訪談時間、地點、專業類別、訪談委員
   - 23 個訪談問題的詳細回答：每個回答必須詳細完整，包含申請人的具體說明、例子、原因等，不要只寫簡短摘要
   - 其他資訊：網路搜尋資訊、訪談委員意見、引薦人意見

2. 生成會議摘要（summary）：
   - 200-300 字的重點摘要，包含訪談的主要內容和結論

3. 生成詳細逐字稿（transcript）：
   - 包含完整的對話內容，標註說話者（[訪談委員] 或 [申請人]）
   - 盡量完整記錄對話內容

特別注意：
- 對於問題 1-23，必須提供詳細且完整的回答，記錄申請人的完整表達
- 回答時不要使用主語（不要用「我」、「我的」等第一人稱），直接陳述內容，語氣自然流暢
- 不要使用「申請人說」、「申請人表示」等第三人稱描述
- 如果資訊未明確提及，直接留空（空字串 ""），不要寫「未明確提及」、「未提到」等字樣
- 對於問題 5（出席規定說明）和問題 19（費用說明），要記錄申請人對規則的理解和確認，同樣不使用主語
- 如果申請人提到具體數字、時間、地點、例子等，務必完整記錄
- 回答要使用繁體中文
            `
          }
        ]
      },
      config: {
        systemInstruction: `你是一位專業的 BNI（Business Network International）分會秘書。
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

嚴格遵循提供的 JSON 架構。`,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            formData: {
              type: "object",
              properties: {
                applicationDate: { type: "string" },
                introducer: { type: "string" },
                applicantName: { type: "string" },
                companyName: { type: "string" },
                taxId: { type: "string" },
                jobTitle: { type: "string" },
                interviewDate: { type: "string" },
                location: { type: "string" },
                category: { type: "string" },
                interviewer: { type: "string" },
                webSearchInfo: { type: "string" },
                interviewerOpinion: { type: "string" },
                introducerOpinion: { type: "string" },
                q1_motivation: { type: "string" },
                q2_advantage: { type: "string" },
                q3_expectation: { type: "string" },
                q4_attendance_commitment: { type: "string" },
                q5_attendance_rules_check: { type: "string" },
                q6_substitute_availability: { type: "string" },
                q7_invite_guest: { type: "string" },
                q8_special_events: { type: "string" },
                q9_business_verification: { type: "string" },
                q10_industry_background: { type: "string" },
                q11_client_source: { type: "string" },
                q12_team_status: { type: "string" },
                q13_favorite_part: { type: "string" },
                q14_previous_bni: { type: "string" },
                q15_other_organizations: { type: "string" },
                q16_training_commitment: { type: "string" },
                q17_one_to_one: { type: "string" },
                q18_leadership_role: { type: "string" },
                q19_fees_awareness: { type: "string" },
                q20_non_refundable: { type: "string" },
                q21_induction_ceremony: { type: "string" },
                q22_member_questions: { type: "string" },
                q23_system_questions: { type: "string" },
                photos: { type: "array", items: { type: "string" } }
              }
            },
            summary: { type: "string" },
            transcript: { type: "string" }
          }
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("AI 未返回有效回應");
    }

    const result = JSON.parse(text);
    res.json(result);
  } catch (error) {
    console.error('分析音頻錯誤:', error);
    res.status(500).json({ 
      error: '分析音頻時發生錯誤', 
      message: error.message 
    });
  }
});

// 所有其他路由都返回前端應用
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, '../dist/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`服務器運行在 http://localhost:${PORT}`);
  console.log(`請確保已設置 GEMINI_API_KEY 環境變數`);
});
```

**server/.env**
```
GEMINI_API_KEY=您的_Gemini_API_Key
PORT=3000
```

#### 2. 修改前端代碼

需要修改 `App.tsx` 中的 `handleFileUpload` 函數，讓它調用後端 API 而不是直接調用 Gemini。

#### 3. 部署後端服務器

可以部署到：
- **Vercel**（推薦，免費）
- **Railway**
- **Heroku**
- **自己的服務器**

#### 4. 構建和部署

```bash
# 構建前端
npm run build

# 部署後端（根據您選擇的平台）
# 例如使用 Vercel：
vercel --prod
```

### 優點
- ✅ 客戶無需知道 API Key
- ✅ 可以控制使用量和成本
- ✅ 更安全

### 缺點
- ❌ 需要維護後端服務器
- ❌ 需要承擔 API 成本

---

## 方案三：打包成桌面應用（Electron）

### 實施步驟

1. 安裝 Electron
2. 創建 Electron 配置
3. 將 API Key 內置在應用中（或讓用戶輸入）
4. 打包成 .exe（Windows）或 .dmg（Mac）

### 優點
- ✅ 客戶直接使用，無需瀏覽器
- ✅ 可以內置 API Key

### 缺點
- ❌ 需要考慮 API 成本
- ❌ 打包文件較大
- ❌ 需要為不同平台打包

---

## 推薦方案

**如果客戶有技術能力**：使用方案一（客戶自己提供 API Key）

**如果客戶沒有 API Key 且您願意承擔成本**：使用方案二（後端代理服務器）

**如果需要離線使用**：使用方案三（Electron 桌面應用）

---

## 成本估算

Gemini API 的定價（2024年）：
- Gemini 2.5 Flash：約 $0.075 / 1M tokens（輸入），$0.30 / 1M tokens（輸出）
- 一個 60 分鐘的訪談錄音約需要 100K-500K tokens
- 估算：每次訪談約 $0.01 - $0.05 USD

如果客戶每月處理 20 次訪談，成本約 $0.20 - $1.00 USD/月

