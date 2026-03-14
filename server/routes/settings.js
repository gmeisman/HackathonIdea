import express from 'express';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const router = express.Router();
const FILE = join(__dirname, '../mock/settings.json');

router.get('/', (req, res) => {
  res.json(JSON.parse(readFileSync(FILE, 'utf-8')));
});

router.post('/', (req, res) => {
  const settings = req.body;
  writeFileSync(FILE, JSON.stringify(settings, null, 2), 'utf-8');
  res.json(settings);
});

export default router;
