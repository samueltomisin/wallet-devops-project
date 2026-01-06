const pool = require('../config/database');

class AirtimeModel {
  
  // Create airtime purchase record
  static async createPurchase(purchaseData) {
    const { username, phone_number, network, amount, reference, transaction_id } = purchaseData;
    
    const query = `
      INSERT INTO airtime_purchases 
        (username, phone_number, network, amount, reference, transaction_id, status)
      VALUES 
        ($1, $2, $3, $4, $5, $6, 'completed')
      RETURNING *
    `;
    
    const values = [username, phone_number, network, amount, reference, transaction_id];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Get user's airtime purchase history
  static async getPurchaseHistory(username, limit = 50) {
    const query = `
      SELECT * FROM airtime_purchases
      WHERE username = $1
      ORDER BY created_at DESC
      LIMIT $2
    `;
    const result = await pool.query(query, [username, limit]);
    return result.rows;
  }

  // Get purchase by reference
  static async getPurchaseByReference(reference) {
    const query = 'SELECT * FROM airtime_purchases WHERE reference = $1';
    const result = await pool.query(query, [reference]);
    return result.rows[0];
  }
}

module.exports = AirtimeModel;