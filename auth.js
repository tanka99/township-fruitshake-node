const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Farm = require('../models/Farm');

const router = express.Router();

// Đăng ký - +10 kim cương
router.post('/register', async (req, res) => {
  try {
    const { login, password, email, gender } = req.body;
    
    if (!login || login.length < 3) return res.json({ success: false, message: 'Login quá ngắn' });
    if (!password || password.length < 4) return res.json({ success: false, message: 'Mật khẩu quá ngắn' });
    
    const exists = await User.findOne({ login });
    if (exists) return res.json({ success: false, message: 'Tên đã tồn tại' });
    
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      login,
      passwordHash: hash,
      email,
      gender: gender || 'male',
      diamonds: 310, // 300 + 10 thưởng
      gold: 315
    });
    
    await Farm.create({ userId: user._id });
    
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'township_secret_2026', { expiresIn: '30d' });
    
    res.json({
      success: true,
      token,
      user: { login: user.login, gold: user.gold, diamonds: user.diamonds, level: user.level, xp: user.xp }
    });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// Đăng nhập
router.post('/login', async (req, res) => {
  try {
    const { login, password } = req.body;
    const user = await User.findOne({ login });
    
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.json({ success: false, message: 'Sai tên hoặc mật khẩu' });
    }
    
    user.lastLogin = new Date();
    await user.save();
    
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'township_secret_2026', { expiresIn: '30d' });
    
    res.json({
      success: true,
      token,
      user: { login: user.login, gold: user.gold, diamonds: user.diamonds, level: user.level, xp: user.xp }
    });
  } catch (e) {
    res.status(500).json({ success: false });
  }
});

module.exports = router;
