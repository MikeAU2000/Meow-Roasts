require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth');
const uploadRoutes = require('./routes/upload');

const app = express();

// MongoDB 連接
mongoose.set('strictQuery', false);
mongoose.connect(process.env.MONGODB_URI, {
    serverApi: {
        version: '1',
        strict: true,
        deprecationErrors: true,
    }
})
.then(() => {
    console.log('✅ MongoDB Atlas Connected');
    // 測試數據庫連接
    mongoose.connection.db.admin().command({ ping: 1 })
        .then(() => console.log("Pinged your deployment. You successfully connected to MongoDB!"))
        .catch(err => console.error('Database ping failed:', err));
})
.catch((err) => {
    console.error('❌ MongoDB Atlas Connection Error:', err);
    console.error('Error details:', err.message);
    if (err.name === 'MongoServerSelectionError') {
        console.log('請確保：');
        console.log('1. MongoDB Atlas 的 Network Access 已允許您的IP地址');
        console.log('2. 用戶名和密碼正確');
        console.log('3. 連接字符串格式正確');
    }
});

// 監聽連接事件
mongoose.connection.on('connected', () => {
    console.log('Mongoose connected to MongoDB Atlas');
});

mongoose.connection.on('error', (err) => {
    console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('Mongoose disconnected from MongoDB Atlas');
});

// 優雅關閉連接
process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('MongoDB connection closed through app termination');
    process.exit(0);
});

// 中間件
app.use(express.json());
app.use(cookieParser());
app.use(express.static('public')); // 添加靜態文件服務
app.use('/cat_photos', express.static('cat_photo')); // 修改為正確的目錄名稱

// 路由
app.use('/auth', authRoutes);
app.use('/upload', uploadRoutes);

// 首頁
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>懶貓評論家 - 登入</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                body {
                    font-family: 'Helvetica Neue', Arial, sans-serif;
                    min-height: 100vh;
                    display: flex;
                    background-color: #f8f9fa;
                }

                .split-container {
                    display: flex;
                    width: 100%;
                    height: 100vh;
                }

                .left-side {
                    flex: 1;
                    position: relative;
                    overflow: hidden;
                }

                .left-side img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(
                        rgba(0, 0, 0, 0.3),
                        rgba(0, 0, 0, 0.1)
                    );
                }

                .right-side {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    padding: 40px;
                    background-color: white;
                }

                .login-container {
                    width: 100%;
                    max-width: 400px;
                    text-align: center;
                }

                h1 {
                    font-size: 2.5em;
                    color: #333;
                    margin-bottom: 30px;
                    font-weight: bold;
                }

                .subtitle {
                    color: #666;
                    margin-bottom: 40px;
                    font-size: 1.1em;
                    line-height: 1.6;
                }

                .login-btn {
                    display: inline-flex;
                    align-items: center;
                    padding: 12px 24px;
                    background-color: #4285f4;
                    color: white;
                    text-decoration: none;
                    border-radius: 8px;
                    font-weight: 500;
                    font-size: 1.1em;
                    transition: all 0.3s ease;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                }

                .login-btn:hover {
                    background-color: #357abd;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
                }

                .login-btn img {
                    width: 24px;
                    height: 24px;
                    margin-right: 12px;
                }

                .cat-quote {
                    position: absolute;
                    bottom: 40px;
                    left: 40px;
                    color: white;
                    font-size: 1.5em;
                    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
                }
            </style>
        </head>
        <body>
            <div class="split-container">
                <div class="left-side">
                    <img src="/images/test_cat.jpg" alt="懶貓">
                    <div class="overlay"></div>
                    <div class="cat-quote">
                        "生活就該慢慢來，像貓一樣優雅自在"
                    </div>
                </div>
                <div class="right-side">
                    <div class="login-container">
                        <h1>懶貓評論家</h1>
                        <p class="subtitle">
                            加入我們的貓咪社群，分享您的寵物生活點滴，
                            <br>與其他貓奴交流心得。
                        </p>
                        <a href="/auth/google" class="login-btn">
                            <img src="https://www.google.com/favicon.ico" alt="Google Logo">
                            使用 Google 帳號登入
                        </a>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`服務器運行在 http://localhost:${PORT}`);
}); 