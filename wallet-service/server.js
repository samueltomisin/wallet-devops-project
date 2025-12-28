const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Mock wallet data
let wallets = {
  'user1': { 
    balance: 50000, 
    currency: 'NGN',
    name: 'Adewale Johnson',
    email: 'adewale@example.com'
  },
  'user2': { 
    balance: 120000, 
    currency: 'NGN',
    name: 'Chioma Okafor',
    email: 'chioma@example.com'
  },
  'user3': { 
    balance: 75000, 
    currency: 'NGN',
    name: 'Ibrahim Nasiru',
    email: 'emeka@example.com'
  }
};

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'wallet-service',
    timestamp: new Date().toISOString()
  });
});

// Get all users
app.get('/users', (req, res) => {
  const users = Object.entries(wallets).map(([userId, wallet]) => ({
    userId,
    name: wallet.name,
    email: wallet.email,
    balance: wallet.balance,
    currency: wallet.currency
  }));

  console.log(`[WALLET] Fetched ${users.length} users`);
  res.json({ users });
});

// Get specific user
app.get('/users/:userId', (req, res) => {
  const { userId } = req.params;
  const wallet = wallets[userId];

  if (!wallet) {
    return res.status(404).json({ 
      success: false,
      message: 'User not found' 
    });
  }

  console.log(`[WALLET] User info for ${userId}`);
  res.json({
    userId,
    name: wallet.name,
    email: wallet.email,
    balance: wallet.balance,
    currency: wallet.currency
  });
});

// Get balance
app.get('/balance/:userId', (req, res) => {
  const { userId } = req.params;
  const wallet = wallets[userId];

  if (!wallet) {
    return res.status(404).json({ 
      success: false,
      message: 'Wallet not found' 
    });
  }

  console.log(`[WALLET] Balance check for ${userId}: ₦${wallet.balance.toLocaleString()}`);
  res.json({
    userId,
    balance: wallet.balance,
    currency: wallet.currency,
    formattedBalance: `₦${wallet.balance.toLocaleString()}`
  });
});

// Deduct from balance
app.post('/deduct', (req, res) => {
  const { userId, amount } = req.body;

  if (!userId || amount === undefined) {
    return res.status(400).json({ 
      success: false,
      message: 'Missing required fields: userId, amount' 
    });
  }

  if (amount <= 0) {
    return res.status(400).json({ 
      success: false,
      message: 'Amount must be greater than 0' 
    });
  }

  const wallet = wallets[userId];

  if (!wallet) {
    return res.status(404).json({ 
      success: false,
      message: 'Wallet not found' 
    });
  }

  if (wallet.balance < amount) {
    return res.status(400).json({ 
      success: false,
      message: `Insufficient balance. Available: ₦${wallet.balance.toLocaleString()}, Required: ₦${amount.toLocaleString()}` 
    });
  }

  wallet.balance -= amount;
  console.log(`[WALLET] ✅ Deducted ₦${amount.toLocaleString()} from ${userId} (${wallet.name})`);
  console.log(`[WALLET] New balance: ₦${wallet.balance.toLocaleString()}`);

  res.json({
    success: true,
    message: 'Deduction successful',
    newBalance: wallet.balance,
    deducted: amount,
    formattedBalance: `₦${wallet.balance.toLocaleString()}`
  });
});

// Credit balance
app.post('/credit', (req, res) => {
  const { userId, amount } = req.body;

  if (!userId || amount === undefined) {
    return res.status(400).json({ 
      success: false,
      message: 'Missing required fields: userId, amount' 
    });
  }

  if (amount <= 0) {
    return res.status(400).json({ 
      success: false,
      message: 'Amount must be greater than 0' 
    });
  }
  
  if (!wallets[userId]) {
    wallets[userId] = { 
      balance: 0, 
      currency: 'NGN',
      name: 'New User',
      email: 'newuser@example.com'
    };
  }

  wallets[userId].balance += amount;
  console.log(`[WALLET] ✅ Credited ₦${amount.toLocaleString()} to ${userId}`);
  console.log(`[WALLET] New balance: ₦${wallets[userId].balance.toLocaleString()}`);

  res.json({
    success: true,
    message: 'Credit successful',
    newBalance: wallets[userId].balance,
    credited: amount,
    formattedBalance: `₦${wallets[userId].balance.toLocaleString()}`
  });
});

// Transfer
app.post('/transfer', (req, res) => {
  const { fromUserId, toUserId, amount } = req.body;

  if (!fromUserId || !toUserId || amount === undefined) {
    return res.status(400).json({ 
      success: false,
      message: 'Missing required fields: fromUserId, toUserId, amount' 
    });
  }

  if (amount <= 0) {
    return res.status(400).json({ 
      success: false,
      message: 'Amount must be greater than 0' 
    });
  }

  const fromWallet = wallets[fromUserId];
  const toWallet = wallets[toUserId];

  if (!fromWallet) {
    return res.status(404).json({ 
      success: false,
      message: 'Sender wallet not found' 
    });
  }

  if (!toWallet) {
    return res.status(404).json({ 
      success: false,
      message: 'Recipient wallet not found' 
    });
  }

  if (fromWallet.balance < amount) {
    return res.status(400).json({ 
      success: false,
      message: `Insufficient balance. Available: ₦${fromWallet.balance.toLocaleString()}` 
    });
  }

  fromWallet.balance -= amount;
  toWallet.balance += amount;

  console.log(`[WALLET] ✅ Transfer: ${fromUserId} → ${toUserId}, ₦${amount.toLocaleString()}`);

  res.json({
    success: true,
    message: 'Transfer successful',
    transfer: {
      from: fromUserId,
      to: toUserId,
      amount,
      fromBalance: fromWallet.balance,
      toBalance: toWallet.balance
    }
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Wallet Service running on port ${PORT}`);
  console.log(`💰 Managing ${Object.keys(wallets).length} wallets`);
});