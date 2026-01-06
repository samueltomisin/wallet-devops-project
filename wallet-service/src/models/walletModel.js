const pool = require('../config/database');

class WalletModel {
  
  // Get wallet by user ID
  static async getWalletByUserId(userId) {
    const query = `
      SELECT w.*, u.username, u.email 
      FROM wallets w
      JOIN users u ON w.user_id = u.id
      WHERE w.user_id = $1
    `;
    
    const result = await pool.query(query, [userId]);
    return result.rows[0]; // Return first row or undefined
  }

  // Get wallet by username
  static async getWalletByUsername(username) {
    const query = `
      SELECT w.*, u.username, u.email 
      FROM wallets w
      JOIN users u ON w.user_id = u.id
      WHERE u.username = $1
    `;
    
    const result = await pool.query(query, [username]);
    return result.rows[0];
  }

  // Update wallet balance
  static async updateBalance(walletId, newBalance) {
    const query = `
      UPDATE wallets 
      SET balance = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    
    const result = await pool.query(query, [newBalance, walletId]);
    return result.rows[0];
  }

  // Create transaction record (audit trail)
  static async createTransaction(transactionData) {
    const { wallet_id, type, amount, reference, description, balance_before, balance_after } = transactionData;
    
    const query = `
      INSERT INTO transactions 
        (wallet_id, type, amount, reference, description, balance_before, balance_after)
      VALUES 
        ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    const values = [wallet_id, type, amount, reference, description, balance_before, balance_after];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Get transaction history
  static async getTransactions(walletId, limit = 50) {
    const query = `
      SELECT * FROM transactions
      WHERE wallet_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `;
    
    const result = await pool.query(query, [walletId, limit]);
    return result.rows;
  }
}

module.exports = WalletModel;