const mongoose = require('mongoose');

const farmSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  farmData: {
    wheatPlanted: { type: Number, default: 6 },
    wheatFinishAt: { type: Date, default: () => new Date(Date.now() + 111000) },
    barn: { type: Number, default: 6 },
    barnCapacity: { type: Number, default: 50 },
    warehouse: { type: Number, default: 9 },
    warehouseCapacity: { type: Number, default: 50 },
    chickenCoop: { type: Number, default: 0 },
    plots: { type: Number, default: 5 },
    pets: { type: Array, default: [] }
  },
  updatedAt: { type: Date, default: Date.now }
});

farmSchema.index({ userId: 1 });
farmSchema.index({ updatedAt: 1 });

module.exports = mongoose.model('Farm', farmSchema);
