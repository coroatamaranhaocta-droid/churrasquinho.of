import express from 'express';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

// Middleware for parsing large JSON payloads (since we support base64 upload for receipts)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const DATA_DIR = path.join(process.cwd(), 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR);
}

// Serve uploaded receipts statically
app.use('/uploads', express.static(UPLOADS_DIR));

// Helper functions for reading/writing data
const readJSONFile = <T>(filename: string, defaultValue: T): T => {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2));
    return defaultValue;
  }
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data) as T;
  } catch (err) {
    console.error(`Error reading ${filename}:`, err);
    return defaultValue;
  }
};

const writeJSONFile = <T>(filename: string, data: T): void => {
  const filePath = path.join(DATA_DIR, filename);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(`Error writing ${filename}:`, err);
  }
};

// ==================== API ENDPOINTS ====================

// 1. PRODUCTS
app.get('/api/products', (req, res) => {
  const products = readJSONFile('products.json', []);
  res.json(products);
});

app.post('/api/products', (req, res) => {
  const products: any[] = readJSONFile('products.json', []);
  const newProduct = {
    id: String(Date.now()),
    stock: 50,
    ...req.body
  };
  products.push(newProduct);
  writeJSONFile('products.json', products);
  res.status(201).json(newProduct);
});

app.put('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const products: any[] = readJSONFile('products.json', []);
  const index = products.findIndex(p => p.id === id);
  if (index !== -1) {
    products[index] = { ...products[index], ...req.body };
    writeJSONFile('products.json', products);
    res.json(products[index]);
  } else {
    res.status(404).json({ error: 'Product not found' });
  }
});

app.delete('/api/products/:id', (req, res) => {
  const { id } = req.params;
  let products: any[] = readJSONFile('products.json', []);
  products = products.filter(p => p.id !== id);
  writeJSONFile('products.json', products);
  res.json({ success: true });
});

// 2. COUPONS
app.get('/api/coupons', (req, res) => {
  const coupons = readJSONFile('coupons.json', []);
  res.json(coupons);
});

app.post('/api/coupons', (req, res) => {
  const coupons: any[] = readJSONFile('coupons.json', []);
  const newCoupon = {
    ...req.body,
    isActive: true
  };
  // Prevent duplicate codes
  const exists = coupons.some(c => c.code.toUpperCase() === newCoupon.code.toUpperCase());
  if (exists) {
    res.status(400).json({ error: 'Coupon code already exists' });
    return;
  }
  newCoupon.code = newCoupon.code.toUpperCase();
  coupons.push(newCoupon);
  writeJSONFile('coupons.json', coupons);
  res.status(201).json(newCoupon);
});

app.delete('/api/coupons/:code', (req, res) => {
  const { code } = req.params;
  let coupons: any[] = readJSONFile('coupons.json', []);
  coupons = coupons.filter(c => c.code.toUpperCase() !== code.toUpperCase());
  writeJSONFile('coupons.json', coupons);
  res.json({ success: true });
});

// 3. CONFIGS
app.get('/api/configs', (req, res) => {
  const defaultConfigs = {
    pixKey: 'coroata.maranhao.cta@gmail.com',
    whatsappNumber: '5599984545370',
    deliveryFee: 5.00,
    businessOpen: true,
    promoBannerText: '🔥 PEDIDO ONLINE COM ENTREGA RÁPIDA E NA BRASA! Use o cupom CHEF10 e ganhe 10% de desconto!'
  };
  const configs = readJSONFile('configs.json', defaultConfigs);
  res.json(configs);
});

app.put('/api/configs', (req, res) => {
  const configs = readJSONFile('configs.json', {});
  const newConfigs = { ...configs, ...req.body };
  writeJSONFile('configs.json', newConfigs);
  res.json(newConfigs);
});

// 4. ORDERS (GET with filters, POST, status PUT)
app.get('/api/orders', (req, res) => {
  const orders: any[] = readJSONFile('orders.json', []);
  const { startDate, endDate } = req.query;

  let filtered = [...orders];
  if (startDate) {
    filtered = filtered.filter(o => new Date(o.createdAt) >= new Date(startDate as string));
  }
  if (endDate) {
    // Extend end date to the end of that day (23:59:59)
    const end = new Date(endDate as string);
    end.setHours(23, 59, 59, 999);
    filtered = filtered.filter(o => new Date(o.createdAt) <= end);
  }

  // Sort by date descending (newest first)
  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json(filtered);
});

app.post('/api/orders', (req, res) => {
  const orders: any[] = readJSONFile('orders.json', []);
  const products: any[] = readJSONFile('products.json', []);

  // Generate automated order number
  let nextId = '00101';
  if (orders.length > 0) {
    // Find maximum numeric order ID
    const maxNum = Math.max(...orders.map(o => parseInt(o.id.replace('#', ''), 10) || 0));
    if (maxNum > 0) {
      nextId = String(maxNum + 1).padStart(5, '0');
    }
  }

  const {
    customerName,
    phone,
    address,
    reference,
    items,
    subtotal,
    discount,
    total,
    paymentMethod,
    paymentDetails,
    couponCode
  } = req.body;

  // Decrease stock & validate
  const updatedProducts = [...products];
  for (const item of items) {
    const prod = updatedProducts.find(p => p.id === String(item.productId));
    if (prod) {
      prod.stock = Math.max(0, prod.stock - item.quantity);
    }
  }
  writeJSONFile('products.json', updatedProducts);

  const newOrder = {
    id: nextId,
    createdAt: new Date().toISOString(),
    customerName,
    phone,
    address,
    reference,
    items,
    subtotal,
    discount,
    total: Number(total),
    paymentMethod,
    paymentDetails,
    status: 'pending',
    couponCode
  };

  orders.push(newOrder);
  writeJSONFile('orders.json', orders);

  res.status(201).json(newOrder);
});

app.put('/api/orders/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const orders: any[] = readJSONFile('orders.json', []);
  const index = orders.findIndex(o => o.id === id);

  if (index !== -1) {
    orders[index].status = status;
    writeJSONFile('orders.json', orders);
    res.json(orders[index]);
  } else {
    res.status(404).json({ error: 'Order not found' });
  }
});

// 5. BASE64 IMAGES UPLOAD (for PIX receipts)
app.post('/api/upload-receipt', (req, res) => {
  const { fileName, fileData } = req.body;
  if (!fileName || !fileData) {
    res.status(400).json({ error: 'Missing filename or fileData' });
    return;
  }

  try {
    // Strip header if present
    const cleanData = fileData.replace(/^data:image\/\w+;base64,|^data:application\/pdf;base64,/, '');
    const buffer = Buffer.from(cleanData, 'base64');

    // Generate safe distinct filename
    const sanitizedName = String(Date.now()) + '_' + fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const destPath = path.join(UPLOADS_DIR, sanitizedName);

    fs.writeFileSync(destPath, buffer);

    // Return URL path
    res.status(200).json({ url: `/uploads/${sanitizedName}` });
  } catch (err) {
    console.error('Error saving uploaded file:', err);
    res.status(500).json({ error: 'Failed to write uploaded file' });
  }
});

// ==================== FRONTEND DEV/PROD MIDDLEWARE ====================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Churrasquinho Do Chef API & Web server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
