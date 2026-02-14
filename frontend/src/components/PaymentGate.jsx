'use client';

import { useState, useSyncExternalStore } from 'react';
import {
    connectWallet,
    isWalletConnected,
    primeWalletSession,
    signPayment,
    subscribeWalletChanges,
} from '@/lib/stacks';

let walletSnapshot = { connected: false };
const serverSnapshot = { connected: false };

function readWalletSnapshot() {
    const connected = isWalletConnected();
    if (walletSnapshot.connected === connected) return walletSnapshot;
    walletSnapshot = { connected };
    return walletSnapshot;
}

function subscribeToWallet(callback) {
    const unsubscribe = subscribeWalletChanges(callback);
    void primeWalletSession().then(callback).catch(() => callback());
    return unsubscribe;
}

function getErrorMessage(error) {
    if (error instanceof Error && error.message) return error.message;
    return 'Payment failed';
}

export default function PaymentGate({
    price,
    label,
    icon = '🔒',
    description,
    unlockRequest,
    onUnlock,
    children,
    previewContent
}) {
    const [state, setState] = useState('locked'); // locked, connecting, paying, unlocked, error
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);

    const parsedPrice = Number.parseInt(price, 10);
    const priceSTX = Number.isNaN(parsedPrice) ? '0.00' : (parsedPrice / 1000000).toFixed(2);
    const network = process.env.NEXT_PUBLIC_NETWORK || 'testnet';
    const { connected } = useSyncExternalStore(
        subscribeToWallet,
        readWalletSnapshot,
        () => serverSnapshot
    );

    const fallbackRequirements = {
        amount: price,
        asset: 'STX',
        payTo: process.env.NEXT_PUBLIC_STX_ADDRESS || 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
        network,
    };

    function normalizeRequirements(response) {
        if (
            response?.paymentRequest &&
            Number(response.paymentRequest.x402Version) === 2 &&
            Array.isArray(response.paymentRequest.accepts) &&
            response.paymentRequest.accepts.length > 0
        ) {
            return response.paymentRequest;
        }

        if (
            response?.requirements &&
            Number(response.requirements.x402Version) === 2 &&
            Array.isArray(response.requirements.accepts) &&
            response.requirements.accepts.length > 0
        ) {
            return response.requirements;
        }

        if (response?.requirements && typeof response.requirements === 'object') {
            return response.requirements;
        }

        return fallbackRequirements;
    }

    function unwrapResult(result) {
        if (result?.paymentRequired) {
            throw new Error(result.message || 'Payment verification failed. Please retry.');
        }

        if (result?.data !== undefined) return result.data;
        if (result === null || result === undefined) {
            throw new Error('Payment succeeded but no content was returned. Please try again.');
        }
        return result;
    }

    async function handleUnlock() {
        if (!connected) {
            setError(null);
            setState('connecting');

            const didConnect = await connectWallet();
            if (!didConnect) {
                setState('locked');
                return;
            }
        }

        setState('paying');
        setError(null);

        try {
            if (unlockRequest) {
                const preflightResult = await unlockRequest();
                if (!preflightResult) {
                    throw new Error('Unable to load payment requirements');
                }

                if (!preflightResult.paymentRequired) {
                    setData(unwrapResult(preflightResult));
                    setState('unlocked');
                    return;
                }

                const paymentProof = await signPayment(normalizeRequirements(preflightResult));
                const paidResult = await unlockRequest(paymentProof);
                setData(unwrapResult(paidResult));
                setState('unlocked');
                return;
            }

            const paymentProof = await signPayment(fallbackRequirements);
            if (onUnlock) {
                const result = await onUnlock(paymentProof);
                setData(unwrapResult(result));
            }

            setState('unlocked');
        } catch (err) {
            console.error('Payment failed:', err);
            setError(getErrorMessage(err));
            setState('error');
        }
    }

    if (state === 'unlocked') {
        return (
            <div className="animate-fade-in">
                {typeof children === 'function' ? children(data) : children}
            </div>
        );
    }

    return (
        <div className="paywall-container">
            {/* Blurred preview */}
            <div className="paywall-blur">
                {previewContent || (
                    <div style={{ padding: '20px' }}>
                        <div style={{ width: '80%', height: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', marginBottom: '8px' }} />
                        <div style={{ width: '60%', height: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px', marginBottom: '8px' }} />
                        <div style={{ width: '90%', height: '12px', background: 'rgba(255,255,255,0.04)', borderRadius: '4px', marginBottom: '8px' }} />
                        <div style={{ width: '40%', height: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px' }} />
                    </div>
                )}
            </div>

            {/* Unlock overlay */}
            <div className="paywall-overlay">
                <span className="paywall-icon">{icon}</span>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontWeight: 500 }}>
                    {description || `Unlock ${label}`}
                </p>

                {state === 'paying' ? (
                    <button className="btn btn-primary" disabled style={{ opacity: 0.8, cursor: 'wait' }}>
                        Processing Payment...
                    </button>
                ) : state === 'connecting' ? (
                    <button className="btn btn-primary" disabled style={{ opacity: 0.8, cursor: 'wait' }}>
                        Connecting Wallet...
                    </button>
                ) : state === 'error' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                        <p style={{ color: 'var(--danger)', fontSize: '12px', fontWeight: 500 }}>
                            {error}
                        </p>
                        <button className="btn btn-primary" onClick={handleUnlock}>
                            Try Again — {priceSTX} STX
                        </button>
                    </div>
                ) : (
                    <button className="btn btn-primary" onClick={handleUnlock}>
                        {connected ? (
                            <>🔓 Unlock — {priceSTX} STX</>
                        ) : (
                            <>⚡ Connect Wallet to Unlock</>
                        )}
                    </button>
                )}
            </div>
        </div>
    );
}
