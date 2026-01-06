const express = require('express');
const runMigrations = require('./config/runMigrations');
const billRoutes = require('./routes/billRoutes');
const airtimeRoutes = require('./routes/airtimeRoutes');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(express.json());

// Routes
app.use('/bills', billRoutes);
app.use('/airtime', airtimeRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'bill-payment-service' });
});

// Start server
async function startServer() {
  try {
    await runMigrations();
    
    app.listen(PORT, () => {
      console.log(`✅ Bill Payment Service running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();