import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import aiRoute from './routes/ai.js';
import inventoryRoute from './routes/inventory.js';
import listingsRoute from './routes/listings.js';
import ordersRoute from './routes/orders.js';
import supportRoute from './routes/support.js';
import dashboardRoute from './routes/dashboard.js';
import reportsRoute from './routes/reports.js';
import settingsRoute from './routes/settings.js';
import auditRoute from './routes/audit.js';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/ai', aiRoute);
app.use('/api/inventory', inventoryRoute);
app.use('/api/listings', listingsRoute);
app.use('/api/orders', ordersRoute);
app.use('/api/support', supportRoute);
app.use('/api/dashboard', dashboardRoute);
app.use('/api/reports', reportsRoute);
app.use('/api/settings', settingsRoute);
app.use('/api/audit', auditRoute);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
