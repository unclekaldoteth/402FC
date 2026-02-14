'use client';

import { useCallback, useEffect, useState } from 'react';
import Header from '@/components/Header';
import PaymentGate from '@/components/PaymentGate';
import StreamPlayer from '@/components/StreamPlayer';
import { getStreams, getStreamWatch } from '@/lib/api';

function formatKickoff(value) {
    if (!value) return 'TBD';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'TBD';
    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function getStatusTag(status) {
    const normalized = String(status || '').toUpperCase();
    if (normalized === 'LIVE') return { label: 'LIVE', color: '#ef4444', bg: 'rgba(239,68,68,0.14)' };
    if (normalized === 'UPCOMING') return { label: 'UPCOMING', color: '#fc6432', bg: 'rgba(252,100,50,0.14)' };
    if (normalized === 'REPLAY') return { label: 'REPLAY', color: '#34d399', bg: 'rgba(52,211,153,0.14)' };
    return { label: normalized || 'UNKNOWN', color: 'var(--text-secondary)', bg: 'rgba(255,255,255,0.08)' };
}

export default function StreamingPage() {
    const [streams, setStreams] = useState([]);
    const [network, setNetwork] = useState('testnet');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadStreams = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await getStreams();
            const payload = result?.data || {};
            setStreams(Array.isArray(payload.streams) ? payload.streams : []);
            setNetwork(payload.network || 'testnet');
        } catch (err) {
            setError(err.message || 'Failed to load stream catalog');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadStreams();
    }, [loadStreams]);

    return (
        <>
            <Header />

            <div className="page-header">
                <h1>📺 Pay-Per-Watch Streaming</h1>
                <p>
                    Unlock a stream session per event via x402 micropayments.
                    Network: <strong style={{ color: 'var(--text-primary)' }}>{network}</strong>
                </p>
            </div>

            {loading ? (
                <div className="loading">
                    <div className="spinner" />
                </div>
            ) : error ? (
                <div className="empty-state">
                    <div className="empty-state-icon">⚠️</div>
                    <p>{error}</p>
                    <button className="btn btn-secondary" onClick={loadStreams} style={{ marginTop: '16px' }}>
                        Retry
                    </button>
                </div>
            ) : streams.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">📡</div>
                    <p>No streams listed right now.</p>
                </div>
            ) : (
                <div className="stream-list">
                    {streams.map((stream) => {
                        const statusTag = getStatusTag(stream.status);
                        return (
                            <div key={stream.id} className="card paid-section stream-card">
                                <div className="stream-card-header">
                                    <div className="stream-card-meta">
                                        <h3 className="paid-section-title">📺 {stream.title}</h3>
                                        <p className="paid-section-desc" style={{ marginBottom: 0 }}>
                                            {stream.competition} • {stream.homeTeam} vs {stream.awayTeam}
                                        </p>
                                        <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                                            {stream.tagline || 'Live event stream'} • Kickoff {formatKickoff(stream.startsAtUtc)}
                                        </p>
                                    </div>

                                    <div className="stream-card-badges">
                                        <span className="badge badge-paid">💰 {stream.priceFormatted || '0.08 STX'}</span>
                                        <span
                                            className="badge"
                                            style={{
                                                color: statusTag.color,
                                                background: statusTag.bg,
                                                border: `1px solid ${statusTag.bg}`,
                                            }}
                                        >
                                            {statusTag.label}
                                        </span>
                                    </div>
                                </div>

                                <div className="stream-card-gate">
                                    <PaymentGate
                                        price={stream.price || '80000'}
                                        label={stream.title}
                                        icon="📺"
                                        description={`Pay ${stream.priceFormatted || '0.08 STX'} to start this watch session`}
                                        unlockRequest={(proof) => getStreamWatch(stream.id, proof)}
                                    >
                                        {(sessionData) => <StreamPlayer sessionData={sessionData} />}
                                    </PaymentGate>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <footer className="footer">
                <p>402FC Streaming — Pay per watch session with STX via x402</p>
            </footer>
        </>
    );
}
