'use client';

import Image from 'next/image';
import Link from 'next/link';

function getStatusBadge(status) {
    switch (status) {
        case 'IN_PLAY':
        case 'LIVE':
        case 'PAUSED':
            return (
                <span style={{
                    color: '#ef4444',
                    fontWeight: 700,
                    fontSize: '11px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    padding: '4px 8px',
                    borderRadius: '999px',
                    border: '1px solid rgba(239, 68, 68, 0.2)'
                }}>
                    <span style={{ width: '6px', height: '6px', background: '#ef4444', borderRadius: '50%' }}></span>
                    LIVE
                </span>
            );
        case 'FINISHED':
            return (
                <span style={{
                    color: 'var(--text-secondary)',
                    background: 'var(--surface-hover)',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 600
                }}>FT</span>
            );
        default:
            return (
                <span style={{
                    color: 'var(--accent-blue)',
                    background: 'rgba(252, 100, 50, 0.12)',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 600
                }}>
                    {status === 'SCHEDULED' || status === 'TIMED' ? 'UPCOMING' : status}
                </span>
            );
    }
}

function formatDate(utcDate) {
    if (!utcDate) return '';
    const date = new Date(utcDate);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function MatchCard({ match }) {
    const homeScore = match.score?.fullTime?.home;
    const awayScore = match.score?.fullTime?.away;
    const isFinished = match.status === 'FINISHED';
    const isLive = match.status === 'IN_PLAY' || match.status === 'LIVE';

    return (
        <Link href={`/match/${match.id}`} style={{ display: 'block', textDecoration: 'none' }}>
            <div className="card match-card">
                <div className="match-card-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {match.competition?.emblem && (
                            <Image
                                src={match.competition.emblem}
                                alt={`${match.competition?.name || 'Competition'} emblem`}
                                width={16}
                                height={16}
                            />
                        )}
                        <span style={{ fontWeight: 500 }}>{match.competition?.name || 'Match'}</span>
                    </div>
                    {getStatusBadge(match.status)}
                </div>

                <div className="match-card-body">
                    <div className="match-team">
                        {match.homeTeam?.crest && (
                            <Image
                                src={match.homeTeam.crest}
                                alt={`${match.homeTeam?.name || 'Home team'} crest`}
                                width={48}
                                height={48}
                            />
                        )}
                        <span className="match-team-name">
                            {match.homeTeam?.shortName || match.homeTeam?.name || 'Home'}
                        </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                        {isFinished || isLive ? (
                            <div className="match-score">
                                {homeScore} - {awayScore}
                            </div>
                        ) : (
                            <span style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-tertiary)' }}>VS</span>
                        )}

                        {!isFinished && !isLive && (
                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '12px' }}>
                                {formatDate(match.utcDate)}
                            </span>
                        )}
                    </div>

                    <div className="match-team">
                        {match.awayTeam?.crest && (
                            <Image
                                src={match.awayTeam.crest}
                                alt={`${match.awayTeam?.name || 'Away team'} crest`}
                                width={48}
                                height={48}
                            />
                        )}
                        <span className="match-team-name">
                            {match.awayTeam?.shortName || match.awayTeam?.name || 'Away'}
                        </span>
                    </div>
                </div>

                <div className="match-card-footer">
                    <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Matchday {match.matchday || '—'}</span>
                    {isFinished && (
                        <div className="unlock-hint">
                            <span style={{ background: 'var(--primary-gradient)', borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: 'black' }}>⚡</span>
                            <span className="logo-highlight" style={{ fontSize: '13px', fontWeight: 600 }}>Watch Highlights</span>
                        </div>
                    )}
                </div>
            </div>
        </Link>
    );
}
