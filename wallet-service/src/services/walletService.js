const WalletModel = require('../models/walletModel');
const pool = require('../config/database');

class WalletService {
  
  // Get balance for a user
  static async getBalance(username) {
    const wallet = await WalletModel.getWalletByUsername(username);
    
    if (!wallet) {
      throw new Error('Wallet not found');
    }
    
    return {
      username: wallet.username,
      balance: parseFloat(wallet.balance),
      currency: wallet.currency
    };
  }

  // Credit wallet (add money)
  static async creditWallet(username, amount) {
    // Input validation
    if (amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    const wallet = await WalletModel.getWalletByUsername(username);
    
    if (!wallet) {
      throw new Error('Wallet not found');
    }

    const balanceBefore = parseFloat(wallet.balance);
    const newBalance = balanceBefore + amount;

    // Update balance
    const updatedWallet = await WalletModel.updateBalance(wallet.id, newBalance);

    // Create transaction record (audit trail)
    await WalletModel.createTransaction({
      wallet_id: wallet.id,
      type: 'credit',
      amount: amount,
      reference: `CR-${Date.now()}-${wallet.id}`,
      description: 'Wallet credited',
      balance_before: balanceBefore,
      balance_after: newBalance
    });

    return {
      username: wallet.username,
      newBalance: parseFloat(updatedWallet.balance),
      amountCredited: amount
    };
  }

  // Debit wallet (remove money)
  static async debitWallet(username, amount) {
    if (amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    const wallet = await WalletModel.getWalletByUsername(username);
    
    if (!wallet) {
      throw new Error('Wallet not found');
    }

    const balanceBefore = parseFloat(wallet.balance);

    // Check sufficient balance
    if (balanceBefore < amount) {
      throw new Error('Insufficient balance');
    }

    const newBalance = balanceBefore - amount;

    // Update balance
    const updatedWallet = await WalletModel.updateBalance(wallet.id, newBalance);

    // Create transaction record
    await WalletModel.createTransaction({
      wallet_id: wallet.id,
      type: 'debit',
      amount: amount,
      reference: `DB-${Date.now()}-${wallet.id}`,
      description: 'Wallet debited',
      balance_before: balanceBefore,
      balance_after: newBalance
    });

    return {
      username: wallet.username,
      newBalance: parseFloat(updatedWallet.balance),
      amountDebited: amount
    };
  }

  // Transfer between wallets
  static async transfer(fromUsername, toUsername, amount) {
    if (amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    if (fromUsername === toUsername) {
      throw new Error('Cannot transfer to yourself');
    }

    // Get both wallets
    const fromWallet = await WalletModel.getWalletByUsername(fromUsername);
    const toWallet = await WalletModel.getWalletByUsername(toUsername);

    if (!fromWallet) {
      throw new Error('Sender wallet not found');
    }

    if (!toWallet) {
      throw new Error('Recipient wallet not found');
    }

    const fromBalanceBefore = parseFloat(fromWallet.balance);

    // Check sufficient balance
    if (fromBalanceBefore < amount) {
      throw new Error('Insufficient balance');
    }

    // Use database transaction (all or nothing!)
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN'); // Start transaction

      // Deduct from sender
      const fromNewBalance = fromBalanceBefore - amount;
      await client.query(
        'UPDATE wallets SET balance = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [fromNewBalance, fromWallet.id]
      );

      // Add to receiver
      const toBalanceBefore = parseFloat(toWallet.balance);
      const toNewBalance = toBalanceBefore + amount;
      await client.query(
        'UPDATE wallets SET balance = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [toNewBalance, toWallet.id]
      );

      // Record sender transaction
      const reference = `TRF-${Date.now()}`;
      await client.query(
        `INSERT INTO transactions (wallet_id, type, amount, reference, description, balance_before, balance_after)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [fromWallet.id, 'transfer_out', amount, reference, `Transfer to ${toUsername}`, fromBalanceBefore, fromNewBalance]
      );

      // Record receiver transaction
      await client.query(
        `INSERT INTO transactions (wallet_id, type, amount, reference, description, balance_before, balance_after)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [toWallet.id, 'transfer_in', amount, reference, `Transfer from ${fromUsername}`, toBalanceBefore, toNewBalance]
      );

      await client.query('COMMIT'); // Save all changes

      return {
        from: fromUsername,
        to: toUsername,
        amount: amount,
        newBalanceFrom: fromNewBalance,
        newBalanceTo: toNewBalance,
        reference: reference
      };

    } catch (error) {
      await client.query('ROLLBACK'); // Undo all changes if error
      throw error;
    } finally {
      client.release(); // Return connection to pool
    }
  }

  // Get transaction history
  static async getTransactionHistory(username, limit = 50) {
    const wallet = await WalletModel.getWalletByUsername(username);
    
    if (!wallet) {
      throw new Error('Wallet not found');
    }

    const transactions = await WalletModel.getTransactions(wallet.id, limit);
    
    return {
      username: wallet.username,
      transactions: transactions.map(tx => ({
        id: tx.id,
        type: tx.type,
        amount: parseFloat(tx.amount),
        reference: tx.reference,
        description: tx.description,
        balanceBefore: parseFloat(tx.balance_before),
        balanceAfter: parseFloat(tx.balance_after),
        date: tx.created_at
      }))
    };
  }
}

module.exports = WalletService;