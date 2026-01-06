const express = require('express');
const BillController = require('../controllers/billController');

const router = express.Router();

router.get('/providers', BillController.getAllProviders);
router.get('/providers/:category', BillController.getProvidersByCategory);
router.post('/pay', BillController.payBill);
router.get('/history/:username', BillController.getPaymentHistory);

module.exports = router;