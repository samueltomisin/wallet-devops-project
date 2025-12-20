const express = require('express');
const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(express.json());

// Environment variable for wallet service URL (Docker-friendly)
const WALLET_SERVICE_URL = process.env.WALLET_SERVICE_URL || 'http://localhost:3001';

// In-memory storage for bills
const userBills = {
  user1: [
    { id: 'bill1', type: 'electricity', amount: 5000, provider: 'EKEDC', status: 'pending' },
    { id: 'bill2', type: 'water', amount: 2000, provider: 'Lagos Water', status: 'pending' },
    { id: 'bill3', type: 'internet', amount: 10000, provider: 'Spectranet', status: 'paid' }
  ],
  user2: [
    { id: 'bill1', type: 'electricity', amount: 7500, provider: 'IKEDC', status: 'pending' },
    { id: 'bill2', type: 'cable', amount: 3500, provider: 'DSTV', status: 'pending' }
  ]
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'bill-payment-service',
    timestamp: new Date().toISOString()
  });
});

// Get user bills
app.get('/bills/:userId', (req, res) => {
  const { userId } = req.params;
  const bills = userBills[userId] || [];
  
  console.log(`[BILLS] Fetching bills for user: ${userId}`);
  
  res.json({
    userId,
    bills,
    totalPending: bills.filter(b => b.status === 'pending').length
  });
});

// Buy airtime endpoint
app.post('/buy-airtime', async (req, res) => {
  const { userId, phoneNumber, amount, provider } = req.body;
  
  // Validation
  if (!userId || !phoneNumber || !amount || !provider) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: userId, phoneNumber, amount, provider'
    });
  }
  
  if (amount <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Amount must be greater than 0'
    });
  }
  
  console.log(`[BILLS] Airtime purchase request: ${amount} for ${phoneNumber} (${provider})`);
  
  try {
    // Step 1: Check and deduct from wallet
    console.log(`[BILLS] Calling wallet service at: ${WALLET_SERVICE_URL}/deduct`);
    
    const walletResponse = await fetch(`${WALLET_SERVICE_URL}/deduct`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, amount })
    });
    
    if (!walletResponse.ok) {
      const walletError = await walletResponse.json();
      console.log(`[BILLS] Wallet deduction failed:`, walletError);
      return res.status(400).json({
        success: false,
        message: walletError.message || 'Insufficient funds or wallet error'
      });
    }
    
    const walletData = await walletResponse.json();
    console.log(`[BILLS] Wallet deduction successful. New balance: ${walletData.newBalance}`);
    
    // Step 2: Call external provider API (mocked)
    console.log(`[BILLS] Calling external provider API...`);
    
    const externalResponse = await fetch('https://jsonplaceholder.typicode.com/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        phoneNumber,
        amount,
        provider,
        timestamp: new Date().toISOString()
      })
    });
    
    const externalData = await externalResponse.json();
    console.log(`[BILLS] External API response received`);
    
    // Step 3: Generate transaction
    const transactionId = `TXN-${Date.now()}`;
    
    const response = {
      success: true,
      transactionId,
      message: 'Airtime purchase successful',
      details: {
        userId,
        phoneNumber,
        amount,
        provider,
        timestamp: new Date().toISOString(),
        walletBalance: walletData.newBalance
      }
    };
    
    console.log(`[BILLS] ✅ Transaction ${transactionId} completed successfully`);
    
    res.json(response);
    
  } catch (error) {
    console.error(`[BILLS] Error:`, error.message);
    
    res.status(500).json({
      success: false,
      message: 'Airtime purchase failed',
      error: error.message
    });
  }
});

// Pay bill endpoint
app.post('/pay-bill', async (req, res) => {
  const { userId, billId } = req.body;
  
  if (!userId || !billId) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: userId, billId'
    });
  }
  
  const bills = userBills[userId] || [];
  const bill = bills.find(b => b.id === billId);
  
  if (!bill) {
    return res.status(404).json({
      success: false,
      message: 'Bill not found'
    });
  }
  
  if (bill.status === 'paid') {
    return res.status(400).json({
      success: false,
      message: 'Bill already paid'
    });
  }
  
  console.log(`[BILLS] Payment request for bill ${billId}: ${bill.amount}`);
  
  try {
    // Deduct from wallet
    const walletResponse = await fetch(`${WALLET_SERVICE_URL}/deduct`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, amount: bill.amount })
    });
    
    if (!walletResponse.ok) {
      const walletError = await walletResponse.json();
      return res.status(400).json({
        success: false,
        message: walletError.message || 'Insufficient funds'
      });
    }
    
    const walletData = await walletResponse.json();
    
    // Mark bill as paid
    bill.status = 'paid';
    bill.paidAt = new Date().toISOString();
    
    console.log(`[BILLS] ✅ Bill ${billId} paid successfully`);
    
    res.json({
      success: true,
      message: 'Bill paid successfully',
      bill,
      walletBalance: walletData.newBalance
    });
    
  } catch (error) {
    console.error(`[BILLS] Error paying bill:`, error.message);
    
    res.status(500).json({
      success: false,
      message: 'Bill payment failed',
      error: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Bill Payment Service running on port ${PORT}`);
  console.log(`🔗 Wallet service URL: ${WALLET_SERVICE_URL}`);
});