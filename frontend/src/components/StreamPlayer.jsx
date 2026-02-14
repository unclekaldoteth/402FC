'use client';

import { useState } from 'react';

function formatDateTime(value) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function truncateAddress(address) {
    if (typeof address !== 'string') return null;
    if (address.length < 12) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function StreamPlayer({ sessionData }) {
    const streamUrl = sessionData?.playback?.url;
    const sourceUrl = sessionData?.playback?.sourceUrl || streamUrl;
    const mimeType = sessionData?.playback?.mimeType || 'video/mp4';
    const fallbackEmbedUrl = sessionData?.playback?.fallbackEmbedUrl || null;
    const [videoFailed, setVideoFailed] = useState(false);
    const [activeTab, setActiveTab] = useState('stream');

    if (!streamUrl) {
        return (
            <div className="empty-state" style={{ minHeight: '180px' }}>
                <p>Stream source unavailable for this session.</p>
            </div>
        );
    }

    const paidBy = truncateAddress(sessionData?.session?.paidBy);
    const shouldRenderEmbed = Boolean(videoFailed && fallbackEmbedUrl);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{
                borderRadius: '12px',
                border: '1px solid var(--border)',
                background: '#000',
                overflow: 'hidden',
            }}>
                {shouldRenderEmbed ? (
                    <iframe
                        src={fallbackEmbedUrl}
                        title={sessionData?.title || 'Stream playback'}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        style={{
                            width: '100%',
                            height: '460px',
                            border: 'none',
                            display: 'block',
                            background: '#000',
                        }}
                    />
                ) : (
                    <video
                        controls
                        playsInline
                        preload="metadata"
                        style={{ width: '100%', display: 'block', maxHeight: '460px' }}
                        onError={() => setVideoFailed(true)}
                    >
                        <source src={streamUrl} type={mimeType} />
                        Your browser does not support video playback.
                    </video>
                )}
            </div>

            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px',
                fontSize: '12px',
                color: 'var(--text-secondary)',
            }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        type="button"
                        onClick={() => setActiveTab('stream')}
                        style={{
                            border: '1px solid var(--border)',
                            borderRadius: '999px',
                            padding: '6px 12px',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            color: activeTab === 'stream' ? 'var(--text-primary)' : 'var(--text-secondary)',
                            background: activeTab === 'stream' ? 'rgba(255,255,255,0.08)' : 'transparent',
                        }}
                    >
                        Stream
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('prediction')}
                        style={{
                            border: '1px solid var(--border)',
                            borderRadius: '999px',
                            padding: '6px 12px',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            color: activeTab === 'prediction' ? 'var(--text-primary)' : 'var(--text-secondary)',
                            background: activeTab === 'prediction' ? 'rgba(255,255,255,0.08)' : 'transparent',
                        }}
                    >
                        Prediction
                    </button>
                </div>
            </div>

            {activeTab === 'stream' ? (
                <>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '8px',
                        fontSize: '12px',
                        color: 'var(--text-secondary)',
                    }}>
                        <span>Session expires: {formatDateTime(sessionData?.session?.expiresAt)}</span>
                        <span>Paid by: {paidBy || 'N/A'}</span>
                        <a
                            href={sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ textDecoration: 'underline', color: 'var(--accent-teal)' }}
                        >
                            Open source URL
                        </a>
                    </div>
                    {videoFailed && fallbackEmbedUrl && (
                        <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                            Direct stream URL failed to load; switched to fallback player.
                        </p>
                    )}
                </>
            ) : (
                <div
                    style={{
                        border: '1px solid var(--border)',
                        borderRadius: '10px',
                        padding: '12px',
                        background: 'rgba(255,255,255,0.02)',
                        color: 'var(--text-secondary)',
                        fontSize: '12px',
                        lineHeight: 1.6,
                    }}
                >
                    <strong style={{ color: 'var(--text-primary)' }}>Prediction — Coming Soon</strong>
                    <p style={{ marginTop: '6px' }}>
                        This feature is part of Future Development. It will include pre-match probabilities,
                        likely scorelines, and live updates. Informational output only, not betting advice.
                    </p>
                </div>
            )}
        </div>
    );
}
