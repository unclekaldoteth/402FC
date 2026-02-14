'use client';

import Image from 'next/image';
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Header from '@/components/Header';
import PaymentGate from '@/components/PaymentGate';
import HighlightPlayer from '@/components/HighlightPlayer';
import AIAnalysis from '@/components/AIAnalysis';
import { getMatch, getHighlights, getAnalytics, getAISummary } from '@/lib/api';

export default function MatchDetailPage() {
    const params = useParams();
    const matchId = Array.isArray(params.id) ? params.id[0] : params.id;

    const [match, setMatch] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadMatch = useCallback(async () => {
        if (!matchId) return;

        setLoading(true);
        setError(null);
        try {
            const result = await getMatch(matchId);
            if (!result?.data) {
                throw new Error('Match not found');
            }
            setMatch(result.data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [matchId]);

    useEffect(() => {
        loadMatch();
    }, [loadMatch]);

    if (loading) {
        return (
            <>
                <Header />
                <div className="loading" style={{ minHeight: '60vh' }}>
                    <div className="spinner" />
                </div>
            </>
        );
    }

    if (error || !match) {
        return (
            <>
                <Header />
                <div className="empty-state" style={{ minHeight: '60vh' }}>
                    <div className="empty-state-icon">⚠️</div>
                    <p>{error || 'Match not found'}</p>
                </div>
            </>
        );
    }

    const homeScore = match.score?.fullTime?.home;
    const awayScore = match.score?.fullTime?.away;
    return (
        <>
            <Header />
            <div className="match-detail">
                {/* Match Hero */}
                <div className="card match-detail-hero">
                    <div className="match-detail-competition">
                        {match.competition?.emblem && (
                            <Image
                                src={match.competition.emblem}
                                alt={`${match.competition?.name || 'Competition'} emblem`}
                                width={24}
                                height={24}
                            />
                        )}
                        <span>{match.competition?.name}</span>
                        <span style={{ color: 'var(--text-tertiary)' }}>•</span>
                        <span style={{ color: 'var(--text-tertiary)' }}>Matchday {match.matchday || '—'}</span>
                    </div>

                    <div className="match-detail-teams">
                        <div className="match-detail-team">
                            {match.homeTeam?.crest && (
                                <Image
                                    src={match.homeTeam.crest}
                                    alt={`${match.homeTeam?.name || 'Home team'} crest`}
                                    width={72}
                                    height={72}
                                />
                            )}
                            <span className="match-detail-team-name">
                                {match.homeTeam?.name || 'Home'}
                            </span>
                        </div>

                        <div className="match-detail-score">
                            <span className="match-detail-score-num">{homeScore ?? '-'}</span>
                            <span className="match-detail-score-divider">:</span>
                            <span className="match-detail-score-num">{awayScore ?? '-'}</span>
                        </div>

                        <div className="match-detail-team">
                            {match.awayTeam?.crest && (
                                <Image
                                    src={match.awayTeam.crest}
                                    alt={`${match.awayTeam?.name || 'Away team'} crest`}
                                    width={72}
                                    height={72}
                                />
                            )}
                            <span className="match-detail-team-name">
                                {match.awayTeam?.name || 'Away'}
                            </span>
                        </div>
                    </div>

                    <div className="match-detail-meta">
                        <span>
                            {match.status === 'FINISHED' ? '✅ Full Time' :
                                match.status === 'IN_PLAY' ? '🔴 Live' :
                                    match.status === 'SCHEDULED' ? '📅 Scheduled' : match.status}
                        </span>
                        {match.utcDate && (
                            <span>{new Date(match.utcDate).toLocaleDateString('en-US', {
                                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                            })}</span>
                        )}
                    </div>
                </div>

                {/* Goals (Free) */}
                {match.goals && match.goals.length > 0 && (
                    <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            ⚽ Goals
                            <span className="badge badge-finished">FREE</span>
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {match.goals.map((goal, i) => (
                                <div key={i} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '10px',
                                    background: 'rgba(0,0,0,0.2)',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                }}>
                                    <span style={{
                                        width: '32px',
                                        textAlign: 'center',
                                        fontWeight: 700,
                                        color: 'var(--success)',
                                    }}>{goal.minute}&apos;</span>
                                    <span>⚽</span>
                                    <span style={{ fontWeight: 600 }}>{goal.scorer?.name || 'Unknown'}</span>
                                    {goal.assist?.name && (
                                        <span style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>
                                            (assist: {goal.assist.name})
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Paid Content Sections */}
                <div className="paid-sections">
                    {/* Highlights — 0.05 STX */}
                    <div className="card paid-section">
                        <div className="paid-section-header">
                            <h3 className="paid-section-title">
                                🎬 Match Highlights
                            </h3>
                            <span className="badge badge-paid">💰 0.05 STX</span>
                        </div>
                        <p className="paid-section-desc">
                            Watch official video highlights from the match. Powered by Scorebat.
                        </p>
                        <PaymentGate
                            price="50000"
                            label="Match Highlights"
                            icon="🎬"
                            description="Pay 0.05 STX to unlock match highlights"
                            unlockRequest={(proof) => getHighlights(matchId, proof)}
                        >
                            {(data) => (
                                <HighlightPlayer highlights={data?.highlights} />
                            )}
                        </PaymentGate>
                    </div>

                    {/* Analytics — 0.03 STX */}
                    <div className="card paid-section">
                        <div className="paid-section-header">
                            <h3 className="paid-section-title">
                                📊 Deep Analytics
                            </h3>
                            <span className="badge badge-paid">💰 0.03 STX</span>
                        </div>
                        <p className="paid-section-desc">
                            Possession, shots, xG, tactical breakdowns, and head-to-head stats.
                        </p>
                        <PaymentGate
                            price="30000"
                            label="Deep Analytics"
                            icon="📊"
                            description="Pay 0.03 STX to unlock match analytics"
                            unlockRequest={(proof) => getAnalytics(matchId, proof)}
                        >
                            {(data) => <AnalyticsDisplay analytics={data?.analytics} />}
                        </PaymentGate>
                    </div>

                    {/* AI Summary — 0.02 STX */}
                    <div className="card paid-section">
                        <div className="paid-section-header">
                            <h3 className="paid-section-title">
                                🤖 AI Match Summary
                            </h3>
                            <span className="badge badge-paid">💰 0.02 STX</span>
                        </div>
                        <p className="paid-section-desc">
                            AI-powered tactical analysis and performance insights.
                        </p>
                        <PaymentGate
                            price="20000"
                            label="AI Match Summary"
                            icon="🤖"
                            description="Pay 0.02 STX for AI tactical analysis"
                            unlockRequest={(proof) => getAISummary(matchId, proof)}
                        >
                            {(data) => <AIAnalysis summary={data?.aiSummary} />}
                        </PaymentGate>
                    </div>
                </div>
            </div>

            <footer className="footer">
                <p>402FC — Pay-per-match football intelligence powered by x402-stacks</p>
            </footer>
        </>
    );
}

// Analytics display sub-component
function AnalyticsDisplay({ analytics }) {
    if (!analytics) return <p>No analytics available.</p>;

    const stats = analytics.stats;
    if (!stats) return <p>No stats available.</p>;

    const statItems = [
        { label: 'Possession', home: stats.possession?.home, away: stats.possession?.away, suffix: '%' },
        { label: 'Shots', home: stats.shots?.home, away: stats.shots?.away },
        { label: 'Shots on Target', home: stats.shotsOnTarget?.home, away: stats.shotsOnTarget?.away },
        { label: 'Corners', home: stats.corners?.home, away: stats.corners?.away },
        { label: 'Fouls', home: stats.fouls?.home, away: stats.fouls?.away },
        { label: 'Yellow Cards', home: stats.yellowCards?.home, away: stats.yellowCards?.away },
        { label: 'Pass Accuracy', home: stats.passAccuracy?.home, away: stats.passAccuracy?.away, suffix: '%' },
        { label: 'xG', home: stats.xG?.home, away: stats.xG?.away },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {statItems.map(({ label, home, away, suffix = '' }) => {
                const max = Math.max(home || 0, away || 0) || 1;
                return (
                    <div key={label} style={{ fontSize: '13px' }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '4px',
                        }}>
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)', minWidth: '40px' }}>
                                {home}{suffix}
                            </span>
                            <span style={{ color: 'var(--text-tertiary)', fontSize: '11px', textTransform: 'uppercase' }}>
                                {label}
                            </span>
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)', minWidth: '40px', textAlign: 'right' }}>
                                {away}{suffix}
                            </span>
                        </div>
                        <div className="analytics-stat-bar">
                            <div className="stat-bar-container">
                                <div
                                    className="stat-bar-fill home"
                                    style={{ width: `${((home || 0) / max) * 100}%` }}
                                />
                            </div>
                            <div className="stat-bar-container">
                                <div
                                    className="stat-bar-fill away"
                                    style={{ width: `${((away || 0) / max) * 100}%` }}
                                />
                            </div>
                        </div>
                    </div>
                );
            })}

            {/* Goals Timeline */}
            {analytics.goals && analytics.goals.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                    <h4 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                        Goals Timeline
                    </h4>
                    {analytics.goals.map((goal, i) => (
                        <div key={i} style={{
                            display: 'flex', gap: '8px', alignItems: 'center',
                            padding: '6px 10px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px',
                            marginBottom: '4px', fontSize: '12px',
                        }}>
                            <span style={{ color: 'var(--success)', fontWeight: 700 }}>{goal.minute}&apos;</span>
                            <span>⚽ {goal.scorer?.name}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
