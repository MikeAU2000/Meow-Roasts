# Meow Roasts - AI 貓咪照片評論系統

這是一個結合了 Google OAuth 認證和 AI 技術的貓咪照片評論系統。用戶可以上傳貓咪照片，系統會使用 AI 生成有趣的評論。

## 主要功能

- Google 帳號登入系統
- 貓咪照片上傳功能
- AI 生成照片評論
- 照片存儲和展示
- 響應式網頁設計

## 技術架構

### 後端技術
- Node.js + Express.js
- MongoDB Atlas 數據庫
- Google OAuth 2.0 認證
- Cloudinary 圖片存儲
- OpenAI API 整合

### 前端技術
- HTML5
- CSS3
- JavaScript
- 響應式設計

### 部署平台
- Vercel

## 環境要求

- Node.js (v14 或更高版本)
- MongoDB Atlas 帳號
- Google Cloud Console 帳號
- Cloudinary 帳號
- OpenAI API 密鑰

## 安裝步驟

1. 克隆專案：
```bash
git clone [專案地址]
cd meow-roasts
```

2. 安裝依賴：
```bash
npm install
```

3. 環境配置：
   - 複製 `.env.example` 為 `.env`
   - 配置以下環境變量：
     ```
     MONGODB_URI=你的MongoDB連接字符串
     GOOGLE_CLIENT_ID=你的Google客戶端ID
     GOOGLE_CLIENT_SECRET=你的Google客戶端密鑰
     CLOUDINARY_CLOUD_NAME=你的Cloudinary雲名稱
     CLOUDINARY_API_KEY=你的Cloudinary API密鑰
     CLOUDINARY_API_SECRET=你的Cloudinary API密鑰
     OPENAI_API_KEY=你的OpenAI API密鑰
     ```

4. 本地開發：
```bash
npm run dev
```

5. 生產部署：
```bash
npm start
```

## 專案結構

```
├── public/          # 靜態資源文件
├── routes/          # 路由處理
├── models/          # 數據模型
├── dist/           # 編譯後的文件
├── server.js       # 應用入口
└── vercel.json     # Vercel 配置
```

## 部署說明

### Vercel 部署
1. 將專案推送到 GitHub
2. 在 Vercel 導入專案
3. 配置環境變量
4. 部署完成

### MongoDB Atlas 設置
1. 創建 MongoDB Atlas 帳號
2. 創建新集群
3. 設置數據庫訪問權限
4. 獲取連接字符串

### Cloudinary 設置
1. 創建 Cloudinary 帳號
2. 獲取 API 憑證
3. 配置環境變量

## 安全注意事項

- 請勿提交 `.env` 文件到版本控制
- 定期更新依賴包
- 使用環境變量存儲敏感信息
- 實施適當的 CORS 策略

## 開發團隊

- 後端開發：[Mike Au]
- 前端開發：[Mike Au]

## 授權

MIT License 