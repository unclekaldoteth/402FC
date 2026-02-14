const STACKS_CONNECT_STORAGE_KEY = '@stacks/connect';

const PREFERRED_PROVIDER_IDS = [
    'LeatherProvider',
    'XverseProviders.BitcoinProvider',
    'WalletConnectProvider',
];

const lastKnownSigner = {
    address: null,
    publicKey: null,
};

let connectSdkPromise = null;
let transactionsSdkPromise = null;
let networkSdkPromise = null;

function isBrowser() {
    return typeof window !== 'undefined';
}

function decodeHexToUtf8(hexValue) {
    if (typeof hexValue !== 'string' || !hexValue) return null;
    if (!/^[0-9a-fA-F]+$/u.test(hexValue) || hexValue.length % 2 !== 0) return null;
    try {
        const bytes = new Uint8Array(hexValue.length / 2);
        for (let i = 0; i < hexValue.length; i += 2) {
            bytes[i / 2] = Number.parseInt(hexValue.slice(i, i + 2), 16);
        }
        if (typeof TextDecoder !== 'undefined') {
            return new TextDecoder().decode(bytes);
        }
        if (typeof Buffer !== 'undefined') {
            return Buffer.from(bytes).toString('utf-8');
        }
        return null;
    } catch (error) {
        return null;
    }
}

function readConnectStorageSnapshot() {
    if (!isBrowser()) return null;
    try {
        const raw = window.localStorage.getItem(STACKS_CONNECT_STORAGE_KEY);
        if (!raw) return null;
        if (raw.trim().startsWith('{')) return JSON.parse(raw);

        const decoded = decodeHexToUtf8(raw);
        if (!decoded) return null;
        return JSON.parse(decoded);
    } catch (error) {
        return null;
    }
}

async function getConnectSdk() {
    if (!connectSdkPromise) {
        connectSdkPromise = import('@stacks/connect').catch((error) => {
            connectSdkPromise = null;
            throw error;
        });
    }
    return connectSdkPromise;
}

async function getTransactionsSdk() {
    if (!transactionsSdkPromise) {
        transactionsSdkPromise = import('@stacks/transactions').catch((error) => {
            transactionsSdkPromise = null;
            throw error;
        });
    }
    return transactionsSdkPromise;
}

async function getNetworkSdk() {
    if (!networkSdkPromise) {
        networkSdkPromise = import('@stacks/network').catch((error) => {
            networkSdkPromise = null;
            throw error;
        });
    }
    return networkSdkPromise;
}

async function requestWallet(method, params, options) {
    const sdk = await getConnectSdk();
    if (options) return sdk.request(options, method, params);
    return sdk.request(method, params);
}

function normalizeHexValue(value) {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    return trimmed.startsWith('0x') ? trimmed.slice(2) : trimmed;
}

function normalizeAddress(value) {
    if (typeof value !== 'string') return null;
    const normalized = value.trim().toUpperCase();
    return normalized.startsWith('S') ? normalized : null;
}

function cacheSigner(address, publicKey) {
    const normalizedAddress = normalizeAddress(address);
    const normalizedPublicKey = normalizeHexValue(publicKey);
    if (!normalizedAddress || !normalizedPublicKey) return;

    lastKnownSigner.address = normalizedAddress;
    lastKnownSigner.publicKey = normalizedPublicKey;
}

function pickStacksSigner(entries) {
    if (!Array.isArray(entries)) return null;

    const withPublicKey = entries
        .map((entry) => ({
            address: normalizeAddress(typeof entry === 'string' ? entry : entry?.address),
            publicKey: normalizeHexValue(typeof entry === 'string' ? null : entry?.publicKey),
        }))
        .find((entry) => Boolean(entry.address && entry.publicKey));

    return withPublicKey || null;
}

function cacheSignerFromResult(result) {
    const signer =
        pickStacksSigner(result?.addresses) ||
        pickStacksSigner(result?.accounts) ||
        null;
    if (!signer) return;
    cacheSigner(signer.address, signer.publicKey);
}

export async function connect(options = {}) {
    const sdk = await getConnectSdk();
    const hasWalletConnectProjectId = Boolean(options.walletConnectProjectId);

    const connectOptions = {
        network: options.network === 'mainnet' ? 'mainnet' : 'testnet',
        forceWalletSelect: true,
        persistWalletSelect: true,
        approvedProviderIds: hasWalletConnectProjectId
            ? PREFERRED_PROVIDER_IDS
            : PREFERRED_PROVIDER_IDS.filter((id) => id !== 'WalletConnectProvider'),
    };

    if (hasWalletConnectProjectId) {
        connectOptions.walletConnectProjectId = options.walletConnectProjectId;
    }

    const result = await sdk.connect(connectOptions);
    cacheSignerFromResult(result);
    return result;
}

export async function getLocalStorage() {
    try {
        const sdk = await getConnectSdk();
        if (typeof sdk.getLocalStorage === 'function') {
            return sdk.getLocalStorage();
        }
    } catch (error) {
        // fall through to local storage snapshot
    }
    return readConnectStorageSnapshot();
}

