const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3002;

// Service URLs (change when running in Docker)
const WALLET_SERVICE = process.env.WALLET_SERVICE || 'http://localhost:3001';
const NOTIFICATION_SERVICE = process.env.NOTIFICATION_SERVICE || 'http://localhost:3003';

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'bill-payment-service' });
});

// Buy airtime endpoint
app.post('/buy-airtime', async (req, res) => {
  const { userId, phoneNumber, amount, provider } = req.body;

  console.log(`[BILLS] Airtime purchase request: ${amount} for ${phoneNumber} (${provider})`);

  try {
    // Step 1: Check and deduct from wallet
    const deductResponse = await axios.post(`${WALLET_SERVICE}/deduct`, {
      userId,
      amount
    });

    if (!deductResponse.data.success) {
      return res.status(400).json({ error: 'Payment failed' });
    }

    // Step 2: Simulate airtime purchase (Week 3: integrate Paystack)
    console.log(`[BILLS] Processing ${provider} airtime for ${phoneNumber}...`);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const transactionId = `TXN${Date.now()}`;
    
    // Step 3: Send notification
    try {
      await axios.post(`${NOTIFICATION_SERVICE}/send`, {
        userId,
        message: `Airtime purchase successful! ${amount} NGN sent to ${phoneNumber}`,
        type: 'airtime_success'
      });
    } catch (notifError) {
      console.error('[BILLS] Notification failed:', notifError.message);
      // Don't fail the transaction if notification fails
    }

    console.log(`[BILLS] ✅ Airtime purchase successful: ${transactionId}`);

    res.json({
      success: true,
      transactionId,
      message: 'Airtime purchased successfully',
      amount,
      phoneNumber,
      provider,
      newBalance: deductResponse.data.newBalance
    });

  } catch (error) {
    console.error('[BILLS] Error:', error.message);
    res.status(500).json({
      error: 'Purchase failed',
      details: error.response?.data || error.message
    });
  }
});

// Get available providers
app.get('/providers', (req, res) => {
  res.json({
    providers: [
      { code: 'MTN', name: 'MTN Nigeria' },
      { code: 'AIRTEL', name: 'Airtel Nigeria' },
      { code: 'GLO', name: 'Glo Nigeria' },
      { code: '9MOBILE', name: '9mobile' }
    ]
  });
});

app.listen(PORT, () => {
  console.log(`✅ Bill Payment Service running on port ${PORT}`);
});