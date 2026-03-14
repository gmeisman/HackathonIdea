import express from 'express';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const router = express.Router();
const FILE = join(__dirname, '../mock/audit-log.json');

function load() {
  return JSON.parse(readFileSync(FILE, 'utf-8'));
}

function save(data) {
  writeFileSync(FILE, JSON.stringify(data, null, 2), 'utf-8');
}

router.get('/', (req, res) => {
  res.json(load());
});

router.post('/', (req, res) => {
  const entries = load();
  const id = `AUD-${String(entries.length + 1).padStart(3, '0')}`;
  const entry = { id, ...req.body };
  entries.unshift(entry);
  save(entries);
  res.status(201).json(entry);
});

router.put('/:id', (req, res) => {
  const entries = load();
  const idx = entries.findIndex((e) => e.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Entry not found' });
  entries[idx] = { ...entries[idx], ...req.body };
  save(entries);
  res.json(entries[idx]);
});

export default router;
