require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { Server } = require('socket.io');
const { OpenAI } = require('openai');
const Order = require('./models/Order');
const MenuItem = require('./models/MenuItem');
const Destination = require('./models/Destination');
const Setting = require('./models/Setting');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'] }
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/canteen_express';
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const ORDER_STATUSES = ['Pending', 'Confirmed', 'Preparing', 'Ready', 'Delivered', 'Cancelled'];
const ACTIVE_STATUSES = ['Pending', 'Confirmed', 'Preparing', 'Ready'];

const defaultMenuItems = [
  {
    name: 'Poha',
    category: 'Breakfast',
    price: 20,
    description: '经典早餐主食，适合快速出餐。',
    badge: 'Popular',
    preparationTime: 8,
    isAvailable: true
  },
  {
    name: 'Vada Pav',
    category: 'Snacks',
    price: 25,
    description: '高频点单小吃，适合课间配送。',
    badge: 'Best Seller',
    preparationTime: 10,
    isAvailable: true
  },
  {
    name: 'Chai',
    category: 'Beverages',
    price: 12,
    description: '热饮，适合办公室场景。',
    badge: 'Fast',
    preparationTime: 5,
    isAvailable: true
  },
  {
    name: 'Coffee',
    category: 'Beverages',
    price: 18,
    description: '现冲饮品。',
    badge: 'Recommended',
    preparationTime: 6,
    isAvailable: true
  },
  {
    name: 'Masala Dosa',
    category: 'Meals',
    price: 45,
    description: '堂食与配送都适合的热食。',
    badge: 'Hot',
    preparationTime: 15,
    isAvailable: true
  },
  {
    name: 'Veg Sandwich',
    category: 'Meals',
    price: 35,
    description: '轻食类午餐。',
    badge: 'Healthy',
    preparationTime: 9,
    isAvailable: true
  }
];

const defaultDestinations = [
  {
    name: 'CS Dept Staffroom',
    code: 'CS_DEPT_STAFFROOM',
    contactPerson: 'Computer Science Faculty',
    deliveryFee: 0,
    isActive: true
  },
  {
    name: 'IT Dept Staffroom',
    code: 'IT_DEPT_STAFFROOM',
    contactPerson: 'IT Faculty',
    deliveryFee: 0,
    isActive: true
  },
  {
    name: 'HOD Cabin',
    code: 'HOD_CABIN',
    contactPerson: 'Department HOD',
    deliveryFee: 0,
    isActive: true
  },
  {
    name: 'Admin Block',
    code: 'ADMIN_BLOCK',
    contactPerson: 'Administrative Team',
    deliveryFee: 10,
    isActive: true
  }
];

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

app.use(cors());
app.use(express.json());

const groq = process.env.GROQ_API_KEY
  ? new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1'
    })
  : null;

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename(req, file, cb) {
    cb(null, `${Date.now()}.webm`);
  }
});

const upload = multer({ storage });

function getStartOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function generateOrderNumber() {
  return `CE-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeItems(items) {
  const merged = new Map();

  items.forEach((item) => {
    if (!item || !item.name || !Number(item.quantity)) {
      return;
    }

    const key = item.name.trim().toLowerCase();
    const existing = merged.get(key) || {
      name: item.name.trim(),
      quantity: 0,
      price: Number(item.price || 0),
      category: item.category || '',
      notes: item.notes || ''
    };

    existing.quantity += Math.max(1, Number(item.quantity || 1));
    existing.price = Number(item.price ?? existing.price ?? 0);
    existing.category = item.category || existing.category;
    existing.notes = item.notes || existing.notes;

    merged.set(key, existing);
  });

  return Array.from(merged.values());
}

function parseSimpleOrderText(orderText, menuItems) {
  const text = (orderText || '').trim();
  if (!text) {
    return [];
  }

  const lowerText = text.toLowerCase();
  const detected = menuItems
    .filter((item) => lowerText.includes(item.name.toLowerCase()))
    .map((item) => {
      const quantityMatch = lowerText.match(new RegExp(`(\\d+)\\s+${escapeRegex(item.name.toLowerCase())}`, 'i'));
      return {
        name: item.name,
        quantity: Number(quantityMatch?.[1] || 1),
        price: item.price,
        category: item.category,
        notes: ''
      };
    });

  if (detected.length > 0) {
    return normalizeItems(detected);
  }

  return [
    {
      name: text,
      quantity: 1,
      price: 0,
      category: 'Custom',
      notes: ''
    }
  ];
}

async function parseOrderText(orderText) {
  const menuItems = await MenuItem.find({ isAvailable: true }).lean();

  if (!groq) {
    return parseSimpleOrderText(orderText, menuItems);
  }

  try {
    const prompt = [
      'You are an expert canteen order parser.',
      'Convert the input order into JSON with a single key named items.',
      'Each item must include name, quantity, category, notes.',
      'Group duplicate items and fix simple typos.',
      `Known menu items: ${menuItems.map((item) => item.name).join(', ')}`
    ].join(' ');

    const response = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: orderText }
      ]
    });

    const parsed = JSON.parse(response.choices[0].message.content || '{"items": []}');
    const menuMap = new Map(menuItems.map((item) => [item.name.toLowerCase(), item]));

    return normalizeItems(
      (parsed.items || []).map((item) => {
        const matchedMenu = menuMap.get((item.name || '').trim().toLowerCase());
        return {
          name: item.name,
          quantity: Number(item.quantity || 1),
          category: matchedMenu?.category || item.category || 'Custom',
          price: matchedMenu?.price || 0,
          notes: item.notes || ''
        };
      })
    );
  } catch (error) {
    console.error('Order parsing error:', error.message);
    return parseSimpleOrderText(orderText, menuItems);
  }
}

async function buildParsedItems({ orderText, selectedItems }) {
  const menuSelections = Array.isArray(selectedItems) ? selectedItems : [];
  const menuDocs = menuSelections.length
    ? await MenuItem.find({ _id: { $in: menuSelections.map((item) => item.menuItemId).filter(Boolean) } }).lean()
    : [];
  const menuMap = new Map(menuDocs.map((item) => [String(item._id), item]));

  const selectedParsedItems = menuSelections
    .map((selection) => {
      const matched = menuMap.get(String(selection.menuItemId));
      if (!matched || !matched.isAvailable) {
        return null;
      }

      return {
        name: matched.name,
        quantity: Math.max(1, Number(selection.quantity || 1)),
        price: matched.price,
        category: matched.category,
        notes: selection.notes || ''
      };
    })
    .filter(Boolean);

  const textParsedItems = orderText ? await parseOrderText(orderText) : [];

  return normalizeItems([...selectedParsedItems, ...textParsedItems]);
}

function calculateTotalAmount(parsedItems) {
  return parsedItems.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0);
}

async function getSettings() {
  let settings = await Setting.findOne({ key: 'primary' });

  if (!settings) {
    settings = await Setting.create({ key: 'primary' });
  }

  return settings;
}

async function ensureSeedData() {
  const [menuCount, destinationCount] = await Promise.all([MenuItem.countDocuments(), Destination.countDocuments()]);

  if (menuCount === 0) {
    await MenuItem.insertMany(defaultMenuItems);
  }

  if (destinationCount === 0) {
    await Destination.insertMany(defaultDestinations);
  }

  await getSettings();
}

async function buildDashboardSummary() {
  const startOfToday = getStartOfToday();

  const [
    todayAggregation,
    activeOrders,
    menuCount,
    destinationCount,
    recentOrders,
    statusAggregation,
    settings
  ] = await Promise.all([
    Order.aggregate([
      { $match: { createdAt: { $gte: startOfToday } } },
      {
        $group: {
          _id: null,
          todayOrders: { $sum: 1 },
          revenueToday: { $sum: '$totalAmount' },
          averageTicket: { $avg: '$totalAmount' }
        }
      }
    ]),
    Order.countDocuments({ status: { $in: ACTIVE_STATUSES } }),
    MenuItem.countDocuments({ isAvailable: true }),
    Destination.countDocuments({ isActive: true }),
    Order.find().sort({ createdAt: -1 }).limit(6).lean(),
    Order.aggregate([
      { $match: { createdAt: { $gte: startOfToday } } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),
    getSettings()
  ]);

  const summary = todayAggregation[0] || { todayOrders: 0, revenueToday: 0, averageTicket: 0 };
  const statusCounts = statusAggregation.reduce((accumulator, item) => {
    accumulator[item._id] = item.count;
    return accumulator;
  }, {});

  return {
    todayOrders: summary.todayOrders,
    revenueToday: summary.revenueToday,
    averageTicket: Math.round(summary.averageTicket || 0),
    activeOrders,
    availableMenuItems: menuCount,
    activeDestinations: destinationCount,
    statusCounts,
    recentOrders,
    settings
  };
}

async function emitSummaryUpdate() {
  const summary = await buildDashboardSummary();
  io.emit('summary_updated', summary);
}

async function safeRemoveFile(filePath) {
  if (!filePath) {
    return;
  }

  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('File cleanup error:', error.message);
  }
}

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
});

app.get('/api/health', async (req, res) => {
  const settings = await getSettings();
  res.json({
    status: 'ok',
    service: settings.canteenName,
    acceptingOrders: settings.acceptingOrders,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/dashboard/summary', async (req, res) => {
  const summary = await buildDashboardSummary();
  res.json(summary);
});

app.get('/api/menu-items', async (req, res) => {
  const { category, available } = req.query;
  const query = {};

  if (category) {
    query.category = category;
  }

  if (available === 'true' || available === 'false') {
    query.isAvailable = available === 'true';
  }

  const items = await MenuItem.find(query).sort({ category: 1, name: 1 });
  res.json(items);
});

app.post('/api/menu-items', async (req, res) => {
  const menuItem = await MenuItem.create({
    name: req.body.name,
    category: req.body.category,
    price: Number(req.body.price || 0),
    description: req.body.description || '',
    badge: req.body.badge || '',
    preparationTime: Number(req.body.preparationTime || 10),
    isAvailable: req.body.isAvailable !== false
  });

  await emitSummaryUpdate();
  res.status(201).json(menuItem);
});

app.patch('/api/menu-items/:id', async (req, res) => {
  const menuItem = await MenuItem.findByIdAndUpdate(
    req.params.id,
    {
      ...req.body,
      price: req.body.price === undefined ? undefined : Number(req.body.price),
      preparationTime: req.body.preparationTime === undefined ? undefined : Number(req.body.preparationTime)
    },
    { new: true, runValidators: true }
  );

  if (!menuItem) {
    return res.status(404).json({ error: 'Menu item not found.' });
  }

  await emitSummaryUpdate();
  res.json(menuItem);
});

app.delete('/api/menu-items/:id', async (req, res) => {
  const menuItem = await MenuItem.findByIdAndDelete(req.params.id);

  if (!menuItem) {
    return res.status(404).json({ error: 'Menu item not found.' });
  }

  await emitSummaryUpdate();
  res.json({ success: true });
});

app.get('/api/destinations', async (req, res) => {
  const destinations = await Destination.find().sort({ isActive: -1, name: 1 });
  res.json(destinations);
});

app.post('/api/destinations', async (req, res) => {
  const destination = await Destination.create({
    name: req.body.name,
    code: req.body.code,
    contactPerson: req.body.contactPerson || '',
    deliveryFee: Number(req.body.deliveryFee || 0),
    isActive: req.body.isActive !== false
  });

  await emitSummaryUpdate();
  res.status(201).json(destination);
});

app.patch('/api/destinations/:id', async (req, res) => {
  const destination = await Destination.findByIdAndUpdate(
    req.params.id,
    {
      ...req.body,
      deliveryFee: req.body.deliveryFee === undefined ? undefined : Number(req.body.deliveryFee)
    },
    { new: true, runValidators: true }
  );

  if (!destination) {
    return res.status(404).json({ error: 'Destination not found.' });
  }

  await emitSummaryUpdate();
  res.json(destination);
});

app.get('/api/settings', async (req, res) => {
  const settings = await getSettings();
  res.json(settings);
});

app.put('/api/settings', async (req, res) => {
  const settings = await Setting.findOneAndUpdate(
    { key: 'primary' },
    {
      key: 'primary',
      canteenName: req.body.canteenName,
      announcement: req.body.announcement,
      supportPhone: req.body.supportPhone,
      businessHours: req.body.businessHours,
      acceptingOrders: Boolean(req.body.acceptingOrders),
      averagePrepMinutes: Number(req.body.averagePrepMinutes || 15)
    },
    { new: true, upsert: true, runValidators: true }
  );

  await emitSummaryUpdate();
  res.json(settings);
});

app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No audio file provided.' });
  }

  if (!groq) {
    await safeRemoveFile(req.file.path);
    return res.status(503).json({ error: 'GROQ_API_KEY is not configured.' });
  }

  try {
    const transcription = await groq.audio.transcriptions.create({
      file: fs.createReadStream(req.file.path),
      model: 'whisper-large-v3',
      prompt: 'This is a college canteen order. Food names may include chai, poha, coffee, sandwich, vada pav, dosa.',
      language: 'en'
    });

    res.json({ text: transcription.text });
  } catch (error) {
    console.error('Transcription error:', error.message);
    res.status(500).json({ error: 'Failed to transcribe audio.' });
  } finally {
    setTimeout(() => {
      safeRemoveFile(req.file.path);
    }, 300);
  }
});

app.get('/api/orders/active', async (req, res) => {
  const orders = await Order.find({ status: { $in: ACTIVE_STATUSES } }).sort({ createdAt: 1 });
  res.json(orders);
});

app.get('/api/orders', async (req, res) => {
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(50, Math.max(1, Number(req.query.limit || 10)));
  const query = {};

  if (req.query.status) {
    query.status = req.query.status;
  }

  if (req.query.destination) {
    query.destinationCode = req.query.destination;
  }

  if (req.query.source) {
    query.source = req.query.source;
  }

  if (req.query.from || req.query.to) {
    query.createdAt = {};
    if (req.query.from) {
      query.createdAt.$gte = new Date(req.query.from);
    }
    if (req.query.to) {
      query.createdAt.$lte = new Date(req.query.to);
    }
  }

  if (req.query.search) {
    const regex = new RegExp(req.query.search, 'i');
    query.$or = [
      { customerName: regex },
      { orderNumber: regex },
      { rawText: regex },
      { destination: regex }
    ];
  }

  const [items, total] = await Promise.all([
    Order.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Order.countDocuments(query)
  ]);

  res.json({
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
});

app.get('/api/orders/:id', async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return res.status(404).json({ error: 'Order not found.' });
  }

  res.json(order);
});

app.post('/api/orders', async (req, res) => {
  const settings = await getSettings();

  if (!settings.acceptingOrders) {
    return res.status(403).json({ error: 'The canteen is temporarily not accepting new orders.' });
  }

  const destinationInput = req.body.destination;
  const destination = await Destination.findOne({
    isActive: true,
    $or: [{ code: destinationInput }, { name: destinationInput }]
  });

  if (!destination) {
    return res.status(400).json({ error: 'Please choose a valid destination.' });
  }

  const rawText = (req.body.orderText || '').trim();
  const parsedItems = await buildParsedItems({
    orderText: rawText,
    selectedItems: req.body.selectedItems
  });

  if (parsedItems.length === 0) {
    return res.status(400).json({ error: 'Please provide order content or choose menu items.' });
  }

  const source = req.body.source || (rawText && Array.isArray(req.body.selectedItems) && req.body.selectedItems.length ? 'mixed' : rawText ? 'text' : 'catalog');
  const menuSummaryText = parsedItems.map((item) => `${item.quantity} x ${item.name}`).join(', ');
  const order = await Order.create({
    orderNumber: generateOrderNumber(),
    customerName: (req.body.customerName || 'Teacher').trim(),
    phone: (req.body.phone || '').trim(),
    rawText: rawText || menuSummaryText,
    parsedItems,
    destination: destination.name,
    destinationCode: destination.code,
    source,
    notes: (req.body.notes || '').trim(),
    totalAmount: calculateTotalAmount(parsedItems) + Number(destination.deliveryFee || 0),
    estimatedReadyMinutes: Number(req.body.estimatedReadyMinutes || settings.averagePrepMinutes || 15),
    status: 'Pending',
    statusTimeline: [{ status: 'Pending', at: new Date() }]
  });

  io.emit('new_order', order);
  await emitSummaryUpdate();
  res.status(201).json({ success: true, order });
});

app.patch('/api/orders/:id/status', async (req, res) => {
  const nextStatus = req.body.status;

  if (!ORDER_STATUSES.includes(nextStatus)) {
    return res.status(400).json({ error: 'Invalid order status.' });
  }

  const order = await Order.findById(req.params.id);

  if (!order) {
    return res.status(404).json({ error: 'Order not found.' });
  }

  order.status = nextStatus;
  order.statusTimeline = [...order.statusTimeline, { status: nextStatus, at: new Date() }];
  if (nextStatus === 'Delivered') {
    order.deliveredAt = new Date();
  }

  await order.save();
  io.emit('order_updated', order);
  await emitSummaryUpdate();
  res.json(order);
});

app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error.' });
});

mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log('MongoDB connected');
    await ensureSeedData();
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error.message);
  });

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
