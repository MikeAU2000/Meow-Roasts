const express = require('express');
const router = express.Router();

const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const { GOOGLE_CLIENT_ID, GOOGLE_SECRET_KEY, JWT_SECRET, HOST } = process.env;

const client = new OAuth2Client({
  clientId: GOOGLE_CLIENT_ID,
  clientSecret: GOOGLE_SECRET_KEY,
  redirectUri: `${HOST}/auth/google/callback`,
});

// 授權路由
router.get('/google', (req, res) => {
  const authorizeUrl = client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
    ],
    prompt: 'consent'
  });
  res.redirect(authorizeUrl);
});

// 回傳路由
router.get('/google/callback', async (req, res) => {
  const { code } = req.query;

  try {
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    const userInfo = await client.request({
      url: 'https://www.googleapis.com/oauth2/v3/userinfo'
    });

    // 創建包含必要信息的用戶對象
    const userData = {
      id: userInfo.data.sub,
      name: userInfo.data.name,
      email: userInfo.data.email,
      picture: userInfo.data.picture
    };

    const token = jwt.sign(userData, JWT_SECRET);
    res.cookie('token', token);
    res.redirect('/upload');
  } catch (error) {
    console.error('OAuth Error:', error);
    res.status(400).send('Error fetching Google user info');
  }
});

// 登入成功頁面
router.get('/success', authenticateJWT, async (req, res) => {
  try {
    const userInfo = await client.request({
      url: 'https://www.googleapis.com/oauth2/v3/userinfo',
    });
    
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
          <title>登入成功</title>
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
              .container {
                  text-align: center;
                  padding: 40px;
                  background: white;
                  border-radius: 8px;
                  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
              }
              .user-avatar {
                  width: 100px;
                  height: 100px;
                  border-radius: 50%;
                  margin-bottom: 20px;
              }
              .logout-btn {
                  display: inline-block;
                  padding: 10px 20px;
                  background-color: #4285f4;
                  color: white;
                  text-decoration: none;
                  border-radius: 5px;
                  margin-top: 20px;
                  transition: background-color 0.3s;
              }
              .logout-btn:hover {
                  background-color: #357abd;
              }
          </style>
      </head>
      <body>
          <div class="container">
              <h1>登入成功！</h1>
              <img src="${userInfo.data.picture}" alt="用戶頭像" class="user-avatar">
              <h2>歡迎，${userInfo.data.name}！</h2>
              <p>電子郵件：${userInfo.data.email}</p>
              <a href="/auth/logout" class="logout-btn">登出</a>
          </div>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Error:', error);
    res.status(400).send('Error fetching user info');
  }
});

// 登出路由
router.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/');
});

// 驗證 JWT
function authenticateJWT(req, res, next) {
  const token = req.cookies.token || req.header('Authorization');
  console.log('Token:', token);

  if (token) {
    // 如果 token 是從 Authorization header 來的，需要移除 'Bearer ' 前綴
    const tokenString = token.startsWith('Bearer ') ? token.slice(7) : token;

    jwt.verify(tokenString, JWT_SECRET, (err, user) => {
      if (err) {
        console.error('JWT Verification Error:', err);
        return res.sendStatus(403);
      }
      req.user = user;
      next();
    });
  } else {
    console.log('No token found');
    res.sendStatus(401);
  }
}

router.get('/user', authenticateJWT, async (req, res) => {
  try {
    const userInfo = await client.request({
      url: 'https://www.googleapis.com/oauth2/v3/userinfo',
    });
    res.json(userInfo.data);
  } catch (error) {
    console.error(error);
    res.status(400).send('Error fetching user info');
  }
});

module.exports = router; 