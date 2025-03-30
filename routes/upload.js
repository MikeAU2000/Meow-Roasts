require('dotenv').config();
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v2: cloudinary } = require('cloudinary');
const OpenAI = require('openai');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Photo = require('../models/Photo');

// JWT 驗證中間件
const authenticateJWT = (req, res, next) => {
    const token = req.cookies.token;
    
    if (token) {
        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                console.error('JWT Verification Error:', err);
                req.user = null;
            } else {
                req.user = decoded;
            }
            next();
        });
    } else {
        req.user = null;
        next();
    }
};

// 初始化 OpenAI
const openai = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENAI_API_KEY,
    defaultHeaders: {
        'HTTP-Referer': process.env.HOST || 'http://localhost:3000',
        'X-Title': 'Lazy Cat Project',
    },
});

// Cloudinary 配置
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_URL.split('://')[1].split(':')[0],
    api_secret: process.env.CLOUDINARY_URL.split(':')[2].split('@')[0]
});

// 配置 multer 存儲
const storage = multer.memoryStorage(); // 改用記憶體存儲

const upload = multer({ 
    storage: storage,
    fileFilter: function (req, file, cb) {
        // 支持更多图片格式
        const filetypes = /jpeg|jpg|png|gif|webp|heic|heif/;
        const mimetype = filetypes.test(file.mimetype.toLowerCase());
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        console.log('文件类型检查:', {
            originalname: file.originalname,
            mimetype: file.mimetype,
            extname: path.extname(file.originalname).toLowerCase(),
            mimetypeMatch: mimetype,
            extnameMatch: extname
        });

        if (mimetype || extname) {
            return cb(null, true);
        }
        cb(new Error('只允許上傳 JPG、PNG、GIF、WebP、HEIC 和 HEIF 格式的圖片！'));
    },
    limits: {
        fileSize: 10 * 1024 * 1024 // 限制文件大小为 10MB
    }
});

// 获取预设图片URL的函数
async function getDefaultPhotos() {
    return [
        '/cat_photo/default_cat.jpg',
        '/cat_photo/cat.jpg',
        '/cat_photo/test_cat.jpg',
        '/cat_photo/photo-1514888286974-6c03e2ca1dba.jpg',
        '/cat_photo/kitten-playing.gif'
    ];
}