export async function disconnect() {
    const sdk = await getConnectSdk();
    return sdk.disconnect();
}

function toStacksNetwork(caipNetwork, fallback = 'testnet') {
    if (caipNetwork === 'stacks:1') return 'mainnet';
    if (caipNetwork === 'stacks:2147483648') return 'testnet';
    return fallback === 'mainnet' ? 'mainnet' : 'testnet';
}

function firstAddressEntry(userData) {
    const stx = userData?.addresses?.stx;
    if (!Array.isArray(stx) || stx.length === 0) return null;
    const first = stx[0];
    if (typeof first === 'string') return { address: first, publicKey: null };
    return {
        address: typeof first?.address === 'string' ? first.address : null,
        publicKey: typeof first?.publicKey === 'string' ? first.publicKey : null,
    };
}

function pickAcceptedPaymentOption(paymentRequest, fallbackNetwork) {
    const accepts = Array.isArray(paymentRequest?.accepts) ? paymentRequest.accepts : [];
    if (accepts.length === 0) return null;

    const preferredNetwork = fallbackNetwork === 'mainnet' ? 'stacks:1' : 'stacks:2147483648';
    return (
        accepts.find((option) => option?.asset === 'STX' && option?.network === preferredNetwork) ||
        accepts.find((option) => option?.asset === 'STX') ||
        accepts[0]
    );
}

async function requestAddresses(method, network) {
    try {
        const result = await requestWallet(method, { network }, {
            forceWalletSelect: false,
            persistWalletSelect: true,
        });
        cacheSignerFromResult(result);
        return result;
    } catch (error) {
        return null;
    }
}

async function resolveSignerPublicKey(network) {
    if (lastKnownSigner.publicKey) return lastKnownSigner.publicKey;

    await requestAddresses('getAddresses', network);
    if (lastKnownSigner.publicKey) return lastKnownSigner.publicKey;

    await requestAddresses('stx_getAddresses', network);
    if (lastKnownSigner.publicKey) return lastKnownSigner.publicKey;

    await requestAddresses('stx_getAccounts', network);
    if (lastKnownSigner.publicKey) return lastKnownSigner.publicKey;

    try {
        const messageResult = await requestWallet(
            'stx_signMessage',
            { message: `x402-key-bootstrap:${Date.now()}` },
            { forceWalletSelect: false, persistWalletSelect: true }
        );
        const signedPublicKey = normalizeHexValue(messageResult?.publicKey);
        if (signedPublicKey) {
            const fallbackAddress = firstAddressEntry(await getLocalStorage())?.address;
            cacheSigner(fallbackAddress, signedPublicKey);
            return signedPublicKey;
        }
    } catch (error) {
        // Some providers may not support message signing for this flow.
    }

    const fallbackEntry = firstAddressEntry(await getLocalStorage());
    const fallbackPublicKey = normalizeHexValue(fallbackEntry?.publicKey);
    if (fallbackPublicKey) return fallbackPublicKey;

    return null;
}

/**
 * Create x402 v2 payment-signature header value using the connected Stacks wallet.
 */
export async function signX402Payment(paymentRequest, fallbackNetwork = 'testnet') {
    const connectSdk = await getConnectSdk();
    if (typeof connectSdk.signX402Payment === 'function') {
        return connectSdk.signX402Payment(paymentRequest, fallbackNetwork);
    }

    const accepted = pickAcceptedPaymentOption(paymentRequest, fallbackNetwork);
    if (!accepted) {
        throw new Error('No supported payment options returned by server');
    }

    if (accepted.asset !== 'STX') {
        throw new Error(`Unsupported asset for in-browser wallet flow: ${accepted.asset}`);
    }

    const signerPublicKey = await resolveSignerPublicKey(
        toStacksNetwork(accepted.network, fallbackNetwork)
    );
    if (!signerPublicKey) {
        throw new Error(
            'Wallet did not provide a public key for payment signing. Reconnect wallet or switch provider.'
        );
    }

    const { makeUnsignedSTXTokenTransfer, transactionToHex } = await getTransactionsSdk();
    const { createNetwork } = await getNetworkSdk();
    const unsignedTx = await makeUnsignedSTXTokenTransfer({
        recipient: accepted.payTo,
        amount: BigInt(accepted.amount),
        memo: `x402:${Date.now().toString(36)}`.slice(0, 34),
        publicKey: signerPublicKey,
        network: createNetwork(toStacksNetwork(accepted.network, fallbackNetwork)),
    });

    const unsignedHex = transactionToHex(unsignedTx);
    const signed = await requestWallet('stx_signTransaction', {
        transaction: unsignedHex,
        broadcast: false,
    });

    if (!signed?.transaction) {
        throw new Error('Wallet did not return a signed transaction');
    }
    const signedTransaction = normalizeHexValue(signed.transaction) || signed.transaction;

    const payload = {
        x402Version: 2,
        resource: paymentRequest.resource,
        accepted,
        payload: {
            transaction: signedTransaction,
        },
    };

    return btoa(JSON.stringify(payload));
}
