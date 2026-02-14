'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import WalletConnect from './WalletConnect';

export default function Header() {
    const pathname = usePathname();

    return (
        <header className="header-wrapper">
            <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <Link href="/" className="logo">
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="logo-highlight">402</span>
                        <span style={{ color: 'var(--text-primary)' }}>FC</span>
                        <span style={{
                            fontSize: '12px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid var(--border)',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontWeight: 500,
                            color: 'var(--accent-teal)'
                        }}>BETA</span>
                    </span>
                </Link>

                <nav style={{ display: 'flex', alignItems: 'center' }}>
                    <Link href="/" className={`nav-link ${pathname === '/' ? 'active' : ''}`}>
                        Home
                    </Link>
                    <Link href="/matches" className={`nav-link ${pathname === '/matches' ? 'active' : ''}`}>
                        Matches
                    </Link>
                    <Link href="/standings" className={`nav-link ${pathname === '/standings' ? 'active' : ''}`}>
                        Standings
                    </Link>
                    <Link href="/streaming" className={`nav-link ${pathname === '/streaming' ? 'active' : ''}`}>
                        Streaming
                    </Link>
                </nav>

                <WalletConnect />
            </div>
        </header>
    );
}
