const ACTIVE_NETWORK = process.env.NEXT_PUBLIC_NETWORK || 'testnet';
const WALLET_STORAGE_KEY = '402fc.wallet.address';
const STACKS_CONNECT_STORAGE_KEY = '@stacks/connect';
const WALLET_EVENT_NAME = '402fc.wallet-changed';
const WALLETCONNECT_PROJECT_ID =
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ||
    process.env.NEXT_PUBLIC_REOWN_PROJECT_ID ||
    '';

const DEFAULT_WALLET_BY_NETWORK = {
    mainnet: 'SP000000000000000000002Q6VF78',
    testnet: 'ST000000000000000000002AMW42H',
};

let connectModulePromise = null;

function isBrowser() {
    return typeof window !== 'undefined';
}

function emitWalletChange() {
    if (!isBrowser()) return;
    window.dispatchEvent(new CustomEvent(WALLET_EVENT_NAME));
}

function normalizeAddress(value) {
    if (typeof value !== 'string') return null;
    const normalized = value.trim().toUpperCase();
    if (!normalized) return null;

    // Stacks addresses start with SP (mainnet) or ST (testnet).
    const looksLikeAddress = /^S[PT][A-Z0-9]{20,}$/u.test(normalized);
    return looksLikeAddress ? normalized : null;
}

function extractAddressFromSession(data) {
    const stxAddresses = data?.addresses?.stx;
    if (Array.isArray(stxAddresses)) {
        const first = stxAddresses[0];
        if (typeof first === 'string') return normalizeAddress(first);
        return normalizeAddress(first?.address);
    }
    if (typeof stxAddresses === 'string') return normalizeAddress(stxAddresses);
    if (stxAddresses && typeof stxAddresses === 'object') {
        return normalizeAddress(stxAddresses.address);
    }
    return null;
}

function readStoredAddress() {
    if (!isBrowser()) return null;
    try {
        return normalizeAddress(window.localStorage.getItem(WALLET_STORAGE_KEY));
    } catch (error) {
        return null;
    }
}

function writeStoredAddress(address, shouldEmit = true) {
    if (!isBrowser()) return;
    const normalized = normalizeAddress(address);
    if (!normalized) return;

    try {
        if (readStoredAddress() === normalized) return;
        window.localStorage.setItem(WALLET_STORAGE_KEY, normalized);
        if (shouldEmit) emitWalletChange();
    } catch (error) {
        console.error('Failed to persist wallet address:', error);
    }
}

function clearStoredAddress(shouldEmit = true) {
    if (!isBrowser()) return;

    try {
        const hadAddress = Boolean(window.localStorage.getItem(WALLET_STORAGE_KEY));
        window.localStorage.removeItem(WALLET_STORAGE_KEY);
        if (hadAddress && shouldEmit) emitWalletChange();
    } catch (error) {
        console.error('Failed to clear wallet address:', error);
    }
}

function readAddressFromConnectStorage() {
    if (!isBrowser()) return null;
    try {
        const raw = window.localStorage.getItem(STACKS_CONNECT_STORAGE_KEY);
        if (!raw) return null;
        if (raw.trim().startsWith('{')) {
            return extractAddressFromSession(JSON.parse(raw));
        }
        if (!/^[0-9a-fA-F]+$/u.test(raw) || raw.length % 2 !== 0) return null;
        const bytes = new Uint8Array(raw.length / 2);
        for (let i = 0; i < raw.length; i += 2) {
            bytes[i / 2] = Number.parseInt(raw.slice(i, i + 2), 16);
        }
        const decoded =
            typeof TextDecoder !== 'undefined'
                ? new TextDecoder().decode(bytes)
                : typeof Buffer !== 'undefined'
                    ? Buffer.from(bytes).toString('utf-8')
                    : null;
        if (!decoded) return null;
        return extractAddressFromSession(JSON.parse(decoded));
    } catch (error) {
        return null;
    }
}

async function readAddressFromConnectModule(connectModule) {
    if (!connectModule?.getLocalStorage) return null;
    try {
        const walletData = await connectModule.getLocalStorage();
        return extractAddressFromSession(walletData);
    } catch (error) {
        return null;
    }
}

function readAddressFromConnectResult(result) {
    const firstAddress = result?.addresses?.[0];
    if (typeof firstAddress === 'string') return normalizeAddress(firstAddress);
    return normalizeAddress(firstAddress?.address);
}

function promptForFallbackAddress() {
    if (!isBrowser()) return null;
    const defaultAddress =
        normalizeAddress(process.env.NEXT_PUBLIC_STX_ADDRESS) ||
        DEFAULT_WALLET_BY_NETWORK[ACTIVE_NETWORK] ||
        DEFAULT_WALLET_BY_NETWORK.testnet;

    const entered = window.prompt(
        `Enter your ${ACTIVE_NETWORK} STX wallet address`,
        defaultAddress
    );
    return normalizeAddress(entered || '');
}

async function getConnectModule() {
    if (!isBrowser()) return null;

    if (!connectModulePromise) {
        connectModulePromise = import('./stacks-connect-adapter')
            .then((module) => module)
            .catch((error) => {
                connectModulePromise = null;
                console.error('Wallet adapter failed to load:', error);
                return null;
            });
    }

    return connectModulePromise;
}

