import express from 'express';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MOCK_PATH  = join(__dirname, '../mock/support.json');
const router     = express.Router();

function loadMock() {
  return JSON.parse(readFileSync(MOCK_PATH, 'utf-8'));
}

router.get('/', (req, res) => {
  res.json(loadMock());
});

// Update a ticket (status, resolved reply, etc.)
router.put('/:id', (req, res) => {
  const tickets = loadMock();
  const idx     = tickets.findIndex((t) => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Ticket not found' });
  tickets[idx] = { ...tickets[idx], ...req.body };
  writeFileSync(MOCK_PATH, JSON.stringify(tickets, null, 2));
  res.json(tickets[idx]);
});

export default router;
