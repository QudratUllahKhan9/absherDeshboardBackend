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

// Har request se pehle DB connection ensure (serverless cold start ke liye)
// NOTE: ye routes se PEHLE registered hona zaroori hai
app.use(async (req, res, next) => {
  try {
    await connectDB();
  } catch (error) {
    // connection fail hua — real error upar log ho chuka hai
  }
  next();
});

// Root URL check (Vercel pe 404 na aaye)
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API chal raha hai',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'not connected',
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    db: mongoose.connection.readyState === 1 ? 'connected' : 'not connected',
  });
});

// Routes correctly mounted under /api/items
app.use('/api/items', itemRoutes);

// Vercel serverless ke liye cached DB connection (har request pe await hota hai)
let connPromise = null;
function connectDB() {
  if (!connPromise) {
    connPromise = mongoose
      .connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 10000,
      })
      .then(() => {
        console.log('[DB] MongoDB connected');
      })
      .catch((error) => {
        connPromise = null; // agle request pe dobara try ho
        console.error('[DB] MongoDB connect FAIL:', error.message);
        throw error;
      });
  }
  return connPromise;
}

// Top-level connect (fail hone pe crash nahi hoga, agle request pe retry hoga)
connectDB().catch(() => {});

// Local dev pe hi listen karte hain, Vercel pe nahi
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`[OK] Server chal raha hai: http://localhost:${PORT}`);
  });
}

// Vercel serverless ke liye app export
module.exports = app;