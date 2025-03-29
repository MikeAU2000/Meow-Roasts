const express = require('express');
const session = require('express-session');
const passport = require('passport');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/auth');
const { authenticateToken } = require('./middleware/auth');

const app = express();

// 中間件配置
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session 配置
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24小時
    }
}));

// Passport 初始化
app.use(passport.initialize());
app.use(passport.session());

// 路由
app.use('/auth', authRoutes);

// 登入頁面
app.get('/login', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>登入</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    margin: 0;
                    background-color: #f5f5f5;
                }
                .login-container {
                    background: white;
                    padding: 2rem;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    text-align: center;
                }
                .google-btn {
                    background-color: #4285f4;
                    color: white;
                    padding: 12px 24px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 16px;
                    text-decoration: none;
                    display: inline-block;
                    margin-top: 20px;
                }
                .google-btn:hover {
                    background-color: #357abd;
                }
            </style>
        </head>
        <body>
            <div class="login-container">
                <h1>歡迎</h1>
                <p>請使用以下方式登入：</p>
                <a href="/auth/google" class="google-btn">
                    使用 Google 帳號登入
                </a>
            </div>
        </body>
        </html>
    `);
});

// 受保護的路由示例
app.get('/protected', authenticateToken, (req, res) => {
    res.json({ user: req.user });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 