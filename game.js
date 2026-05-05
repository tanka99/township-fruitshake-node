const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Farm = require('../models/Farm');

const router = express.Router();

// Load game
router.get('/load', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const farm = await Farm.findOne({ userId: req.userId });
    
    res.json({
      success: true,
      user: { gold: user.gold, diamonds: user.diamonds, level: user.level, xp: user.xp },
      farm: farm.farmData
    });
  } catch {
    res.status(500).json({ success: false });
  }
});

// Save game - được gọi mỗi 30s
router.post('/save', auth, async (req, res) => {
  try {
    const { gold, diamonds, level, xp, farm } = req.body;
    
    await User.findByIdAndUpdate(req.userId, { gold, diamonds, level, xp });
    await Farm.findOneAndUpdate(
      { userId: req.userId },
      { farmData: farm, updatedAt: new Date() },
      { upsert: true }
    );
    
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false });
  }
});

// Harvest wheat
router.post('/harvest', auth, async (req, res) => {
  try {
    const farm = await Farm.findOne({ userId: req.userId });
    const now = new Date();
    
    if (farm.farmData.wheatFinishAt <= now && farm.farmData.wheatPlanted > 0) {
      const harvested = farm.farmData.wheatPlanted;
      farm.farmData.barn = Math.min(farm.farmData.barn + harvested, farm.farmData.barnCapacity);
      farm.farmData.wheatPlanted = 0;
      await farm.save();
      
      await User.findByIdAndUpdate(req.userId, { $inc: { xp: harvested } });
      
      res.json({ success: true, harvested });
    } else {
      res.json({ success: false, message: 'Chưa chín' });
    }
  } catch {
    res.status(500).json({ success: false });
  }
});

module.exports = router;
