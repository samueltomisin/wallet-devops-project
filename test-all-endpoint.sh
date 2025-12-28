#!/bin/bash

echo "🧪 Testing Wallet App Microservices"
echo "===================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 1. Health Checks
echo -e "\n${BLUE}1. HEALTH CHECKS${NC}"
curl -s http://localhost:3001/health | jq '.'
curl -s http://localhost:3002/health | jq '.'
curl -s http://localhost:3003/health | jq '.'

# 2. Get all users
echo -e "\n${BLUE}2. GET ALL USERS${NC}"
curl -s http://localhost:3001/users | jq '.'

# 3. Get specific user
echo -e "\n${BLUE}3. GET USER INFO${NC}"
curl -s http://localhost:3001/users/user1 | jq '.'

# 4. Check balance
echo -e "\n${BLUE}4. CHECK BALANCE${NC}"
curl -s http://localhost:3001/balance/user1 | jq '.'

# 5. Get bills
echo -e "\n${BLUE}5. GET BILLS${NC}"
curl -s http://localhost:3002/bills/user1 | jq '.'

# 6. Buy airtime
echo -e "\n${BLUE}6. BUY AIRTIME${NC}"
curl -s -X POST http://localhost:3002/buy-airtime \
  -H "Content-Type: application/json" \
  -d '{"userId":"user1","phoneNumber":"08012345678","amount":1000,"provider":"MTN"}' | jq '.'

# 7. Pay bill
echo -e "\n${BLUE}7. PAY BILL${NC}"
curl -s -X POST http://localhost:3002/pay-bill/user1/bill2 | jq '.'

# 8. Generic payment
echo -e "\n${BLUE}8. GENERIC PAYMENT${NC}"
curl -s -X POST http://localhost:3002/pay \
  -H "Content-Type: application/json" \
  -d '{"userId":"user2","amount":5000,"billType":"electricity"}' | jq '.'

# 9. Check notifications
echo -e "\n${BLUE}9. CHECK NOTIFICATIONS${NC}"
curl -s http://localhost:3003/notifications/user1 | jq '.'

# 10. Transfer money
echo -e "\n${BLUE}10. TRANSFER MONEY${NC}"
curl -s -X POST http://localhost:3001/transfer \
  -H "Content-Type: application/json" \
  -d '{"fromUserId":"user2","toUserId":"user3","amount":15000}' | jq '.'

# 11. Final balances
echo -e "\n${BLUE}11. FINAL BALANCES${NC}"
curl -s http://localhost:3001/users | jq '.'

echo -e "\n${GREEN}✅ All tests completed!${NC}"
