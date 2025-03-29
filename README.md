# Google OAuth 登入系統

這是一個使用 Node.js 和 Google OAuth 2.0 實現的簡單登入系統。

## 設置步驟

1. 安裝依賴：
```bash
npm install
```

2. 設置 Google OAuth 憑證：
   - 前往 [Google Cloud Console](https://console.cloud.google.com/)
   - 創建新專案或選擇現有專案
   - 啟用 Google+ API
   - 在憑證頁面創建 OAuth 2.0 客戶端 ID
   - 設置授權重定向 URI 為：`http://localhost:3000/auth/google/callback`
   - 複製客戶端 ID 和客戶端密鑰

3. 配置環境變量：
   - 複製 `.env.example` 為 `.env`
   - 填入您的 Google OAuth 憑證
   - 設置一個隨機的 SESSION_SECRET

4. 運行應用：
```bash
npm run dev
```

5. 訪問 http://localhost:3000 開始使用

## 功能

- Google 帳號登入
- 登出功能
- 顯示用戶信息 