const AirtimeService = require('../services/airtimeService');

class AirtimeController {
  
  // POST /airtime/buy
  static async buyAirtime(req, res) {
    try {
      const result = await AirtimeService.buyAirtime(req.body);
      
      res.json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  // GET /airtime/history/:username
  static async getPurchaseHistory(req, res) {
    try {
      const { username } = req.params;
      const limit = parseInt(req.query.limit) || 50;
      
      const history = await AirtimeService.getPurchaseHistory(username, limit);
      
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

module.exports = AirtimeController;