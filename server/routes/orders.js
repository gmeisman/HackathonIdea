import express from 'express';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MOCK_PATH  = join(__dirname, '../mock/orders.json');
const router     = express.Router();

function loadMock() {
  return JSON.parse(readFileSync(MOCK_PATH, 'utf-8'));
}

router.get('/', (req, res) => {
  res.json(loadMock());
});

// Create a new order (used for restock / shipment requests)
router.post('/', (req, res) => {
  const orders = loadMock();
  const newId  = `ORD-${String(orders.length + 1).padStart(3, '0')}`;
  const order  = {
    id:     newId,
    date:   new Date().toISOString().slice(0, 10),
    status: 'processing',
    ...req.body,
  };
  orders.push(order);
  writeFileSync(MOCK_PATH, JSON.stringify(orders, null, 2));
  res.status(201).json(order);
});

export default router;
