const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Mock wallet data (Week 2: replace with database)
let wallets = {
  'user1': { balance: 5000, currency: 'NGN' },
  'user2': { balance: 12000, currency: 'NGN' }
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'wallet-service' });
});

// Get wallet balance
app.get('/balance/:userId', (req, res) => {
  const { userId } = req.params;
  const wallet = wallets[userId];

  if (!wallet) {
    return res.status(404).json({ error: 'Wallet not found' });
  }

  console.log(`[WALLET] Balance check for ${userId}: ${wallet.balance}`);
  res.json({
    userId,
    balance: wallet.balance,
    currency: wallet.currency
  });
});

// Deduct from balance (called by bill-payment-service)
app.post('/deduct', (req, res) => {
  const { userId, amount } = req.body;
  const wallet = wallets[userId];

  if (!wallet) {
    return res.status(404).json({ error: 'Wallet not found' });
  }

  if (wallet.balance < amount) {
    return res.status(400).json({ error: 'Insufficient balance' });
  }

  wallet.balance -= amount;
  console.log(`[WALLET] Deducted ${amount} from ${userId}. New balance: ${wallet.balance}`);

  res.json({
    success: true,
    newBalance: wallet.balance
  });
});

// Add to balance (receive payment)
app.post('/credit', (req, res) => {
  const { userId, amount } = req.body;
  
  if (!wallets[userId]) {
    wallets[userId] = { balance: 0, currency: 'NGN' };
  }

  wallets[userId].balance += amount;
  console.log(`[WALLET] Credited ${amount} to ${userId}. New balance: ${wallets[userId].balance}`);

  res.json({
    success: true,
    newBalance: wallets[userId].balance
  });
});

app.listen(PORT, () => {
  console.log(`✅ Wallet Service running on port ${PORT}`);
});