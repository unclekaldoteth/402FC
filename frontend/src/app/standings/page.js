'use client';

import Image from 'next/image';
import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import StandingsTable from '@/components/StandingsTable';
import { getStandings } from '@/lib/api';

const COMPETITIONS = [
    { code: 'PL', name: '🏴󠁧󠁢󠁥󠁮󠁧󠁿 Premier League' },
    { code: 'PD', name: '🇪🇸 La Liga' },
    { code: 'SA', name: '🇮🇹 Serie A' },
    { code: 'BL1', name: '🇩🇪 Bundesliga' },
    { code: 'FL1', name: '🇫🇷 Ligue 1' },
];

export default function StandingsPage() {
    const [standings, setStandings] = useState([]);
    const [competition, setCompetition] = useState(null);
    const [selectedCode, setSelectedCode] = useState('PL');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadStandings = useCallback(async (code) => {
        setLoading(true);
        setError(null);

        try {
            const result = await getStandings(code);
            if (result.data) {
                setStandings(result.data.standings || []);
                setCompetition(result.data.competition);
            } else {
                setStandings([]);
                setCompetition(null);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadStandings(selectedCode);
    }, [selectedCode, loadStandings]);

    return (
        <>
            <Header />

            <div className="page-header">
                <h1>📊 League Standings</h1>
                <p>Live league tables for all major competitions — completely free</p>
            </div>

            {/* Competition Tabs */}
            <div className="filter-group">
                {COMPETITIONS.map(({ code, name }) => (
                    <button
                        key={code}
                        className={`filter-btn ${selectedCode === code ? 'active' : ''}`}
                        onClick={() => setSelectedCode(code)}
                    >
                        {name}
                    </button>
                ))}
            </div>

            {/* Competition Header */}
            {competition && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '24px',
                }}>
                    {competition.emblem && (
                        <Image
                            src={competition.emblem}
                            alt={`${competition.name || 'Competition'} emblem`}
                            width={32}
                            height={32}
                            style={{ width: '32px', height: '32px', objectFit: 'contain' }}
                        />
                    )}
                    <h2 style={{ fontSize: '20px', fontWeight: 700 }}>{competition.name}</h2>
                </div>
            )}

            {/* Table */}
            {loading ? (
                <div className="loading">
                    <div className="spinner" />
                </div>
            ) : error ? (
                <div className="empty-state">
                    <div className="empty-state-icon">⚠️</div>
                    <p>{error}</p>
                </div>
            ) : (
                <div className="card" style={{ padding: '16px', overflow: 'hidden' }}>
                    <StandingsTable standings={standings} competition={competition} />
                </div>
            )}

            <footer className="footer">
                <p>402FC — Pay-per-match football intelligence powered by x402-stacks</p>
            </footer>
        </>
    );
}
