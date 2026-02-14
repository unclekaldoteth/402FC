const STACKS_CONNECT_STORAGE_KEY = '@stacks/connect';

function isBrowser() {
    return typeof window !== 'undefined';
}

function normalizeAddress(value) {
    if (typeof value !== 'string') return null;
    const normalized = value.trim().toUpperCase();
    if (!normalized) return null;
    return /^S[PT][A-Z0-9]{20,}$/u.test(normalized) ? normalized : null;
}

function readStorage() {
    if (!isBrowser()) return null;
    try {
        const raw = window.localStorage.getItem(STACKS_CONNECT_STORAGE_KEY);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch (error) {
        return null;
    }
}

function writeStorage(address) {
    if (!isBrowser()) return;
    const data = {
        addresses: {
            stx: [{ address }],
        },
    };
    window.localStorage.setItem(STACKS_CONNECT_STORAGE_KEY, JSON.stringify(data));
}

function defaultAddressForNetwork(network) {
    return network === 'mainnet'
        ? 'SP000000000000000000002Q6VF78'
        : 'ST000000000000000000002AMW42H';
}

export async function connect(options = {}) {
    if (!isBrowser()) {
        throw new Error('Stacks connect shim is browser-only.');
    }

    const network = options?.network === 'mainnet' ? 'mainnet' : 'testnet';
    const entered = window.prompt(
        `Enter your ${network} STX wallet address`,
        defaultAddressForNetwork(network)
    );
    const normalized = normalizeAddress(entered || '');

    if (!normalized) {
        throw new Error('Wallet connection cancelled');
    }

    writeStorage(normalized);
    return {
        addresses: [{ address: normalized, publicKey: '', symbol: 'STX' }],
    };
}

export function getLocalStorage() {
    return readStorage();
}

export function disconnect() {
    if (!isBrowser()) return;
    window.localStorage.removeItem(STACKS_CONNECT_STORAGE_KEY);
}

export async function request(method) {
    if (method === 'stx_getAccounts') {
        const stored = readStorage();
        const address = stored?.addresses?.stx?.[0]?.address || null;
        if (!address) return { accounts: [] };
        return { accounts: [{ address, publicKey: '' }] };
    }
    if (method === 'stx_signTransaction') {
        throw new Error('Wallet signing is unavailable in shim mode.');
    }
    throw new Error(`Unsupported shim request method: ${method}`);
}

export async function signX402Payment(paymentRequest) {
    const accepted = Array.isArray(paymentRequest?.accepts) ? paymentRequest.accepts[0] : null;
    if (!accepted) throw new Error('No payment options available');

    const stored = readStorage();
    const payer = stored?.addresses?.stx?.[0]?.address;
    if (!payer) throw new Error('Wallet connection required');

    const payload = {
        x402Version: 2,
        resource: paymentRequest.resource || {
            url: '',
            description: 'Local shim payment',
        },
        accepted,
        payload: {
            // This is a local/demo placeholder, not a real signed tx.
            transaction: btoa(`${payer}:${accepted.payTo}:${accepted.amount}:${Date.now()}`),
        },
    };

    return btoa(JSON.stringify(payload));
}
