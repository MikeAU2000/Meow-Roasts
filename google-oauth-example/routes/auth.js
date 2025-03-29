const express = require('express');
const router = express.Router();
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const jwt = require('jsonwebtoken');

// Passport Google OAuth 配置
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.HOST}/auth/google/callback`,
    scope: ['profile', 'email']
}, (accessToken, refreshToken, profile, done) => {
    // 這裡可以處理用戶資料，例如存入數據庫
    const user = {
        id: profile.id,
        name: profile.displayName,
        email: profile.emails[0].value,
        picture: profile.photos[0].value
    };
    return done(null, user);
}));

// 序列化用戶
passport.serializeUser((user, done) => {
    done(null, user);
});

// 反序列化用戶
passport.deserializeUser((user, done) => {
    done(null, user);
});

// Google 登入路由
router.get('/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Google 回調路由
router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req, res) => {
        // 生成 JWT token
        const token = jwt.sign(
            { user: req.user },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // 設置 cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000 // 24小時
        });

        // 重定向到上傳頁面
        res.redirect('/upload');
    }
);

// 登出路由
router.get('/logout', (req, res) => {
    req.logout();
    res.clearCookie('token');
    res.redirect('/');
});

module.exports = router; 