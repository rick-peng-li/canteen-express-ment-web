const mongoose = require('mongoose');

const parsedItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, default: 0 },
    category: { type: String, default: '' },
    notes: { type: String, default: '' }
  },
  { _id: false }
);

const statusTimelineSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Preparing', 'Ready', 'Delivered', 'Cancelled'],
      required: true
    },
    at: { type: Date, default: Date.now }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    customerName: { type: String, required: true, trim: true },
    phone: { type: String, default: '', trim: true },
    rawText: { type: String, required: true, trim: true },
    parsedItems: { type: [parsedItemSchema], default: [] },
    destination: { type: String, required: true, trim: true },
    destinationCode: { type: String, required: true, trim: true, index: true },
    source: { type: String, enum: ['voice', 'text', 'catalog', 'mixed'], default: 'text' },
    notes: { type: String, default: '', trim: true },
    totalAmount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Preparing', 'Ready', 'Delivered', 'Cancelled'],
      default: 'Pending',
      index: true
    },
    estimatedReadyMinutes: { type: Number, default: 15 },
    statusTimeline: { type: [statusTimelineSchema], default: [] },
    deliveredAt: { type: Date, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
