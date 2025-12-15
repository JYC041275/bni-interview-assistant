# API Key 安全性指南

本文件說明如何安全地管理 Gemini API Key,以及不同部署方案的優缺點。

## ⚠️ 重要警告

**絕對不要將 API Key 寫死在前端程式碼中!**

任何人都可以透過瀏覽器開發者工具查看您的原始碼,取得 API Key 後無限使用,費用將由您承擔。

## 🔐 安全方案比較

### 方案 A: 使用者自備 API Key (目前方案)

**運作方式:**
- 使用者在應用程式中輸入自己的 Gemini API Key
- API Key 儲存在瀏覽器的 localStorage
- 直接從前端呼叫 Gemini API

**優點:**
- ✅ 不需要架設後端
- ✅ 部署簡單 (GitHub Pages 即可)
- ✅ 您不需要承擔任何 API 費用
- ✅ 使用者完全控制自己的用量

**缺點:**
- ⚠️ 使用者需要自己申請 API Key (門檻較高)
- ⚠️ API Key 暴露在前端 (但只有該使用者自己的)
- ⚠️ 無法統一管理或限制使用量

**適用情境:**
- 內部工具或小團隊使用
- 使用者都有技術背景
- 不想承擔 API 費用

---

### 方案 B: 後端代理 (最安全)

**運作方式:**
```
使用者 → 您的後端伺服器 → Gemini API
```

**實作範例 (Node.js + Express):**

```javascript
// server.js
const express = require('express');
const { GoogleGenAI } = require('@google/genai');
const app = express();

app.use(express.json());

// API Key 儲存在環境變數
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// 代理端點
app.post('/api/analyze-audio', async (req, res) => {
  try {
    const { audioData, mimeType } = req.body;
    
    // 可以在這裡加入使用量限制
    // 例如: 檢查使用者 IP、設定每日上限等
    
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [{
          inlineData: { data: audioData, mimeType }
        }]
      }
    });
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

**環境變數設定 (.env):**
```
GEMINI_API_KEY=your_api_key_here
```

**優點:**
- ✅ API Key 完全隱藏
- ✅ 可以設定使用量限制
- ✅ 可以追蹤每個使用者的用量
- ✅ 可以實作計費系統

**缺點:**
- ⚠️ 需要架設並維護後端伺服器
- ⚠️ 需要承擔所有 API 費用
- ⚠️ 實作複雜度較高

**適用情境:**
- 公開的 SaaS 產品
- 需要嚴格控制成本
- 有後端開發能力

---

### 方案 C: Firebase Functions / Supabase Edge Functions

**運作方式:**
```
使用者 → Edge Function → Gemini API
```

**實作範例 (Firebase Functions):**

```javascript
// functions/index.js
const functions = require('firebase-functions');
const { GoogleGenAI } = require('@google/genai');

exports.analyzeAudio = functions.https.onCall(async (data, context) => {
  // 驗證使用者
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      '需要登入'
    );
  }
  
  const apiKey = functions.config().gemini.key;
  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: data.contents
    });
    
    return result;
  } catch (error) {
    throw new functions.https.HttpsError('internal', error.message);
  }
});
```

**設定 API Key:**
```bash
firebase functions:config:set gemini.key="your_api_key_here"
```

**優點:**
- ✅ 無需管理伺服器
- ✅ 自動擴展
- ✅ 免費額度通常足夠
- ✅ 比自架後端簡單

**缺點:**
- ⚠️ 需要學習 Firebase/Supabase
- ⚠️ 仍需承擔 API 費用
- ⚠️ 有平台鎖定風險

**適用情境:**
- 中小型應用
- 想要簡單的後端方案
- 已經在使用 Firebase/Supabase

---

## 📊 方案選擇建議

| 需求 | 推薦方案 |
|------|---------|
| 內部工具、小團隊 | 方案 A (使用者自備 Key) |
| 公開產品、需要控制成本 | 方案 B (後端代理) |
| 中小型應用、快速上線 | 方案 C (Edge Functions) |

## 🔒 額外安全建議

1. **使用 HTTPS** - 確保所有通訊都經過加密
2. **設定 CORS** - 限制哪些網域可以呼叫您的 API
3. **實作速率限制** - 防止濫用
4. **監控使用量** - 設定警報,避免意外高額費用
5. **定期輪換 API Key** - 降低洩漏風險

## 📝 目前專案狀態

**目前使用:** 方案 A (使用者自備 API Key)

**建議:**
- **短期:** 保持目前方式,適合內部使用
- **長期:** 如果要對外開放,考慮升級到方案 C (Firebase Functions)

## 🚀 升級到 Firebase Functions 的步驟

如果未來想要升級,可以參考以下步驟:

1. 安裝 Firebase CLI
```bash
npm install -g firebase-tools
firebase login
firebase init functions
```

2. 實作 Cloud Function (參考上方範例)

3. 部署
```bash
firebase deploy --only functions
```

4. 更新前端程式碼,改為呼叫 Cloud Function 而非直接呼叫 Gemini API

5. 設定使用者認證 (Firebase Authentication)

---

**需要協助?** 如果您決定要升級到後端代理或 Edge Functions,我可以幫您實作完整的解決方案!
