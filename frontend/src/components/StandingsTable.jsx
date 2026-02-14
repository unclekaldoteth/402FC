'use client';

import Image from 'next/image';

export default function StandingsTable({ standings, competition }) {
    if (!standings || standings.length === 0) {
        return (
            <div className="empty-state">
                <p>No standings available.</p>
            </div>
        );
    }

    return (
        <div style={{ overflowX: 'auto' }}>
            <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '13px',
            }}>
                <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <th style={thStyle}>#</th>
                        <th style={{ ...thStyle, textAlign: 'left', minWidth: '180px' }}>Team</th>
                        <th style={thStyle}>MP</th>
                        <th style={thStyle}>W</th>
                        <th style={thStyle}>D</th>
                        <th style={thStyle}>L</th>
                        <th style={thStyle}>GF</th>
                        <th style={thStyle}>GA</th>
                        <th style={thStyle}>GD</th>
                        <th style={{ ...thStyle, color: 'var(--accent-green)', fontWeight: 700 }}>Pts</th>
                    </tr>
                </thead>
                <tbody>
                    {standings.map((entry) => (
                        <tr
                            key={entry.position}
                            style={{
                                borderBottom: '1px solid var(--border-color)',
                                transition: 'background 150ms ease',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                            <td style={{ ...tdStyle, fontWeight: 600, color: getPositionColor(entry.position) }}>
                                {entry.position}
                            </td>
                            <td style={{ ...tdStyle, textAlign: 'left' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {entry.team?.crest && (
                                        <Image
                                            src={entry.team.crest}
                                            alt={`${entry.team?.name || 'Team'} crest`}
                                            width={20}
                                            height={20}
                                            style={{ width: '20px', height: '20px', objectFit: 'contain' }}
                                        />
                                    )}
                                    <span style={{ fontWeight: 500 }}>
                                        {entry.team?.shortName || entry.team?.name}
                                    </span>
                                </div>
                            </td>
                            <td style={tdStyle}>{entry.playedGames}</td>
                            <td style={tdStyle}>{entry.won}</td>
                            <td style={tdStyle}>{entry.draw}</td>
                            <td style={tdStyle}>{entry.lost}</td>
                            <td style={tdStyle}>{entry.goalsFor}</td>
                            <td style={tdStyle}>{entry.goalsAgainst}</td>
                            <td style={{ ...tdStyle, color: entry.goalDifference > 0 ? 'var(--accent-green)' : entry.goalDifference < 0 ? 'var(--accent-red)' : 'var(--text-muted)' }}>
                                {entry.goalDifference > 0 ? `+${entry.goalDifference}` : entry.goalDifference}
                            </td>
                            <td style={{ ...tdStyle, fontWeight: 700, color: 'var(--accent-green)', fontSize: '14px' }}>
                                {entry.points}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

const thStyle = {
    padding: '10px 8px',
    textAlign: 'center',
    color: 'var(--text-muted)',
    fontWeight: 600,
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
};

const tdStyle = {
    padding: '10px 8px',
    textAlign: 'center',
    color: 'var(--text-secondary)',
};

function getPositionColor(position) {
    if (position <= 4) return 'var(--accent-green)'; // Champions League
    if (position <= 6) return 'var(--accent-blue)';   // Europa League
    if (position >= 18) return 'var(--accent-red)';    // Relegation
    return 'var(--text-secondary)';
}
