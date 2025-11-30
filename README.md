# DevOps Wallet Project

A microservices-based wallet application for learning DevOps practices.

## Architecture

- **Wallet Service** (Port 3001): Manages user balances
- **Bill Payment Service** (Port 3002): Handles airtime purchases
- **Notification Service** (Port 3003): Sends transaction alerts

## Week 1: Getting Started

### Prerequisites
- Node.js installed
- Docker installed
- Git installed

### Running Locally

1. Start Wallet Service:
```bash
cd wallet-service
npm install
npm start
```

2. Start Bill Payment Service (new terminal):
```bash
cd bill-payment-service
npm install
npm start
```

3. Start Notification Service (new terminal):
```bash
cd notification-service
npm install
npm start
```

### Testing the Flow

1. Check balance:
```bash
curl http://localhost:3001/balance/user1
```

2. Buy airtime:
```bash
curl -X POST http://localhost:3002/buy-airtime \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user1",
    "phoneNumber": "08012345678",
    "amount": 100,
    "provider": "MTN"
  }'
```

3. Check notifications:
```bash
curl http://localhost:3003/history/user1
```

## Progress

- [x] Week 1: Basic microservices setup
- [ ] Week 2: Add databases
- [ ] Week 3: Integrate Paystack
- [ ] Week 4: Add monitoring
- [ ] Week 5: CI/CD pipeline
- [ ] Week 6: Chaos engineering
- [ ] Week 7: Frontend & polish

## Learning Goals

This project teaches:
- Microservices architecture
- Docker containerization
- Service-to-service communication
- Database management
- API integration
- Monitoring and logging
- CI/CD pipelines
- Chaos engineering
- Cloud deployment