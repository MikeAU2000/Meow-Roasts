# Google OAuth 登入示例

這是一個使用 Express.js 和 Passport.js 實現 Google OAuth 登入的示例項目。

## 功能特點

- Google OAuth 2.0 登入
- JWT token 認證
- 受保護的路由
- 登出功能

## 安裝步驟

1. 克隆項目：
```bash
git clone <repository-url>
cd google-oauth-example
```

2. 安裝依賴：
```bash
npm install
```

3. 配置環境變量：
   - 複製 `.env.example` 到 `.env`
   - 在 [Google Cloud Console](https://console.cloud.google.com) 創建項目
   - 獲取 OAuth 2.0 憑證（Client ID 和 Client Secret）
   - 更新 `.env` 文件中的配置

4. 運行項目：
```bash
npm run dev
```

## 使用方法

1. 訪問 `http://localhost:3000/login`
2. 點擊 "使用 Google 帳號登入" 按鈕
3. 選擇 Google 帳號並授權
4. 登入成功後會重定向到指定頁面

## 環境變量說明

- `GOOGLE_CLIENT_ID`: Google OAuth Client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth Client Secret
- `HOST`: 應用主機地址（例如：http://localhost:3000）
- `PORT`: 應用端口
- `NODE_ENV`: 運行環境（development/production）
- `SESSION_SECRET`: Session 加密密鑰
- `JWT_SECRET`: JWT token 加密密鑰

## 注意事項

1. 確保在 Google Cloud Console 中設置了正確的重定向 URI：
   - `http://localhost:3000/auth/google/callback`（開發環境）
   - `https://your-domain.com/auth/google/callback`（生產環境）

2. 在生產環境中：
   - 使用強密碼作為 SESSION_SECRET 和 JWT_SECRET
   - 啟用 HTTPS
   - 設置適當的 CORS 策略 