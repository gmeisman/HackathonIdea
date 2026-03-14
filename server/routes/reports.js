import express from 'express';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const router = express.Router();

function loadMock() {
  return JSON.parse(readFileSync(join(__dirname, '../mock/reports.json'), 'utf-8'));
}

router.get('/', (req, res) => {
  res.json(loadMock());
});

export default router;
