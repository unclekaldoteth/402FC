const test = require('node:test');
const assert = require('node:assert/strict');

process.env.X402_USE_MOCK = '1';
process.env.NETWORK = process.env.NETWORK || 'testnet';
process.env.STX_ADDRESS =
    process.env.STX_ADDRESS || 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
process.env.FACILITATOR_URL =
    process.env.FACILITATOR_URL || 'https://facilitator.stacksx402.com';

const { createApp } = require('../src/index');

let server;
let baseUrl;

function decodeBase64Json(value) {
    if (!value || typeof value !== 'string') return null;
    try {
        return JSON.parse(Buffer.from(value, 'base64').toString('utf-8'));
    } catch (error) {
        return null;
    }
}

async function start() {
    const app = createApp();
    return new Promise((resolve) => {
        const instance = app.listen(0, '127.0.0.1', () => {
            const address = instance.address();
            resolve({
                server: instance,
                baseUrl: `http://127.0.0.1:${address.port}`,
            });
        });
    });
}

async function stop(instance) {
    if (!instance) return;
    await new Promise((resolve, reject) => {
        instance.close((error) => (error ? reject(error) : resolve()));
    });
}

test.before(async () => {
    const started = await start();
    server = started.server;
    baseUrl = started.baseUrl;
});

test.after(async () => {
    await stop(server);
});

test('x402 stream endpoint preflight returns 402 with v2 payment-required metadata', async () => {
    const response = await fetch(`${baseUrl}/api/streams/premier-league-live-1/watch`);
    assert.equal(response.status, 402);

    const encodedHeader = response.headers.get('payment-required');
    assert.ok(encodedHeader, 'expected payment-required header');

    const decoded = decodeBase64Json(encodedHeader);
    assert.ok(decoded, 'expected base64 payment-required payload');
    assert.equal(decoded.x402Version, 2);
    assert.equal(decoded.accepts?.[0]?.asset, 'STX');
    assert.equal(decoded.accepts?.[0]?.amount, '80000');
    assert.ok(decoded.accepts?.[0]?.payTo);

    const body = await response.json();
    assert.equal(body.x402Version, 2);
    assert.equal(body.accepts?.[0]?.amount, '80000');
});

test('x402 stream endpoint completes two-step flow: preflight then paid retry', async () => {
    const preflight = await fetch(`${baseUrl}/api/streams/premier-league-live-1/watch`);
    assert.equal(preflight.status, 402);

    const encodedHeader = preflight.headers.get('payment-required');
    const paymentRequired = decodeBase64Json(encodedHeader);
    assert.ok(paymentRequired?.accepts?.length, 'expected accepted payment options');

    const paymentSignature = Buffer.from(
        JSON.stringify({
            x402Version: 2,
            resource: paymentRequired.resource,
            accepted: paymentRequired.accepts[0],
            payload: { transaction: '00deadbeef' },
        })
    ).toString('base64');

    const paid = await fetch(`${baseUrl}/api/streams/premier-league-live-1/watch`, {
        headers: {
            'payment-signature': paymentSignature,
        },
    });

    assert.equal(paid.status, 200);
    const paidBody = await paid.json();

    assert.equal(paidBody.streamId, 'premier-league-live-1');
    assert.ok(paidBody.playback?.url, 'expected playback url');
    assert.equal(paidBody.paymentInfo?.amount, '80000');
    assert.ok(paidBody.session?.id, 'expected session id');
});

test('invalid stream ids return 404 before payment challenge', async () => {
    const response = await fetch(`${baseUrl}/api/streams/not-real/watch`);
    assert.equal(response.status, 404);

    const body = await response.json();
    assert.equal(body.error, 'Stream not found');
    assert.equal(response.headers.get('payment-required'), null);
});
