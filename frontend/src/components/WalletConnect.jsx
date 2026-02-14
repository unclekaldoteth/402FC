'use client';

import { useState, useSyncExternalStore } from 'react';
import {
    connectWallet,
    disconnectWallet,
    getTruncatedAddress,
    isWalletConnected,
    primeWalletSession,
    subscribeWalletChanges,
} from '@/lib/stacks';

let walletSnapshot = { connected: false, address: null };
const serverSnapshot = { connected: false, address: null };

function readWalletSnapshot() {
    const connected = isWalletConnected();
    const address = connected ? getTruncatedAddress() : null;

    if (
        walletSnapshot.connected === connected &&
        walletSnapshot.address === address
    ) {
        return walletSnapshot;
    }

    walletSnapshot = { connected, address };
    return walletSnapshot;
}

function subscribeToWallet(callback) {
    const unsubscribe = subscribeWalletChanges(callback);
    void primeWalletSession().then(callback).catch(() => callback());
    return unsubscribe;
}

export default function WalletConnect() {
    const [isConnecting, setIsConnecting] = useState(false);
    const [isDisconnecting, setIsDisconnecting] = useState(false);
    const isHydrated = useSyncExternalStore(
        () => () => {},
        () => true,
        () => false
    );

    const { connected, address } = useSyncExternalStore(
        subscribeToWallet,
        readWalletSnapshot,
        () => serverSnapshot
    );

    async function handleConnect() {
        if (isConnecting || isDisconnecting) return;
        setIsConnecting(true);
        try {
            await connectWallet();
        } finally {
            setIsConnecting(false);
        }
    }

    async function handleDisconnect() {
        if (isConnecting || isDisconnecting) return;
        setIsDisconnecting(true);
        try {
            await disconnectWallet();
        } finally {
            setIsDisconnecting(false);
        }
    }

    if (!isHydrated) {
        return (
            <button className="btn btn-wallet btn-small" disabled style={{ opacity: 0.7, cursor: 'wait' }}>
                Connect Wallet
            </button>
        );
    }

    if (connected && address) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                    fontSize: '12px',
                    color: 'var(--accent-green)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                }}>
                    <span style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: 'var(--accent-green)',
                        display: 'inline-block',
                    }} />
                    {address}
                </span>
                <button
                    className="btn btn-secondary btn-small"
                    onClick={handleDisconnect}
                    disabled={isDisconnecting}
                    style={{ fontSize: '11px', padding: '4px 10px' }}
                >
                    {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
                </button>
            </div>
        );
    }

    return (
        <button
            className="btn btn-wallet btn-small"
            onClick={handleConnect}
            disabled={isConnecting}
        >
            {isConnecting ? 'Connecting...' : '⚡ Connect Wallet'}
        </button>
    );
}
