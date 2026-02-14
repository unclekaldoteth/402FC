/**
 * API client for 402FC backend
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const DEFAULT_TIMEOUT_MS = 60000;
const X402_HEADERS = {
    PAYMENT_REQUIRED: 'payment-required',
    PAYMENT_SIGNATURE: 'payment-signature',
    PAYMENT_RESPONSE: 'payment-response',
};

async function parseJsonSafe(response) {
    try {
        return await response.json();
    } catch (error) {
        return null;
    }
}

function decodeBase64Json(value) {
    if (!value || typeof value !== 'string') return null;
    try {
        if (typeof atob === 'function') {
            return JSON.parse(atob(value));
        }
        if (typeof Buffer !== 'undefined') {
            return JSON.parse(Buffer.from(value, 'base64').toString('utf-8'));
        }
    } catch (error) {
        return null;
    }
    return null;
}

function isV2PaymentRequest(value) {
    return (
        value &&
        typeof value === 'object' &&
        Number(value.x402Version) === 2 &&
        Array.isArray(value.accepts) &&
        value.accepts.length > 0
    );
}

function firstAcceptedPaymentOption(paymentRequest) {
    if (!isV2PaymentRequest(paymentRequest)) return null;
    return paymentRequest.accepts[0] || null;
}

function parsePaymentRequired(response, paymentData) {
    const standardHeader = response.headers.get(X402_HEADERS.PAYMENT_REQUIRED);
    const legacyHeader = response.headers.get('x-payment-required');
    const parsedHeader =
        decodeBase64Json(standardHeader) ||
        decodeBase64Json(legacyHeader) ||
        (() => {
            if (!legacyHeader) return null;
            try {
                return JSON.parse(legacyHeader);
            } catch (error) {
                return null;
            }
        })();

    const paymentRequest =
        (isV2PaymentRequest(parsedHeader) && parsedHeader) ||
        (isV2PaymentRequest(paymentData) && paymentData) ||
        null;

    if (paymentRequest) {
        return {
            paymentRequest,
            requirements: firstAcceptedPaymentOption(paymentRequest),
            message: paymentData?.message || 'Payment required',
        };
    }

    const legacyRequirements =
        paymentData?.requirements ||
        parsedHeader ||
        {
            amount: response.headers.get('x-payment-amount'),
            asset: response.headers.get('x-payment-asset') || 'STX',
            payTo: response.headers.get('x-payment-address'),
            network: response.headers.get('x-payment-network'),
            facilitatorUrl: response.headers.get('x-facilitator-url'),
        };

    return {
        paymentRequest: null,
        requirements: legacyRequirements,
        message: paymentData?.message || 'Payment required',
    };
}

/**
 * Make a request to the backend API.
 * If 402 is returned, returns the payment requirements instead of throwing.
 */
export async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const { timeoutMs = DEFAULT_TIMEOUT_MS, signal: externalSignal, ...fetchOptions } = options;
    const method = (fetchOptions.method || 'GET').toUpperCase();
    const hasBody = fetchOptions.body !== undefined && fetchOptions.body !== null;

    const headers = {
        ...fetchOptions.headers,
    };

    if (hasBody && method !== 'GET' && method !== 'HEAD' && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
    }

    const timeout = Number.isFinite(timeoutMs) ? timeoutMs : DEFAULT_TIMEOUT_MS;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    if (externalSignal) {
        if (externalSignal.aborted) controller.abort();
        else externalSignal.addEventListener('abort', () => controller.abort(), { once: true });
    }

    try {
        const response = await fetch(url, {
            ...fetchOptions,
            headers,
            signal: controller.signal,
        });

        if (response.status === 402) {
            // Parse payment requirements from response
            const paymentData = await parseJsonSafe(response);
            const parsed = parsePaymentRequired(response, paymentData);

            return {
                status: 402,
                paymentRequired: true,
                paymentRequest: parsed.paymentRequest,
                requirements: parsed.requirements,
                message: parsed.message,
            };
        }

        if (!response.ok) {
            const errorPayload = await parseJsonSafe(response);
            const errorMessage = errorPayload?.error || errorPayload?.message || `HTTP ${response.status}`;
            throw new Error(errorMessage);
        }

        const data = await parseJsonSafe(response);
        return {
            status: 200,
            paymentRequired: false,
            data,
        };
    } catch (error) {
        if (error?.name === 'AbortError') {
            throw new Error(
                `Request timed out after ${Math.round(timeout / 1000)}s. This can happen while waiting for payment settlement; please retry.`
            );
        }
        if (error instanceof TypeError || error.message?.toLowerCase().includes('fetch')) {
            throw new Error('Unable to connect to 402FC API. Make sure the backend is running.');
        }
        throw error;
    } finally {
        clearTimeout(timeoutId);
    }
}

/**
 * Make a paid request with payment proof header.
 */
export async function paidRequest(endpoint, paymentProof, options = {}) {
    return apiRequest(endpoint, {
        ...options,
        headers: {
            ...options.headers,
            [X402_HEADERS.PAYMENT_SIGNATURE]: paymentProof,
            'x-payment': paymentProof,
            'x-payment-signature': paymentProof,
        },
    });
}

// Free endpoints
export const getMatches = (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/api/matches${query ? `?${query}` : ''}`);
};

export const getStandings = (competition) => apiRequest(`/api/standings/${encodeURIComponent(competition)}`);
export const getFixtures = (competition) => apiRequest(`/api/fixtures/${encodeURIComponent(competition)}`);
export const getMatch = (id) => apiRequest(`/api/match/${encodeURIComponent(id)}`);
export const getCompetitions = () => apiRequest('/api/competitions');
export const getPricing = () => apiRequest('/api/pricing');
export const getStreams = () => apiRequest('/api/streams');

// Paid endpoints (will return 402 without payment)
export const getHighlights = (matchId, paymentProof) => {
    const encoded = encodeURIComponent(matchId);
    if (paymentProof) return paidRequest(`/api/highlights/${encoded}`, paymentProof);
    return apiRequest(`/api/highlights/${encoded}`);
};

export const getAnalytics = (matchId, paymentProof) => {
    const encoded = encodeURIComponent(matchId);
    if (paymentProof) return paidRequest(`/api/analytics/${encoded}`, paymentProof);
    return apiRequest(`/api/analytics/${encoded}`);
};

export const getAISummary = (matchId, paymentProof) => {
    const encoded = encodeURIComponent(matchId);
    if (paymentProof) return paidRequest(`/api/ai-summary/${encoded}`, paymentProof);
    return apiRequest(`/api/ai-summary/${encoded}`);
};

export const getStreamWatch = (streamId, paymentProof) => {
    const encoded = encodeURIComponent(streamId);
    if (paymentProof) return paidRequest(`/api/streams/${encoded}/watch`, paymentProof);
    return apiRequest(`/api/streams/${encoded}/watch`);
};
