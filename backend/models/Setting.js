const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: 'primary' },
    canteenName: { type: String, default: 'Canteen Express' },
    announcement: { type: String, default: '欢迎使用智慧食堂配送系统。' },
    supportPhone: { type: String, default: '' },
    businessHours: { type: String, default: '08:00 - 19:00' },
    acceptingOrders: { type: Boolean, default: true },
    averagePrepMinutes: { type: Number, default: 15 }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Setting', settingSchema);
