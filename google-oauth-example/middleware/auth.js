const jwt = require('jsonwebtoken');

// 驗證 JWT token 的中間件
const authenticateToken = (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        return res.redirect('/login');
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.redirect('/login');
        }
        req.user = decoded.user;
        next();
    });
};

module.exports = {
    authenticateToken
}; 