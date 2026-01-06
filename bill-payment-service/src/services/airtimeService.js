const AirtimeModel = require('../models/airtimeModel');

class AirtimeService {
  
  // Buy airtime
  static async buyAirtime(purchaseData) {
    const { username, phone_number, network, amount } = purchaseData;

    // Validation
    if (!username || !phone_number || !network || !amount) {
      throw new Error('Missing required fields');
    }

    if (amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    const validNetworks = ['MTN', 'Airtel', 'Glo', '9mobile'];
    if (!validNetworks.includes(network)) {
      throw new Error('Invalid network. Must be one of: MTN, Airtel, Glo, 9mobile');
    }

    // Validate phone number format (Nigerian numbers)
    const phoneRegex = /^(\+?234|0)[789]\d{9}$/;
    if (!phoneRegex.test(phone_number)) {
      throw new Error('Invalid Nigerian phone number format');
    }

    // Call wallet service to deduct money
    const walletServiceUrl = process.env.WALLET_SERVICE_URL || 'http://wallet-service:3001';
    
    try {
      const walletResponse = await fetch(`${walletServiceUrl}/wallet/debit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, amount })
      });

      const walletData = await walletResponse.json();

      if (!walletData.success) {
        throw new Error(walletData.error || 'Failed to deduct from wallet');
      }

      // Create airtime purchase record
      const reference = `AIRTIME-${Date.now()}-${network}`;
      
      const purchase = await AirtimeModel.createPurchase({
        username,
        phone_number,
        network,
        amount,
        reference,
        transaction_id: reference
      });

      return {
        success: true,
        purchase: {
          id: purchase.id,
          phone_number: purchase.phone_number,
          network: purchase.network,
          amount: parseFloat(purchase.amount),
          reference: purchase.reference,
          status: purchase.status,
          date: purchase.created_at
        }
      };

    } catch (error) {
      throw new Error(`Airtime purchase failed: ${error.message}`);
    }
  }

  // Get purchase history
  static async getPurchaseHistory(username, limit = 50) {
    const purchases = await AirtimeModel.getPurchaseHistory(username, limit);
    
    return purchases.map(purchase => ({
      id: purchase.id,
      phone_number: purchase.phone_number,
      network: purchase.network,
      amount: parseFloat(purchase.amount),
      reference: purchase.reference,
      status: purchase.status,
      date: purchase.created_at
    }));
  }
}

module.exports = AirtimeService;