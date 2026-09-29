require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dns = require('dns');

const itemRoutes = require('./routes/itemRoutes');

dns.setServers([
  '1.1.1.1',
  '8.8.8.8',
]);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    db: mongoose.connection.readyState === 1 ? 'connected' : 'not connected',
  });
});

// Routes correctly mounted under /api/items
app.use('/api/items', itemRoutes);

// Vercel (serverless) pe listen nahi karte — sirf local dev pe
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('[DB] MongoDB connected');
    if (!process.env.VERCEL) {
      app.listen(PORT, () => {
        console.log(`[OK] Server chal raha hai: http://localhost:${PORT}`);
      });
    }
  })
  .catch((error) => {
    console.error('[DB] MongoDB connect FAIL:', error.message);
    if (!process.env.VERCEL) process.exit(1);
  });

// Vercel serverless ke liye app export
module.exports = app;