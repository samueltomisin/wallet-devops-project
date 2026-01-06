const BillService = require('../services/billService');

class BillController {
  
  // GET /bills/providers
  static async getAllProviders(req, res) {
    try {
      const providers = await BillService.getAllProviders();
      
      res.json({
        success: true,
        data: providers
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // GET /bills/providers/:category
  static async getProvidersByCategory(req, res) {
    try {
      const { category } = req.params;
      const providers = await BillService.getProvidersByCategory(category);
      
      res.json({
        success: true,
        data: providers
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  // POST /bills/pay
  static async payBill(req, res) {
    try {
      const result = await BillService.payBill(req.body);
      
      res.json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  // GET /bills/history/:username
  static async getPaymentHistory(req, res) {
    try {
      const { username } = req.params;
      const limit = parseInt(req.query.limit) || 50;
      
      const history = await BillService.getPaymentHistory(username, limit);
      
      res.json({
        success: true,
        data: history
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = BillController;