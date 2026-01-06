const express = require('express');
const WalletController = require('../controllers/walletController');

const router = express.Router();

// Wallet routes
router.get('/:username/balance', WalletController.getBalance);
router.post('/credit', WalletController.creditWallet);
router.post('/debit', WalletController.debitWallet);
router.post('/transfer', WalletController.transfer);
router.get('/:username/transactions', WalletController.getTransactions);

module.exports = router;