// 修改上传页面路由
router.get('/', authenticateJWT, async (req, res) => {
    // 如果用戶未登入，重定向到登入頁面
    if (!req.user) {
        return res.redirect('/auth/google');
    }

    // 获取预设图片
    const defaultPhotos = await getDefaultPhotos();
    
    // 將預設圖片轉換為安全的 JavaScript 字符串
    const defaultPhotosJS = JSON.stringify(defaultPhotos)
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/"/g, '\\"');
    
    // 在HTML中注入預設圖片數組
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Meow Roast - 貓咪吐槽大師</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&display=swap">
            <script>
                // 在全局作用域中定義預設圖片
                window.defaultImages = ${JSON.stringify(defaultPhotos)};
            </script>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                body {
                    font-family: 'Noto Sans TC', sans-serif;
                    background-color: #f0f2f5;
                    color: #333;
                    line-height: 1.6;
                }

                .header {
                    background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
                    color: white;
                    padding: 1rem 2rem;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                }

                .header-content {
                    max-width: 1000px;
                    margin: 0 auto;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .logo {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .logo h1 {
                    font-size: 1.5rem;
                    font-weight: 700;
                }

                .logo-icon {
                    font-size: 1.8rem;
                }

                .user-profile {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .user-avatar {
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    border: 2px solid rgba(255, 255, 255, 0.8);
                    object-fit: cover;
                }

                .main-container {
                    max-width: 1000px;
                    margin: 2rem auto;
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 5px 20px rgba(0, 0, 0, 0.05);
                    overflow: hidden;
                    min-height: 75vh;
                }

                .content-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    height: 100%;
                }

                .upload-section, .result-section {
                    padding: 2rem;
                }

                .upload-section {
                    border-right: 1px solid #f0f0f0;
                }

                .section-title {
                    font-size: 1.2rem;
                    font-weight: 700;
                    margin-bottom: 1.5rem;
                    color: #333;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .section-title i {
                    color: #6a11cb;
                }

                .upload-area {
                    border: 2px dashed #d1d5db;
                    border-radius: 12px;
                    padding: 2rem;
                    text-align: center;
                    margin-bottom: 1.5rem;
                    background-color: #f9fafb;
                    transition: all 0.3s ease;
                    cursor: pointer;
                    min-height: 450px;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                }

                .upload-area:hover, .upload-area.dragover {
                    border-color: #6a11cb;
                    background-color: rgba(106, 17, 203, 0.05);
                }

                .upload-icon {
                    font-size: 3rem;
                    color: #6a11cb;
                    margin-bottom: 1rem;
                }

                .upload-text {
                    font-size: 1rem;
                    color: #6b7280;
                    margin-bottom: 1rem;
                }

                .btn {
                    display: inline-block;
                    padding: 0.6rem 1.2rem;
                    border-radius: 8px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    border: none;
                    outline: none;
                    font-size: 0.9rem;
                }

                .btn-primary {
                    background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
                    color: white;
                    box-shadow: 0 4px 10px rgba(106, 17, 203, 0.3);
                }

                .btn-primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 15px rgba(106, 17, 203, 0.4);
                }

                .btn-full {
                    width: 100%;
                    padding: 0.8rem;
                }

                #fileInput {
                    display: none;
                }

                .preview-container {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 1rem;
                    position: relative;
                    height: 400px;
                }

                .nav-btn {
                    position: absolute;
                    top: 50%;
                    transform: translateY(-50%);
                    background: rgba(0, 0, 0, 0.5);
                    color: white;
                    border: none;
                    border-radius: 50%;
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    z-index: 2;
                }

                .nav-btn:hover {
                    background: rgba(0, 0, 0, 0.7);
                }

                .prev-btn {
                    left: 10px;
                }

                .next-btn {
                    right: 10px;
                }

                #preview {
                    max-width: 100%;
                    max-height: 400px;
                    object-fit: contain;
                    border-radius: 8px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }

                .result-section {
                    padding: 2rem;
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                }

                .comment-container {
                    background-color: #f9fafb;
                    border-radius: 12px;
                    padding: 1.5rem;
                    margin-bottom: 1.5rem;
                    min-height: 350px;
                    flex-grow: 1;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                }

                #aiComment {
                    font-size: 1rem;
                    color: #4b5563;
                    font-style: italic;
                }

                .loading-container {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(255, 255, 255, 0.9);
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    z-index: 10;
                    border-radius: 12px;
                    display: none;
                }

                .loading-container.active {
                    display: flex;
                }

                .loading-spinner {
                    width: 50px;
                    height: 50px;
                    border: 4px solid rgba(106, 17, 203, 0.1);
                    border-radius: 50%;
                    border-top-color: #6a11cb;
                    animation: spin 1s linear infinite;
                    margin-bottom: 1rem;
                }

                .loading-text {
                    color: #6a11cb;
                    font-size: 0.9rem;
                    font-weight: 500;
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                .cat-placeholder {
                    text-align: center;
                    padding: 2rem;
                    color: #9ca3af;
                }

                .cat-icon {
                    font-size: 3rem;
                    margin-bottom: 1rem;
                }

                @media (max-width: 768px) {
                    .content-grid {
                        grid-template-columns: 1fr;
                    }
                    .upload-section {
                        border-right: none;
                        border-bottom: 1px solid #f0f0f0;
                    }
                    .main-container {
                        margin: 1rem;
                    }
                }

                #submitBtn {
                    display: none; /* 初始狀態為隱藏 */
                    width: 100%;
                    padding: 0.8rem;
                    /* 其他樣式保持不變 */
                }

                .preview-state {
                    display: none;
                    width: 100%;
                }

                .preview-container {
                    margin: 1rem auto;
                    max-width: 100%;
                    border-radius: 8px;
                    overflow: hidden;
                }

                #preview {
                    max-width: 100%;
                    max-height: 300px;
                    object-fit: contain;
                    border-radius: 8px;
                }

                .btn-secondary {
                    background: #6c757d;
                    color: white;
                    margin-top: 1rem;
                }

                .btn-secondary:hover {
                    background: #5a6268;
                }

                .change-photo-btn {
                    font-size: 0.9rem;
                    padding: 0.5rem 1rem;
                }

                .history-btn {
                    background: rgba(255, 255, 255, 0.2);
                    color: white;
                    border: none;
                    padding: 0.5rem 1rem;
                    border-radius: 20px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 0.9rem;
                    transition: all 0.3s ease;
                    margin-right: 1rem;
                }

                .history-btn:hover {
                    background: rgba(255, 255, 255, 0.3);
                    transform: translateY(-1px);
                }

                .history-btn i {
                    font-size: 1rem;
                }

                .dropdown {
                    position: relative;
                }

                .dropdown-menu {
                    display: none;
                    position: absolute;
                    top: 100%;
                    right: 0;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    min-width: 300px;
                    z-index: 1000;
                    margin-top: 8px;
                    max-height: 500px;
                    overflow-y: auto;
                }

                .dropdown-menu.show {
                    display: block;
                }

                .dropdown-menu .history-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px 16px;
                    border-bottom: 1px solid #eee;
                    transition: background-color 0.3s;
                    text-decoration: none;
                    color: #333;
                }

                .dropdown-menu .history-item:last-child {
                    border-bottom: none;
                }

                .dropdown-menu .history-item:hover {
                    background-color: #f5f5f5;
                }

                .history-item img {
                    width: 50px;
                    height: 50px;
                    border-radius: 4px;
                    object-fit: cover;
                }

                .history-item-content {
                    flex: 1;
                    overflow: hidden;
                }

                .history-item-content h4 {
                    margin: 0;
                    font-size: 0.9rem;
                    color: #333;
                }

                .history-item-content p {
                    margin: 4px 0 0;
                    font-size: 0.8rem;
                    color: #666;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .dropdown-menu .menu-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 12px 16px;
                    color: #333;
                    text-decoration: none;
                    transition: background-color 0.3s;
                    border-bottom: 1px solid #eee;
                }

                .dropdown-menu .menu-item:hover {
                    background-color: #f5f5f5;
                }

                .dropdown-menu .menu-item i {
                    width: 20px;
                    text-align: center;
                    color: #666;
                }

                .dropdown-menu .menu-item:last-child {
                    border-bottom: none;
                }

                .default-cat-preview {
                    margin-bottom: 1.5rem;
                    border-radius: 8px;
                    overflow: hidden;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }

                .default-cat-preview img {
                    display: block;
                    width: 100%;
                    height: auto;
                    object-fit: cover;
                    transition: transform 0.3s ease;
                }

                .default-cat-preview:hover img {
                    transform: scale(1.05);
                }
            </style>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.1.1/css/all.min.css">
        </head>
        <body>
            <div class="header">
                <div class="header-content">
                    <div class="logo">
                        <i class="fa-solid fa-cat logo-icon"></i>
                        <h1>Meow Roast</h1>
                    </div>
                    <div class="user-profile">
                        <div class="dropdown">
                            <button class="history-btn" onclick="toggleDropdown(event)">
                                <i class="fa-solid fa-bars"></i>
                                選單
                            </button>
                            <div class="dropdown-menu" id="dropdownMenu">
                                <div id="historyList"></div>
                                <a href="/auth/logout" class="menu-item">
                                    <i class="fa-solid fa-sign-out-alt"></i>
                                    登出
                                </a>
                            </div>
                        </div>
                        <img src="${req.user ? req.user.picture : 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'}" class="user-avatar" alt="用戶頭像">
                        <span>${req.user ? req.user.name : '請先登入'}</span>
                    </div>
                </div>
            </div>

            <div class="main-container">
                <div class="content-grid">
                    <div class="upload-section">
                        <h2 class="section-title">
                            <i class="fa-solid fa-upload"></i>
                            上傳主子玉照
                        </h2>
                        
                        <div class="upload-area" id="dropZone">
                            <div class="initial-upload-state" style="display: none;">
                                <i class="fa-solid fa-cloud-arrow-up upload-icon"></i>
                                <p class="upload-text">拖放貓咪照片到這裡，或點擊上傳</p>
                                <input type="file" id="fileInput" accept="image/jpeg, image/png, image/gif, image/webp" style="display: none;">
                                <p style="color: #666; font-size: 0.9rem;">支援 JPG、PNG、GIF 和 WebP 格式</p>
                                <button class="btn btn-primary upload-btn" onclick="document.getElementById('fileInput').click()">
                                    選擇照片
                                </button>
                            </div>
                            <div class="preview-state" style="display: block;">
                                <div class="preview-container">
                                    <button class="nav-btn prev-btn" onclick="prevImage()">
                                        <i class="fa-solid fa-chevron-left"></i>
                                    </button>
                                    <img id="preview" alt="預設貓咪照片">
                                    <button class="nav-btn next-btn" onclick="nextImage()">
                                        <i class="fa-solid fa-chevron-right"></i>
                                    </button>
                                </div>
                                <button class="btn btn-secondary change-photo-btn" onclick="resetUpload()">
                                    <i class="fa-solid fa-rotate"></i> 更換照片
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="result-section">
                        <h2 class="section-title">
                            <i class="fa-solid fa-comment-dots"></i>
                            毒舌貓評
                        </h2>
                        
                        <div class="comment-container">
                            <div id="placeholderContent" class="cat-placeholder">
                                <i class="fa-solid fa-cat cat-icon"></i>
                                <p>快上傳你家主子的照片，讓AI來個超毒舌吐槽！</p>
                            </div>
                            <div id="aiComment"></div>
                            
                            <div class="loading-container" id="loadingContainer">
                                <div class="loading-spinner"></div>
                                <p class="loading-text">AI正在醞釀毒舌吐槽...</p>
                            </div>
                        </div>

                        <button id="submitBtn" class="btn btn-primary btn-full" onclick="submitPhoto()" style="display: block; margin-top: 1rem;">
                            <i class="fa-solid fa-wand-magic-sparkles"></i>
                            來個超毒舌吐槽
                        </button>
                    </div>
                </div>
            </div>

            <script>
                const dropZone = document.getElementById('dropZone');
                const fileInput = document.getElementById('fileInput');
                const preview = document.getElementById('preview');
                const submitBtn = document.getElementById('submitBtn');
                const loadingContainer = document.getElementById('loadingContainer');
                const aiComment = document.getElementById('aiComment');
                const placeholderContent = document.getElementById('placeholderContent');
                const initialUploadState = document.querySelector('.initial-upload-state');
                const previewState = document.querySelector('.preview-state');

                // 打印 window.defaultImages 的原始值
                console.log("原始 window.defaultImages:", window.defaultImages);

                // 預設貓咪照片數組
                const defaultImages = window.defaultImages;
                let currentPhotoIndex = 0;

                // 打印賦值後的 defaultImages
                console.log("賦值後的 defaultImages:", defaultImages);

                // **** 修改：嘗試立即設置初始圖片並添加錯誤處理 ****
                if (preview && defaultImages && defaultImages.length > 0) {
                    console.log("嘗試立即設置初始圖片:", defaultImages[currentPhotoIndex]);
                    
                    // 添加圖片加載錯誤處理
                    preview.onerror = function() {
                        console.error("圖片加載錯誤:", preview.src);
                        // 嘗試添加時間戳防止緩存
                        this.src = this.src + "?t=" + new Date().getTime();
                    };
                    
                    preview.src = defaultImages[currentPhotoIndex];
                    previewState.style.display = 'block';
                    submitBtn.style.display = 'block';
                    initialUploadState.style.display = 'none'; // 確保初始上傳狀態隱藏
                } else if(preview) {
                    // 如果沒有預設圖片，確保顯示初始上傳狀態
                    console.log("沒有預設圖片或數組為空 (立即嘗試)");
                    initialUploadState.style.display = 'block';
                    previewState.style.display = 'none';
                }
                // **** 結束修改 ****

                // 初始化時載入第一張預設圖片 (將原有邏輯註釋掉或移除)
                window.addEventListener('DOMContentLoaded', (event) => {
                    console.log("DOMContentLoaded 觸發 - 不再執行初始圖片設置");
                    // console.log("DOMContentLoaded 中的 defaultImages:", defaultImages);
                    // if (defaultImages && defaultImages.length > 0) {
                    //     console.log("加載預設圖片:", defaultImages[currentPhotoIndex]);
                    //     preview.src = defaultImages[currentPhotoIndex];
                    //     previewState.style.display = 'block';
                    //     submitBtn.style.display = 'block';
                    // } else {
                    //     console.log("沒有預設圖片或數組為空");
                    //     initialUploadState.style.display = 'block';
                    //     previewState.style.display = 'none';
                    // }
                });

                // 切換到上一張圖片
                function prevImage() {
                    currentPhotoIndex = (currentPhotoIndex - 1 + defaultImages.length) % defaultImages.length;
                    preview.src = defaultImages[currentPhotoIndex];
                    // 確保顯示提交按鈕
                    submitBtn.style.display = 'block';
                }

                // 切換到下一張圖片
                function nextImage() {
                    currentPhotoIndex = (currentPhotoIndex + 1) % defaultImages.length;
                    preview.src = defaultImages[currentPhotoIndex];
                    // 確保顯示提交按鈕
                    submitBtn.style.display = 'block';
                }

                // 修改 showPreview 函數，添加用戶上傳圖片時隱藏導航按鈕的邏輯
                function showPreview(file) {
                    if (file.type.match('image.*')) {
                        // 检查文件大小
                        if (file.size > 10 * 1024 * 1024) {
                            alert('圖片大小不能超過 10MB');
                            return;
                        }

                        const reader = new FileReader();
                        reader.onload = (e) => {
                            preview.src = e.target.result;
                            initialUploadState.style.display = 'none';
                            previewState.style.display = 'block';
                            submitBtn.style.display = 'block';
                            
                            // 隱藏導航按鈕
                            document.querySelector('.prev-btn').style.display = 'none';
                            document.querySelector('.next-btn').style.display = 'none';
                            
                            dropZone.style.borderStyle = 'solid';
                            dropZone.style.padding = '1rem';
                        };
                        reader.onerror = () => {
                            alert('讀取圖片失敗，請重試');
                        };
                        reader.readAsDataURL(file);
                    } else {
                        alert('請上傳正確的圖片格式（JPG、PNG、GIF、WebP、HEIC 或 HEIF）');
                    }
                }

                // 修改 resetUpload 函數，重置時顯示導航按鈕並打開文件選擇對話框
                function resetUpload() {
                    // 顯示導航按鈕
                    document.querySelector('.prev-btn').style.display = 'flex';
                    document.querySelector('.next-btn').style.display = 'flex';
                    preview.src = defaultImages[currentPhotoIndex];
                    fileInput.value = '';  // 清空文件輸入
                    submitBtn.style.display = 'block';
                    
                    // 打開文件選擇對話框
                    fileInput.click();
                }

                // 拖放功能
                ['dragenter', 'dragover'].forEach(eventName => {
                    dropZone.addEventListener(eventName, (e) => {
                        e.preventDefault();
                        dropZone.classList.add('dragover');
                    });
                });

                ['dragleave', 'drop'].forEach(eventName => {
                    dropZone.addEventListener(eventName, (e) => {
                        e.preventDefault();
                        dropZone.classList.remove('dragover');
                    });
                });

                dropZone.addEventListener('drop', (e) => {
                    const files = e.dataTransfer.files;
                    if (files.length && files[0].type.match('image.*')) {
                        fileInput.files = files;
                        showPreview(files[0]);
                    }
                });

                fileInput.addEventListener('change', (e) => {
                    if (e.target.files.length) {
                        showPreview(e.target.files[0]);
                    }
                });

                // 修改提交函数，添加错误处理
                async function submitPhoto() {
                    try {
                        loadingContainer.classList.add('active');
                        placeholderContent.style.display = 'none';
                        aiComment.textContent = '';

                        let formData = new FormData();

                        if (!fileInput.files.length) {
                            // 如果没有选择新文件，使用当前显示的预设图片
                            formData.append('imageUrl', preview.src);
                        } else {
                            const file = fileInput.files[0];
                            // 再次检查文件大小
                            if (file.size > 10 * 1024 * 1024) {
                                throw new Error('圖片大小不能超過 10MB');
                            }
                            formData.append('photo', file);
                        }
                        
                        const response = await fetch('/upload', {
                            method: 'POST',
                            body: formData
                        });

                        const data = await response.json();
                        
                        if (response.ok) {
                            aiComment.textContent = data.comment;
                            aiComment.style.display = 'block';
                            aiComment.style.color = '#4b5563'; // 重置文字颜色为默认值
                        } else {
                            throw new Error(data.error || '上傳失敗');
                        }
                    } catch (error) {
                        console.error('上傳錯誤:', error);
                        aiComment.textContent = '抱歉，評論生成失敗：' + error.message;
                        aiComment.style.color = '#ff4444';
                    } finally {
                        loadingContainer.classList.remove('active');
                    }
                }

                // 切換下拉菜單
                function toggleDropdown(event) {
                    event.stopPropagation();
                    const dropdownMenu = document.getElementById('dropdownMenu');
                    dropdownMenu.classList.toggle('show');
                    
                    // 如果菜單被打開，則加載歷史記錄
                    if (dropdownMenu.classList.contains('show')) {
                        showHistory();
                    }
                }

                // 點擊其他地方關閉下拉菜單
                document.addEventListener('click', function(event) {
                    const dropdownMenu = document.getElementById('dropdownMenu');
                    if (dropdownMenu.classList.contains('show')) {
                        dropdownMenu.classList.remove('show');
                    }
                });

                // 顯示歷史記錄
                async function showHistory() {
                    try {
                        const response = await fetch('/upload/history');
                        const data = await response.json();
                        if (data.error) {
                            alert(data.error);
                            return;
                        }
                        
                        const historyList = document.getElementById('historyList');
                        historyList.innerHTML = '';

                        // 只顯示最近的10條記錄
                        const recentPhotos = data.slice(0, 10);
                        
                        recentPhotos.forEach(photo => {
                            const date = new Date(photo.createdAt);
                            const formattedDate = date.toLocaleDateString('zh-TW', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            });

                            const historyItem = document.createElement('a');
                            historyItem.href = '#';
                            historyItem.className = 'history-item';
                            historyItem.innerHTML = 
                                '<img src="' + photo.imageUrl + '" alt="貓咪照片">' +
                                '<div class="history-item-content">' +
                                    '<h4>' + photo.userName + '</h4>' +
                                    '<p>' + formattedDate + '</p>' +
                                '</div>';

                            // 當點擊歷史記錄項目時
                            historyItem.onclick = function(e) {
                                e.preventDefault();
                                aiComment.textContent = photo.aiComment;
                                placeholderContent.style.display = 'none';
                                preview.src = photo.imageUrl;
                                initialUploadState.style.display = 'none';
                                previewState.style.display = 'block';
                                submitBtn.style.display = 'none';
                                dropdownMenu.classList.remove('show');
                            };

                            historyList.appendChild(historyItem);
                        });
                    } catch (error) {
                        console.error('獲取歷史記錄失敗:', error);
                        alert('獲取歷史記錄失敗');
                    }
                }
            </script>
        </body>
        </html>
    `);
});

// 處理上傳
router.post('/', authenticateJWT, upload.single('photo'), async (req, res) => {
    // 如果用戶未登入，返回錯誤
    if (!req.user) {
        return res.status(401).json({ error: '請先登入' });
    }
    
    try {
        let imageUrl;

        if (req.body.imageUrl) {
            // 如果是预设图片，先下载并上传到Cloudinary
            try {
                const response = await fetch(req.body.imageUrl);
                const arrayBuffer = await response.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                
                const uploadResponse = await new Promise((resolve, reject) => {
                    const uploadStream = cloudinary.uploader.upload_stream(
                        {
                            resource_type: 'auto',
                            folder: 'cat_photos',
                            format: 'jpg',
                            transformation: [
                                {quality: 'auto:good'},
                                {fetch_format: 'auto'}
                            ]
                        },
                        (error, result) => {
                            if (error) {
                                console.error('Cloudinary上传错误:', error);
                                reject(error);
                            } else {
                                resolve(result);
                            }
                        }
                    );
                    uploadStream.end(buffer);
                });
                imageUrl = uploadResponse.secure_url;
                console.log('预设图片已上传到Cloudinary:', imageUrl);
            } catch (error) {
                console.error('预设图片处理错误:', error);
                throw new Error('预设图片处理失败：' + error.message);
            }
        } else if (req.file) {
            console.log('开始处理上传的文件:', {
                filename: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size
            });

            // 上传到Cloudinary
            const uploadResponse = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        resource_type: 'auto',
                        folder: 'cat_photos',
                        format: 'jpg', // 统一转换为jpg格式
                        transformation: [
                            {quality: 'auto:good'}, // 自动优化质量
                            {fetch_format: 'auto'} // 自动选择最佳格式
                        ]
                    },
                    (error, result) => {
                        if (error) {
                            console.error('Cloudinary上传错误:', error);
                            reject(error);
                        } else {
                            console.log('Cloudinary上传成功:', result);
                            resolve(result);
                        }
                    }
                );

                uploadStream.end(req.file.buffer);
            });
            imageUrl = uploadResponse.secure_url;
            console.log('Cloudinary上传成功，图片URL:', imageUrl);
        } else {
            return res.status(400).json({ error: '沒有找到圖片' });
        }

        console.log('开始调用OpenRouter API...');
        console.log('使用的API Key:', process.env.OPENAI_API_KEY ? '已设置' : '未设置');
        console.log('使用的Host:', process.env.HOST || 'http://localhost:3000');

        // 使用 fetch API 获取 AI 评论
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
                "HTTP-Referer": process.env.HOST || 'http://localhost:3000',
                "X-Title": "Lazy Cat Project",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "model": "openai/gpt-4o-2024-11-20",
                "messages": [
                    {
                        "role": "system",
                        "content": "你是一個風趣幽默的貓咪評論家，你會用毒舌的方式評論照片中貓咪的動作。請用200字以內簡短評論，不要使用任何標題或markdown格式。"
                    },
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": "請用毒舌的語氣，用200字以內簡短描述照片中這隻貓咪的姿態、表情和可能的想法。"
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": imageUrl
                                }
                            }
                        ]
                    }
                ],
                "temperature": 0.7,
                "max_tokens": 500,
                "top_p": 0.9
            })
        });

        console.log('API响应状态:', response.status);
        
        const completion = await response.json();
        console.log('API完整响应:', JSON.stringify(completion, null, 2));

        if (completion.error) {
            throw new Error(`API错误: ${completion.error.message || JSON.stringify(completion.error)}`);
        }

        if (!completion.choices || !completion.choices[0] || !completion.choices[0].message) {
            throw new Error('API响应格式不正确: ' + JSON.stringify(completion));
        }

        const message = completion.choices[0].message;
        if (typeof message === 'object' && message.content) {
            console.log('成功获取AI评论:', message.content);
            
            // 保存到 MongoDB
            const newPhoto = new Photo({
                userId: req.user.id,
                userName: req.user.name,
                imageUrl: imageUrl,
                aiComment: message.content
            });

            await newPhoto.save();
            console.log('照片信息已保存到MongoDB');

            res.json({
                imageUrl: imageUrl,
                comment: message.content
            });
        } else {
            throw new Error('无法获取AI评论内容: ' + JSON.stringify(message));
        }
    } catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json({ error: '上傳失敗：' + (error.message || '未知錯誤') });
    }
});

// 獲取歷史記錄
router.get('/history', authenticateJWT, async (req, res) => {
    // 檢查用戶是否已登入
    if (!req.user || !req.user.id) {
        return res.status(401).json({ error: '請先登入' });
    }

    try {
        // 只查詢當前用戶的照片記錄
        const photos = await Photo.find({ userId: req.user.id })
            .sort({ createdAt: -1 })
            .limit(10); // 直接在數據庫查詢時限制返回10條記錄
        res.json(photos);
    } catch (error) {
        console.error('Error fetching history:', error);
        res.status(500).json({ error: '獲取歷史記錄失敗' });
    }
});

module.exports = router; 