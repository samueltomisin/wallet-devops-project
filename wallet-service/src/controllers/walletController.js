const WalletService = require('../services/walletService');

class WalletController {
  
  // GET /wallet/:username/balance
  static async getBalance(req, res) {
    try {
      const { username } = req.params;
      
      const result = await WalletService.getBalance(username);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        error: error.message
      });
    }
  }

  // POST /wallet/credit
  static async creditWallet(req, res) {
    try {
      const { username, amount } = req.body;
      
      // Validation
      if (!username || !amount) {
        return res.status(400).json({
          success: false,
          error: 'Username and amount are required'
        });
      }

      const result = await WalletService.creditWallet(username, parseFloat(amount));
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  // POST /wallet/debit
  static async debitWallet(req, res) {
    try {
      const { username, amount } = req.body;
      
      if (!username || !amount) {
        return res.status(400).json({
          success: false,
          error: 'Username and amount are required'
        });
      }

      const result = await WalletService.debitWallet(username, parseFloat(amount));
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  // POST /wallet/transfer
  static async transfer(req, res) {
    try {
      const { from, to, amount } = req.body;
      
      if (!from || !to || !amount) {
        return res.status(400).json({
          success: false,
          error: 'From, to, and amount are required'
        });
      }

      const result = await WalletService.transfer(from, to, parseFloat(amount));
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  // GET /wallet/:username/transactions
  static async getTransactions(req, res) {
    try {
      const { username } = req.params;
      const limit = parseInt(req.query.limit) || 50;
      
      const result = await WalletService.getTransactionHistory(username, limit);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = WalletController;