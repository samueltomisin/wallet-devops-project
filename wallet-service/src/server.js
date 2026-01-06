const express = require('express');
const runMigrations = require('./config/runMigrations');
const walletRoutes = require('./routes/walletRoutes');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

app.use('/wallet', walletRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'wallet-service' });
});

// Start server
async function startServer() {
  try {
    // Run database migrations first
    await runMigrations();
    
    app.listen(PORT, () => {
      console.log(`✅ Wallet Service running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
