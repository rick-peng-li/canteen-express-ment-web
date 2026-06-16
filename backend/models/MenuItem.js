const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    description: { type: String, default: '', trim: true },
    badge: { type: String, default: '', trim: true },
    preparationTime: { type: Number, default: 10 },
    isAvailable: { type: Boolean, default: true }
  },
  { timestamps: true }
);

menuItemSchema.index({ name: 1 }, { unique: true });

module.exports = mongoose.model('MenuItem', menuItemSchema);
