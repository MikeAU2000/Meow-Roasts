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

// 錯誤處理中間件
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message });
});

// 404 處理
app.use((req, res) => {
  console.log('404 Not Found:', req.url);
  res.status(404).json({ error: 'Not Found' });
});

// 首頁
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 設置端口
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
}); 