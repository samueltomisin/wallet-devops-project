const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(express.json());

// Environment variables
const WALLET_SERVICE_URL = process.env.WALLET_SERVICE_URL || 'http://localhost:3001';
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3003';

// In-memory bills
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

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'bill-payment-service',
    timestamp: new Date().toISOString()
  });
});

// Get bills
app.get('/bills/:userId', (req, res) => {
  const { userId } = req.params;
  const bills = userBills[userId] || [];
  
  console.log(`[BILLS] Fetching bills for ${userId}`);
  
  res.json({
    userId,
    bills,
    totalPending: bills.filter(b => b.status === 'pending').length
  });
});

// Buy airtime
app.post('/buy-airtime', async (req, res) => {
  const { userId, phoneNumber, amount, provider } = req.body;
  
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
  
  console.log(`[BILLS] Airtime: ₦${amount} for ${phoneNumber} (${provider})`);
  
  try {
    // Deduct from wallet
    console.log(`[BILLS] Calling wallet: ${WALLET_SERVICE_URL}/deduct`);
    const { data: walletData } = await axios.post(`${WALLET_SERVICE_URL}/deduct`, {
      userId,
      amount
    });
    
    console.log(`[BILLS] Deducted. New balance: ₦${walletData.newBalance.toLocaleString()}`);
    
    // External API (mock)
    await axios.post('https://jsonplaceholder.typicode.com/posts', {
      userId, phoneNumber, amount, provider, timestamp: new Date().toISOString()
    });
    
    console.log(`[BILLS] External API called`);
    
    // Send notification
    try {
      await axios.post(`${NOTIFICATION_SERVICE_URL}/notify`, {
        userId,
        message: `Airtime purchase of ₦${amount.toLocaleString()} for ${phoneNumber} (${provider}) successful`,
        type: 'airtime_success'
      });
      console.log('[BILLS] Notification sent ✅');
    } catch (notifError) {
      console.error('[BILLS] Notification failed (non-critical)');
    }
    
    const transactionId = `TXN-${Date.now()}`;
    
    console.log(`[BILLS] ✅ Transaction ${transactionId} completed`);
    
    res.json({
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
    });
    
  } catch (error) {
    console.error(`[BILLS] Error:`, error.message);
    
    res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data?.message || 'Airtime purchase failed',
      error: error.message
    });
  }
});

// Pay specific bill
app.post('/pay-bill/:userId/:billId', async (req, res) => {
  const { userId, billId } = req.params;
  
  console.log(`[BILLS] Payment: user ${userId}, bill ${billId}`);
  
  const bills = userBills[userId];
  if (!bills) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  
  const bill = bills.find(b => b.id === billId);
  if (!bill) {
    return res.status(404).json({ success: false, message: 'Bill not found' });
  }
  
  if (bill.status === 'paid') {
    return res.status(400).json({ success: false, message: 'Bill already paid' });
  }
  
  try {
    // Deduct
    const { data: walletData } = await axios.post(`${WALLET_SERVICE_URL}/deduct`, {
      userId,
      amount: bill.amount
    });
    
    // Mark paid
    bill.status = 'paid';
    bill.paidAt = new Date().toISOString();
    
    // Notify
    try {
      await axios.post(`${NOTIFICATION_SERVICE_URL}/notify`, {
        userId,
        message: `Bill payment of ₦${bill.amount.toLocaleString()} for ${bill.type} (${bill.provider}) completed`,
        type: 'bill_payment_success'
      });
      console.log('[BILLS] Notification sent ✅');
    } catch (notifError) {
      console.error('[BILLS] Notification failed (non-critical)');
    }
    
    console.log(`[BILLS] ✅ Bill ${billId} paid`);
    
    res.json({
      success: true,
      message: 'Bill paid successfully',
      bill,
      walletBalance: walletData.newBalance
    });
    
  } catch (error) {
    console.error(`[BILLS] Error:`, error.message);
    
    res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data?.message || 'Bill payment failed'
    });
  }
});

// Generic payment
app.post('/pay', async (req, res) => {
  const { userId, amount, billType } = req.body;

  if (!userId || !amount || !billType) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: userId, amount, billType'
    });
  }

  try {
    console.log(`[BILLS] Generic payment: ${userId}, ₦${amount}, ${billType}`);

    // Verify user
    const { data: user } = await axios.get(`${WALLET_SERVICE_URL}/users/${userId}`);
    console.log(`[BILLS] User verified: ${user.name}`);

    // Deduct
    const { data: walletData } = await axios.post(`${WALLET_SERVICE_URL}/deduct`, {
      userId,
      amount
    });

    const payment = {
      id: Date.now(),
      userId,
      amount,
      billType,
      status: 'completed',
      timestamp: new Date().toISOString()
    };

    // Notify
    try {
      await axios.post(`${NOTIFICATION_SERVICE_URL}/notify`, {
        userId,
        message: `Payment of ₦${amount.toLocaleString()} for ${billType} completed`,
        type: 'payment_success'
      });
      console.log('[BILLS] Notification sent ✅');
    } catch (notifError) {
      console.error('[BILLS] Notification failed (non-critical)');
    }

    res.json({ 
      success: true, 
      payment,
      walletBalance: walletData.newBalance,
      message: 'Payment processed and notification sent'
    });

  } catch (error) {
    console.error('[BILLS] Payment failed:', error.message);
    
    res.status(error.response?.status || 500).json({ 
      success: false, 
      message: error.response?.data?.message || 'Payment failed',
      error: error.message
    });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Bill Payment Service running on port ${PORT}`);
  console.log(`🔗 Wallet: ${WALLET_SERVICE_URL}`);
  console.log(`🔗 Notification: ${NOTIFICATION_SERVICE_URL}`);
});