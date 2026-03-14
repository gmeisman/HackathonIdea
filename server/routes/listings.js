import express from 'express';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const router = express.Router();

const LISTINGS_PATH      = join(__dirname, '../mock/listings.json');
const AUTO_LISTINGS_PATH = join(__dirname, '../mock/auto-listings.json');
const INVENTORY_PATH     = join(__dirname, '../mock/inventory.json');
const SETTINGS_PATH      = join(__dirname, '../mock/settings.json');
const TRENDS_PATH        = join(__dirname, '../mock/market-trends.json');
const AUDIT_PATH         = join(__dirname, '../mock/audit-log.json');

function loadMock()         { return JSON.parse(readFileSync(LISTINGS_PATH, 'utf-8')); }
function loadAutoListings() { return JSON.parse(readFileSync(AUTO_LISTINGS_PATH, 'utf-8')); }
function loadTrends()       { return JSON.parse(readFileSync(TRENDS_PATH, 'utf-8')); }

// ── GET /api/listings ────────────────────────────────────────────────────────
router.get('/', (req, res) => {
  res.json(loadMock());
});

// ── GET /api/listings/market-trends ─────────────────────────────────────────
router.get('/market-trends', (req, res) => {
  res.json(loadTrends());
});

// ── GET /api/listings/auto-listings ─────────────────────────────────────────
router.get('/auto-listings', (req, res) => {
  res.json(loadAutoListings());
});

// ── PUT /api/listings/auto-listings/:id ─────────────────────────────────────
// Approve or reject a pending auto-listing
router.put('/auto-listings/:id', (req, res) => {
  const autoListings = loadAutoListings();
  const idx = autoListings.findIndex((al) => al.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Auto-listing not found' });
  autoListings[idx] = { ...autoListings[idx], ...req.body };
  writeFileSync(AUTO_LISTINGS_PATH, JSON.stringify(autoListings, null, 2));
  res.json(autoListings[idx]);
});

// ── POST /api/listings/auto-evaluate ────────────────────────────────────────
// Sil scans inventory + market trends and generates auto-listing decisions
router.post('/auto-evaluate', (req, res) => {
  const inventory    = JSON.parse(readFileSync(INVENTORY_PATH, 'utf-8'));
  const listings     = loadMock();
  const settings     = JSON.parse(readFileSync(SETTINGS_PATH, 'utf-8'));
  const trends       = loadTrends();
  const autoListings = loadAutoListings();
  const audit        = JSON.parse(readFileSync(AUDIT_PATH, 'utf-8'));

  const results = [];

  for (const item of inventory) {
    // Must have sufficient stock above reorder point
    if (item.stock <= item.reorderPoint) continue;

    const listing       = listings.find((l) => l.sku === item.sku);
    const categoryTrend = trends.categories.find((c) => c.name === item.category);
    if (!categoryTrend || categoryTrend.demandScore < 6.5) continue;

    // Determine autonomy mode (category override takes precedence)
    const autonomyMode = settings.categoryOverrides?.[item.category] || settings.autonomyMode;
    if (autonomyMode === 'manual') continue;

    for (const channel of ['eBay', 'Amazon']) {
      const channelKey = channel === 'eBay' ? 'ebayStatus' : 'amazonStatus';

      // Skip if already actively listed on this channel
      if (listing && listing[channelKey] === 'active') continue;

      // Skip if already have a non-rejected auto-listing for this sku+channel
      const existing = autoListings.find(
        (al) => al.sku === item.sku && al.channel === channel && al.status !== 'rejected'
      );
      if (existing) continue;

      // Only proceed if channel is a strong fit (best category or hot product entry)
      const channelInsight = trends.channelInsights[channel];
      const isBestCategory = channelInsight.bestCategories.includes(item.category);
      const hotEntry       = trends.hotProducts.find((hp) => hp.sku === item.sku && hp.channel === channel);
      if (!isBestCategory && !hotEntry) continue;

      const recommendedPrice = parseFloat((item.sellPrice * 0.97).toFixed(2));
      const status           = autonomyMode === 'full-auto' ? 'auto-posted' : 'pending-approval';

      // Build Sil reasoning string
      let reasoning = `${item.category} category trending ${categoryTrend.trend} with demand score ${categoryTrend.demandScore}/10 (+${categoryTrend.weeklyGrowth > 0 ? '+' : ''}${categoryTrend.weeklyGrowth}% WoW). `;
      if (hotEntry) reasoning += `${item.name} has a ${hotEntry.demandBoost}x demand boost — ${hotEntry.reasonForTrend}. `;
      reasoning += `Stock at ${item.stock} units (above reorder point of ${item.reorderPoint}). `;
      reasoning += `${channel} ${item.category} sell-through rate: ${channelInsight.avgSellThroughRate}%. `;
      reasoning += categoryTrend.insight;

      const newId = `AL-${String(autoListings.length + results.length + 1).padStart(3, '0')}`;
      const entry = {
        id:               newId,
        sku:              item.sku,
        productName:      item.name,
        channel,
        recommendedPrice,
        status,
        silReasoning:     reasoning,
        trendData: {
          demandScore:  categoryTrend.demandScore,
          weeklyGrowth: categoryTrend.weeklyGrowth,
          category:     item.category,
        },
        createdAt: new Date().toISOString(),
        revenue:   0,
      };
      results.push(entry);

      // If auto-posted, add audit log entry immediately
      if (status === 'auto-posted') {
        const auditId = `AUD-${String(audit.length + results.length).padStart(3, '0')}`;
        audit.unshift({
          id:         auditId,
          timestamp:  entry.createdAt,
          actionType: 'auto-listing',
          item:       item.name,
          sku:        item.sku,
          amount:     0,
          reasoning,
          status:     'auto-executed',
          channel,
        });
      }
    }
  }

  if (results.length > 0) {
    writeFileSync(AUTO_LISTINGS_PATH, JSON.stringify([...autoListings, ...results], null, 2));
    writeFileSync(AUDIT_PATH, JSON.stringify(audit, null, 2));
  }

  res.json({ evaluated: results.length, listings: results });
});

export default router;
