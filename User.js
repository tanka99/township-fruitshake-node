const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  login: { type: String, required: true, unique: true, index: true, minlength: 3, maxlength: 32 },
  passwordHash: { type: String, required: true },
  email: { type: String, sparse: true },
  gender: { type: String, enum: ['male', 'female'], default: 'male' },
  gold: { type: Number, default: 315 },
  diamonds: { type: Number, default: 300 },
  level: { type: Number, default: 1 },
  xp: { type: Number, default: 9 },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date }
});

userSchema.index({ login: 1 });

module.exports = mongoose.model('User', userSchema);
