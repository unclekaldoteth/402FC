'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import MatchCard from '@/components/MatchCard';
import { getMatches } from '@/lib/api';

const COMPETITIONS = [
    { code: '', name: 'All Leagues' },
    { code: 'PL', name: '🏴󠁧󠁢󠁥󠁮󠁧󠁿 Premier League' },
    { code: 'PD', name: '🇪🇸 La Liga' },
    { code: 'SA', name: '🇮🇹 Serie A' },
    { code: 'BL1', name: '🇩🇪 Bundesliga' },
    { code: 'FL1', name: '🇫🇷 Ligue 1' },
    { code: 'CL', name: '🏆 Champions League' },
];

function formatLocalDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export default function MatchesPage() {
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedCompetition, setSelectedCompetition] = useState('');
    const [dateRange, setDateRange] = useState('today');

    const loadMatches = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const params = {};
            if (selectedCompetition) params.competition = selectedCompetition;

            const today = new Date();
            if (dateRange === 'today') {
                const todayDate = formatLocalDate(today);
                params.dateFrom = todayDate;
                params.dateTo = todayDate;
            } else if (dateRange === 'week') {
                const weekAgo = new Date(today);
                weekAgo.setDate(weekAgo.getDate() - 3);
                const weekAhead = new Date(today);
                weekAhead.setDate(weekAhead.getDate() + 4);
                params.dateFrom = formatLocalDate(weekAgo);
                params.dateTo = formatLocalDate(weekAhead);
            } else if (dateRange === 'finished') {
                const weekAgo = new Date(today);
                weekAgo.setDate(weekAgo.getDate() - 7);
                params.dateFrom = formatLocalDate(weekAgo);
                params.dateTo = formatLocalDate(today);
                params.status = 'FINISHED';
            }

            const result = await getMatches(params);
            if (result.data) {
                setMatches(result.data.matches || []);
            } else {
                setMatches([]);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [selectedCompetition, dateRange]);

    useEffect(() => {
        loadMatches();
    }, [loadMatches]);

    return (
        <>
            <Header />

            <div className="page-header">
                <h1>⚽ Live Matches</h1>
                <p>Browse matches across all major leagues — free scores, pay for premium content</p>
            </div>

            {/* Date Range Filter */}
            <div className="filter-group">
                {[
                    { key: 'today', label: '📅 Today' },
                    { key: 'week', label: '📆 This Week' },
                    { key: 'finished', label: '✅ Recent Results' },
                ].map(({ key, label }) => (
                    <button
                        key={key}
                        className={`filter-btn ${dateRange === key ? 'active' : ''}`}
                        onClick={() => setDateRange(key)}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Competition Filter */}
            <div className="filter-group">
                {COMPETITIONS.map(({ code, name }) => (
                    <button
                        key={code}
                        className={`filter-btn ${selectedCompetition === code ? 'active' : ''}`}
                        onClick={() => setSelectedCompetition(code)}
                    >
                        {name}
                    </button>
                ))}
            </div>

            {/* Matches Grid */}
            {loading ? (
                <div className="loading">
                    <div className="spinner" />
                </div>
            ) : error ? (
                <div className="empty-state">
                    <div className="empty-state-icon">⚠️</div>
                    <p>{error}</p>
                    <button className="btn btn-secondary" onClick={loadMatches} style={{ marginTop: '16px' }}>
                        Try Again
                    </button>
                </div>
            ) : matches.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">⚽</div>
                    <p>No matches found for this selection.</p>
                    <p style={{ fontSize: '13px', marginTop: '8px', color: 'var(--text-tertiary)' }}>
                        Try a different date range or league filter.
                    </p>
                </div>
            ) : (
                <>
                    <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginBottom: '16px' }}>
                        Showing {matches.length} match{matches.length !== 1 ? 'es' : ''}
                    </p>
                    <div className="matches-grid">
                        {matches.map(match => (
                            <MatchCard key={match.id} match={match} />
                        ))}
                    </div>
                </>
            )}

            <footer className="footer">
                <p>402FC — Pay-per-match football intelligence powered by x402-stacks</p>
            </footer>
        </>
    );
}
