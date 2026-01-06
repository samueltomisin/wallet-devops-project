const pool = require('../config/database');

class BillModel {
  
  // Get all active bill providers
  static async getAllProviders() {
    const query = `
      SELECT * FROM bill_providers 
      WHERE is_active = true 
      ORDER BY category, name
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  // Get providers by category
  static async getProvidersByCategory(category) {
    const query = `
      SELECT * FROM bill_providers 
      WHERE category = $1 AND is_active = true 
      ORDER BY name
    `;
    const result = await pool.query(query, [category]);
    return result.rows;
  }

  // Get provider by ID
  static async getProviderById(providerId) {
    const query = 'SELECT * FROM bill_providers WHERE id = $1';
    const result = await pool.query(query, [providerId]);
    return result.rows[0];
  }

  // Create bill payment record
  static async createPayment(paymentData) {
    const { provider_id, username, amount, account_number, reference, transaction_id, metadata } = paymentData;
    
    const query = `
      INSERT INTO bill_payments 
        (provider_id, username, amount, account_number, reference, transaction_id, metadata, status)
      VALUES 
        ($1, $2, $3, $4, $5, $6, $7, 'completed')
      RETURNING *
    `;
    
    const values = [provider_id, username, amount, account_number, reference, transaction_id, JSON.stringify(metadata)];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Get user's payment history
  static async getPaymentHistory(username, limit = 50) {
    const query = `
      SELECT 
        bp.*,
        pr.name as provider_name,
        pr.category as provider_category
      FROM bill_payments bp
      JOIN bill_providers pr ON bp.provider_id = pr.id
      WHERE bp.username = $1
      ORDER BY bp.created_at DESC
      LIMIT $2
    `;  
    const result = await pool.query(query, [username, limit]);
    return result.rows;
  }

  // Get payment by reference
  static async getPaymentByReference(reference) {
    const query = `
      SELECT 
        bp.*,
        pr.name as provider_name,
        pr.category as provider_category
      FROM bill_payments bp
      JOIN bill_providers pr ON bp.provider_id = pr.id
      WHERE bp.reference = $1
    `;
    const result = await pool.query(query, [reference]);
    return result.rows[0];
  }
}

module.exports = BillModel;