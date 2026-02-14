require('dotenv').config();
const express = require('express');
const cors = require('cors');
const freeRoutes = require('./routes/free');
const paidRoutes = require('./routes/paid');
const {
  X402_HEADERS,
  NETWORK,
  NETWORK_CAIP2,
  FACILITATOR_URL,
  PAY_TO,
} = require('./middleware/x402');

const PORT = process.env.PORT || 3001;

function createApp() {
  const app = express();

  // Middleware
  app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
    allowedHeaders: [
      'Content-Type',
      X402_HEADERS.PAYMENT_SIGNATURE,
      'x-payment',
      'x-payment-signature',
    ],
    exposedHeaders: [
      X402_HEADERS.PAYMENT_REQUIRED,
      X402_HEADERS.PAYMENT_RESPONSE,
      // legacy/demo headers
      'x-payment-required',
      'x-facilitator-url',
      'x-payment-amount',
      'x-payment-address',
      'x-payment-network',
      'x-payment-asset',
      'x-payment-response',
    ]
  }));
  app.use(express.json());

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      name: '402FC API',
      version: '1.0.0',
      network: NETWORK,
      networkCAIP2: NETWORK_CAIP2,
      timestamp: new Date().toISOString()
    });
  });

  // Mount routes
  app.use('/api', freeRoutes);
  app.use('/api', paidRoutes);

  // Error handler
  app.use((err, req, res, next) => {
    console.error('Server error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}

function startServer(port = PORT) {
  const app = createApp();
  const server = app.listen(port, () => {
    console.log(`\n⚽ 402FC API running on http://localhost:${port}`);
    console.log(`🔗 Network: ${NETWORK} (${NETWORK_CAIP2})`);
    console.log(`💰 Pay-to address: ${PAY_TO || 'NOT SET'}`);
    console.log(`📡 Facilitator: ${FACILITATOR_URL || 'NOT SET'}\n`);
  });
  return server;
}

if (require.main === module) {
  startServer();
}

module.exports = {
  createApp,
  startServer,
};
