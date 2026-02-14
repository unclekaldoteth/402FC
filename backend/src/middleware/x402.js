/**
 * x402-stacks payment middleware configuration for 402FC
 * Each export wraps an Express route with x402 payment requirements.
 */

let paymentMiddleware;
let x402Available = false;
let X402_HEADERS = {
    PAYMENT_REQUIRED: 'payment-required',
    PAYMENT_SIGNATURE: 'payment-signature',
    PAYMENT_RESPONSE: 'payment-response',
};
let STACKS_NETWORKS = {
    MAINNET: 'stacks:1',
    TESTNET: 'stacks:2147483648',
};
const FORCE_MOCK_X402 = process.env.X402_USE_MOCK === '1';

if (FORCE_MOCK_X402) {
    console.warn('⚠️  X402_USE_MOCK=1, forcing mock payment middleware');
} else {
    try {
        const x402 = require('x402-stacks');
        paymentMiddleware = x402.paymentMiddleware;
        X402_HEADERS = x402.X402_HEADERS || X402_HEADERS;
        STACKS_NETWORKS = x402.STACKS_NETWORKS || STACKS_NETWORKS;
        x402Available = true;
        console.log('✅ x402-stacks loaded successfully');
    } catch (err) {
        console.warn('⚠️  x402-stacks not available, using mock payment middleware');
        console.warn('   This means paid routes will return mock 402 responses.');
    }
}

function resolveStacksNetwork(value) {
    const normalized = String(value || 'testnet').trim().toLowerCase();
    if (normalized === 'mainnet' || normalized === String(STACKS_NETWORKS.MAINNET).toLowerCase()) {
        return { networkName: 'mainnet', networkCAIP2: STACKS_NETWORKS.MAINNET };
    }
    if (normalized === 'testnet' || normalized === String(STACKS_NETWORKS.TESTNET).toLowerCase()) {
        return { networkName: 'testnet', networkCAIP2: STACKS_NETWORKS.TESTNET };
    }
    return { networkName: 'testnet', networkCAIP2: STACKS_NETWORKS.TESTNET };
}

const resolvedNetwork = resolveStacksNetwork(process.env.NETWORK);
const NETWORK = resolvedNetwork.networkName;
const NETWORK_CAIP2 = resolvedNetwork.networkCAIP2;
const PAY_TO = process.env.STX_ADDRESS || 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
const FACILITATOR_URL = process.env.FACILITATOR_URL || 'https://facilitator.stacksx402.com';
const ASSET = 'STX';
const MAX_TIMEOUT_SECONDS = 300;

// Price tiers in microSTX
const PRICES = {
    highlights: '50000',   // 0.05 STX
    analytics: '30000',    // 0.03 STX
    aiSummary: '20000',    // 0.02 STX
    streamWatch: '80000',  // 0.08 STX
};

function encodeBase64Json(value) {
    try {
        return Buffer.from(JSON.stringify(value), 'utf-8').toString('base64');
    } catch (error) {
        return null;
    }
}

function createPaymentRequiredV2(req, amount, description) {
    return {
        x402Version: 2,
        resource: {
            url: `${req.protocol}://${req.get('host')}${req.originalUrl}`,
            description,
        },
        accepts: [
            {
                scheme: 'exact',
                network: NETWORK_CAIP2,
                amount,
                asset: ASSET,
                payTo: PAY_TO,
                maxTimeoutSeconds: MAX_TIMEOUT_SECONDS,
            },
        ],
    };
}

/**
 * Creates a payment middleware for a given price tier.
 * Falls back to a mock 402 response if x402-stacks isn't available.
 */
function createPaymentGate(priceKey, description) {
    const amount = PRICES[priceKey];

    if (x402Available && paymentMiddleware) {
        return paymentMiddleware({
            amount,
            payTo: PAY_TO,
            network: NETWORK_CAIP2,
            facilitatorUrl: FACILITATOR_URL,
            asset: ASSET,
            description: description || `402FC - ${priceKey}`
        });
    }

    // Mock middleware: simulates the 402 flow for development
    return (req, res, next) => {
        const paymentHeader =
            req.headers[X402_HEADERS.PAYMENT_SIGNATURE] ||
            req.headers['x-payment'] ||
            req.headers['x-payment-signature'];

        if (paymentHeader) {
            // If payment header exists, assume valid and continue
            console.log(`💰 Mock payment accepted for: ${priceKey}`);
            const mockResponse = {
                x402Version: 2,
                ok: true,
                network: NETWORK_CAIP2,
                payer: 'mock-payer',
            };
            const encodedResponse = encodeBase64Json(mockResponse);
            if (encodedResponse) {
                res.set(X402_HEADERS.PAYMENT_RESPONSE, encodedResponse);
            }
            res.set('x-payment-response', JSON.stringify(mockResponse));
            next();
            return;
        }

        // Return 402 with payment requirements
        const descriptionText = description || `Unlock ${priceKey}`;
        const paymentRequiredV2 = createPaymentRequiredV2(req, amount, descriptionText);
        const encodedRequired = encodeBase64Json(paymentRequiredV2);
        if (encodedRequired) {
            res.set(X402_HEADERS.PAYMENT_REQUIRED, encodedRequired);
        }

        const paymentRequirements = {
            amount,
            asset: ASSET,
            payTo: PAY_TO,
            network: NETWORK,
            facilitatorUrl: FACILITATOR_URL,
            description: descriptionText,
        };

        res.set('x-payment-required', JSON.stringify(paymentRequirements));
        res.set('x-facilitator-url', FACILITATOR_URL);
        res.set('x-payment-amount', amount);
        res.set('x-payment-address', PAY_TO);
        res.set('x-payment-network', NETWORK);
        res.set('x-payment-asset', ASSET);

        res.status(402).json({
            ...paymentRequiredV2,
            message: descriptionText || `Pay ${parseInt(amount) / 1000000} STX to unlock ${priceKey}`,
            error: 'Payment Required',
            requirements: paymentRequirements
        });
    };
}

module.exports = {
    paidHighlights: createPaymentGate('highlights', 'Unlock Match Highlights Video'),
    paidAnalytics: createPaymentGate('analytics', 'Unlock Deep Match Analytics'),
    paidAISummary: createPaymentGate('aiSummary', 'Unlock AI Match Summary'),
    paidStreaming: createPaymentGate('streamWatch', 'Unlock Live Stream Watch Session'),
    PRICES,
    PAY_TO,
    NETWORK,
    NETWORK_CAIP2,
    FACILITATOR_URL,
    ASSET,
    X402_HEADERS,
    STACKS_NETWORKS,
};
