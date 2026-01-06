const BillModel = require('../models/billModel');

class BillService {
  
  // Get all bill providers
  static async getAllProviders() {
    const providers = await BillModel.getAllProviders();
    
    // Group by category for easier display
    const grouped = providers.reduce((acc, provider) => {
      if (!acc[provider.category]) {
        acc[provider.category] = [];
      }
      acc[provider.category].push({
        id: provider.id,
        name: provider.name,
        description: provider.description
      });
      return acc;
    }, {});
    
    return grouped;
  }

  // Get providers by category
  static async getProvidersByCategory(category) {
    const validCategories = ['electricity', 'water', 'cable_tv', 'internet', 'insurance'];
    
    if (!validCategories.includes(category)) {
      throw new Error('Invalid bill category');
    }
    
    const providers = await BillModel.getProvidersByCategory(category);
    return providers;
  }

  // Pay a bill
  static async payBill(paymentData) {
    const { username, provider_id, amount, account_number, metadata } = paymentData;

    // Validation
    if (!username || !provider_id || !amount || !account_number) {
      throw new Error('Missing required fields');
    }

    if (amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    // Check if provider exists
    const provider = await BillModel.getProviderById(provider_id);
    if (!provider) {
      throw new Error('Bill provider not found');
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

      // Create payment record
      const reference = `BILL-${Date.now()}-${provider_id}`;
      
      const payment = await BillModel.createPayment({
        provider_id,
        username,
        amount,
        account_number,
        reference,
        transaction_id: reference,
        metadata: metadata || {}
      });

      return {
        success: true,
        payment: {
          id: payment.id,
          provider: provider.name,
          amount: parseFloat(payment.amount),
          account_number: payment.account_number,
          reference: payment.reference,
          status: payment.status,
          date: payment.created_at
        }
      };

    } catch (error) {
      throw new Error(`Payment failed: ${error.message}`);
    }
  }

  // Get payment history
  static async getPaymentHistory(username, limit = 50) {
    const payments = await BillModel.getPaymentHistory(username, limit);
    
    return payments.map(payment => ({
      id: payment.id,
      provider: payment.provider_name,
      category: payment.provider_category,
      amount: parseFloat(payment.amount),
      account_number: payment.account_number,
      reference: payment.reference,
      status: payment.status,
      metadata: payment.metadata,
      date: payment.created_at
    }));
  }
}

module.exports = BillService;