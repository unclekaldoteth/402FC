'use client';

import Link from 'next/link';
import Header from '@/components/Header';
import { useState, useEffect } from 'react';
import { getPricing } from '@/lib/api';

export default function HomePage() {
  const [pricing, setPricing] = useState([]);

  useEffect(() => {
    getPricing().then(res => {
      if (res.data?.tiers) setPricing(res.data.tiers);
    }).catch(() => { });
  }, []);

  return (
    <>
      <Header />

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge">
            <span style={{ color: 'var(--accent-teal)' }}>⚡</span> Powered by x402-stacks • Stacks Blockchain
          </div>

          <h1 className="hero-title">
            Football Streaming,<br />
            <span className="logo-highlight">Pay Per Watch</span>
          </h1>

          <p className="hero-subtitle">
            Unlock live stream sessions, match highlights, deep analytics, and AI tactical analysis.
            No subscriptions. Pay only when you watch, using STX.
          </p>

          <div className="hero-buttons">
            <Link href="/matches" className="btn btn-primary hero-cta">
              ⚽ Browse Matches
            </Link>
            <Link href="/streaming" className="btn btn-primary hero-cta">
              📺 Watch Streams
            </Link>
            <Link href="/standings" className="btn btn-secondary hero-cta">
              📊 League Standings
            </Link>
          </div>

          <div className="hero-stats">
            <div className="hero-stat">
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>5+</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>Major Leagues</div>
            </div>
            <div className="hero-stat">
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>0.02-0.08</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>STX per unlock</div>
            </div>
            <div className="hero-stat">
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>x402</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>HTTP Protocol</div>
            </div>
            <div className="hero-stat">
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>0</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>Subscriptions</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="landing-section">
        <div className="landing-section-head">
          <h2 className="landing-section-title">How It Works</h2>
          <p className="landing-section-subtitle">Three simple steps to unlock premium football content</p>
        </div>

        <div className="landing-grid">
          <div className="card landing-card">
            <div style={{ fontSize: '32px', marginBottom: '16px' }}>👛</div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>1. Connect Wallet</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Connect your Stacks wallet (Leather/Xverse). Your gateway to pay-per-match content.
            </p>
          </div>
          <div className="card landing-card">
            <div style={{ fontSize: '32px', marginBottom: '16px' }}>⚽</div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>2. Browse Matches</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Explore live scores, standings, and fixtures for free across all major leagues.
            </p>
          </div>
          <div className="card landing-card">
            <div style={{ fontSize: '32px', marginBottom: '16px' }}>🔓</div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>3. Unlock Watch Pass</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Pay STX via x402 to start a stream session and unlock premium match content.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="landing-section">
        <div className="landing-section-head">
          <h2 className="landing-section-title">Pay Only For What You Watch</h2>
          <p className="landing-section-subtitle">No subscriptions. No commitments. Just pay per match.</p>
        </div>

        <div className="landing-grid">
          {(pricing.length > 0 ? pricing : defaultPricing).map((tier, i) => (
            <div key={i} className="card landing-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div style={{ fontSize: '32px', marginBottom: '16px' }}>{tier.icon}</div>
              <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>{tier.name}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6, flex: 1, marginBottom: '24px' }}>{tier.description}</p>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>{tier.priceFormatted || `${parseInt(tier.price) / 1000000} STX`}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>per unlock</div>
            </div>
          ))}
        </div>
      </section>

      {/* x402 Explainer */}
      <section className="landing-section">
        <div className="landing-section-head">
          <h2 className="landing-section-title">Powered by x402-stacks</h2>
          <p className="landing-section-subtitle">The open payment protocol that makes pay-per-use possible</p>
        </div>

        <div className="card landing-explainer">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="landing-explainer-row">
              <span style={{ fontSize: '24px' }}>📡</span>
              <div>
                <strong style={{ color: 'var(--text-primary)', fontSize: '16px' }}>HTTP 402 — Payment Required</strong>
                <p style={{ marginTop: '4px', fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>When you request premium content, the server returns HTTP 402 with payment requirements — amount, wallet, and network.</p>
              </div>
            </div>
            <div className="landing-explainer-row">
              <span style={{ fontSize: '24px' }}>⚡</span>
              <div>
                <strong style={{ color: 'var(--text-primary)', fontSize: '16px' }}>Instant STX Micropayment</strong>
                <p style={{ marginTop: '4px', fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>Your wallet signs a small STX payment (as low as 0.02 STX). Settled on the Stacks blockchain, secured by Bitcoin.</p>
              </div>
            </div>
            <div className="landing-explainer-row">
              <span style={{ fontSize: '24px' }}>✅</span>
              <div>
                <strong style={{ color: 'var(--text-primary)', fontSize: '16px' }}>Content Unlocked</strong>
                <p style={{ marginTop: '4px', fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>Payment verified by the facilitator, and your premium stream session plus analysis content is delivered instantly.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <p style={{ marginBottom: '16px' }}>
          <strong style={{ color: 'var(--text-primary)' }}>402FC</strong> — Built for the{' '}
          <a href="https://dorahacks.io/hackathon/x402-stacks/detail" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-primary)', textDecoration: 'underline' }}>
            x402 Stacks Challenge
          </a>
        </p>
        <div className="landing-footer-links">
          <a href="https://docs.x402stacks.xyz/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)' }}>x402 Docs</a>
          <a href="https://stacks.co" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)' }}>Stacks</a>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)' }}>GitHub</a>
        </div>
      </footer>
    </>
  );
}

const defaultPricing = [
  {
    icon: '📺',
    name: 'Live Stream Watch Pass',
    description: 'Start a pay-per-watch session for live or replay streaming',
    price: '80000',
    priceFormatted: '0.08 STX',
  },
  {
    icon: '🎬',
    name: 'Match Highlights',
    description: 'Official video highlights from top leagues worldwide',
    price: '50000',
    priceFormatted: '0.05 STX',
  },
  {
    icon: '📊',
    name: 'Deep Analytics',
    description: 'Possession, shots, xG, heatmaps, and tactical breakdowns',
    price: '30000',
    priceFormatted: '0.03 STX',
  },
  {
    icon: '🤖',
    name: 'AI Match Summary',
    description: 'AI-powered tactical analysis and performance insights',
    price: '20000',
    priceFormatted: '0.02 STX',
  },
];