function buildConnectOptions() {
    const options = {
        network: ACTIVE_NETWORK === 'mainnet' ? 'mainnet' : 'testnet',
    };

    if (WALLETCONNECT_PROJECT_ID) {
        options.walletConnectProjectId = WALLETCONNECT_PROJECT_ID;
    }

    return options;
}

function isX402V2PaymentRequest(value) {
    return (
        value &&
        typeof value === 'object' &&
        Number(value.x402Version) === 2 &&
        Array.isArray(value.accepts) &&
        value.accepts.length > 0
    );
}

function resolvePaymentInput(input) {
    if (isX402V2PaymentRequest(input)) {
        return { v2: input, legacy: null };
    }

    if (isX402V2PaymentRequest(input?.paymentRequest)) {
        return { v2: input.paymentRequest, legacy: null };
    }

    if (isX402V2PaymentRequest(input?.requirements)) {
        return { v2: input.requirements, legacy: null };
    }

    const legacyRequirements = input?.requirements || input;
    return {
        v2: null,
        legacy: {
            amount: legacyRequirements?.amount,
            asset: legacyRequirements?.asset || 'STX',
            payTo: legacyRequirements?.payTo,
            network: legacyRequirements?.network,
        },
    };
}

export const appDetails = {
    name: '402FC',
    icon: isBrowser() ? `${window.location.origin}/favicon.ico` : '/favicon.ico',
};

/**
 * Prime wallet state after hydration so UI can render consistently.
 */
export async function primeWalletSession() {
    if (!isBrowser()) {
        return { available: false, connected: false, address: null, mode: 'server' };
    }

    const connectModule = await getConnectModule();
    const address =
        (await readAddressFromConnectModule(connectModule)) ||
        readAddressFromConnectStorage() ||
        readStoredAddress();

    if (address) {
        writeStoredAddress(address, false);
    } else {
        clearStoredAddress(false);
    }

    return {
        available: Boolean(connectModule),
        connected: Boolean(address),
        address,
        mode: connectModule ? 'adapter' : 'local',
    };
}

/**
 * Subscribe to wallet-relevant browser events.
 */
export function subscribeWalletChanges(listener) {
    if (!isBrowser()) return () => {};

    const onChange = () => listener();
    window.addEventListener('focus', onChange);
    window.addEventListener('visibilitychange', onChange);
    window.addEventListener('storage', onChange);
    window.addEventListener(WALLET_EVENT_NAME, onChange);

    return () => {
        window.removeEventListener('focus', onChange);
        window.removeEventListener('visibilitychange', onChange);
        window.removeEventListener('storage', onChange);
        window.removeEventListener(WALLET_EVENT_NAME, onChange);
    };
}

/**
 * Connect wallet with wallet adapter first, then manual fallback.
 */
export async function connectWallet(onFinish) {
    if (!isBrowser()) return false;

    const primed = await primeWalletSession();
    if (primed.address) {
        if (onFinish) onFinish({ address: primed.address });
        return true;
    }

    const connectModule = await getConnectModule();
    if (connectModule?.connect) {
        try {
            const result = await connectModule.connect(buildConnectOptions());
            const address =
                readAddressFromConnectResult(result) ||
                (await readAddressFromConnectModule(connectModule)) ||
                readAddressFromConnectStorage();

            if (address) {
                writeStoredAddress(address);
                if (onFinish) onFinish({ address });
                return true;
            }
            return false;
        } catch (error) {
            console.error('Wallet connect was not completed:', error);
            return false;
        }
    }

    const fallbackAddress = promptForFallbackAddress();
    if (!fallbackAddress) return false;

    writeStoredAddress(fallbackAddress);
    if (onFinish) onFinish({ address: fallbackAddress });
    return true;
}

/**
 * Disconnect wallet.
 */
export async function disconnectWallet() {
    if (!isBrowser()) return;

    const connectModule = await getConnectModule();
    if (connectModule?.disconnect) {
        try {
            await connectModule.disconnect();
        } catch (error) {
            console.error('Disconnect error:', error);
        }
    }

    clearStoredAddress();
}

/**
 * Check if user is connected.
 */
export function isWalletConnected() {
    return Boolean(getWalletAddress());
}

/**
 * Get the connected wallet address.
 */
export function getWalletAddress() {
    const stored = readStoredAddress();
    if (stored) return stored;

    const fromConnectStorage = readAddressFromConnectStorage();
    if (fromConnectStorage) {
        writeStoredAddress(fromConnectStorage, false);
    }
    return fromConnectStorage;
}

/**
 * Get truncated wallet address for display.
 */
export function getTruncatedAddress() {
    const address = getWalletAddress();
    if (!address) return null;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Sign a payment for x402 (demo proof).
 */
export async function signPayment(requirements) {
    if (!isWalletConnected()) {
        throw new Error('Wallet not connected');
    }

    const connectModule = await getConnectModule();
    const { v2, legacy } = resolvePaymentInput(requirements);

    if (v2) {
        if (!connectModule?.signX402Payment) {
            throw new Error('Wallet signer is unavailable for x402 v2 payments');
        }
        return connectModule.signX402Payment(v2, ACTIVE_NETWORK);
    }

    const address = getWalletAddress();
    return btoa(
        JSON.stringify({
            from: address,
            to: legacy?.payTo,
            amount: legacy?.amount,
            asset: legacy?.asset || 'STX',
            network: legacy?.network || ACTIVE_NETWORK,
            timestamp: Date.now(),
            nonce: Math.random().toString(36).substring(7),
        })
    );
}
