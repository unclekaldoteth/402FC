'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import WalletConnect from './WalletConnect';

export default function Header() {
    const pathname = usePathname();

    return (
        <header className="header-wrapper">
            <div className="container header-inner">
                <Link href="/" className="logo">
                    <span className="logo-row">
                        <span className="logo-highlight">402</span>
                        <span className="logo-main">FC</span>
                        <span className="logo-beta">BETA</span>
                    </span>
                </Link>

                <nav className="header-nav">
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
