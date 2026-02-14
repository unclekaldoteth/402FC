# 402FC Future Development Plan: Premier League First, World Cup Next

Last updated: February 13, 2026

## 1) Scope and Goal

This document defines future development after the current hackathon MVP.

Current MVP uses the existing in-repo streaming/paywall implementation.

Future development targets a production **pay-per-watch** platform:

1. Launch commercial live streaming for one territory (Premier League first).
2. Prepare rights, legal, and technical rails for future FIFA World Cup coverage.
3. Add score prediction products directly in 402FC.

## 2) Territory Strategy (Outside US and Indonesia)

Rights are sold by territory. For countries outside US/Indonesia, we use a repeatable process instead of hardcoding assumptions.

### Territory Decision Framework

For each country:

1. Identify current rights-holder for Premier League and World Cup.
2. Determine access model:
   - Exclusive broadcaster only.
   - Broadcaster + sublicensing possible.
   - Agency distribution/tender still open.
3. Score feasibility (1-5):
   - Commercial feasibility (license cost vs expected ARPU).
   - Technical feasibility (API/feed access, DRM requirements).
   - Legal feasibility (geo, tax, privacy, consumer law).
4. Select one pilot country with highest total score.

### Operating Rule

- If rights are fully exclusive and no sublicensing path exists, do not promise live streaming there.
- Offer free stats + paid analytics/predictions in blocked territories until rights are available.

## 3) Hackathon MVP Positioning

Current MVP remains a **technical demonstration** of x402-based unlock flow.

### What stays in MVP

- Wallet connect + x402 payment flow.
- Paywall and entitlement UX.
- Stream session abstraction (`/api/streams/:streamId/watch`).
- Prediction and analytics modules.

### What is production-gated

- Official live match feeds.
- DRM and anti-piracy controls.
- Geo-rights enforcement and concurrency enforcement.

## 4) Commercial Workstream (Premier League)

### Step A: Rights Outreach Pack

Prepare a rights outreach deck with:

1. Product summary (pay-per-watch, no subscription lock-in).
2. Territory and audience target.
3. Revenue model and minimum guarantees.
4. Compliance plan (geo restriction, piracy response, reporting cadence).
5. Technical readiness (DRM, tokenized playback, audit logs).

### Step B: Contract Checklist

Required contract clauses:

1. Live linear rights scope (territory + devices + language).
2. Replay/highlight clip windows.
3. Distribution channel rights (web, mobile, TV casting).
4. Max concurrent sessions / anti-sharing policy.
5. SLA for feed uptime and incident escalation.
6. Reporting/payment settlement obligations.

## 5) World Cup Future Track

### Parallel Preparation (Do Now)

1. Track FIFA rights status for target pilot territory.
2. Build reusable rights abstraction in product config:
   - `competition -> territory -> entitlement policy`.
3. Keep contracts and tech stack competition-agnostic.

### Activation Condition

World Cup streaming is enabled only after:

1. Territory rights agreement is executed.
2. Feed integration and compliance tests pass.
3. Legal approval for consumer launch is complete.

## 6) Technical Roadmap in This Repo

### Phase 1: Demo-to-Prod Streaming Skeleton (Immediate)

1. Keep x402 two-step test coverage green.
2. Add environment-driven stream provider registry:
   - `STREAM_PROVIDER=demo|licensed`.
3. Add entitlement response contract:
   - playback URL (signed),
   - expiry,
   - rights metadata,
   - territory policy id.

### Phase 2: Licensed Stream Integration

Backend:

1. Replace demo catalog URLs with licensed ingest references.
2. Add signed playback URL generator.
3. Add geo validation middleware (IP + account profile).
4. Add concurrency limiter (session/device cap).

Frontend:

1. Show playback error reasons clearly:
   - geo blocked,
   - rights unavailable,
   - expired pass,
   - provider outage.
2. Keep fallback player only for demo mode.

### Phase 3: Prediction Product

1. Add prediction API surface:
   - pre-match win/draw/loss probabilities,
   - top scoreline scenarios,
   - live minute-by-minute update endpoint.
2. Monetize with x402 tiers:
   - free teaser + paid deep prediction insights.
3. Add clear disclaimer:
   - informational model output, not betting advice.

## 7) 6-Week Execution Plan

### Week 1-2

1. Finalize pilot territory scoring and pick one target market.
2. Build rights outreach pack and contact list.
3. Define legal requirements and launch constraints.

### Week 3-4

1. Negotiate LOI/term sheet with rights partner.
2. Implement provider abstraction + entitlement metadata.
3. Add geo + concurrency middleware stubs.

### Week 5

1. Integrate first licensed playback workflow in staging.
2. Run load test and payment-to-playback reliability test.
3. Complete incident runbook and monitoring alerts.

### Week 6

1. Private beta launch in selected territory.
2. Measure payment conversion, playback success, and churn.
3. Decide go/no-go for public release.

## 8) KPI and Go/No-Go

### KPI Targets (Pilot)

1. Payment-to-playback success rate >= 98%.
2. Playback start time (p95) <= 3.5s.
3. Failed unlock rate <= 2%.
4. Support tickets per 1,000 sessions <= 10.

### Go/No-Go Rules

Go live only when all are true:

1. Rights agreement signed.
2. Geo/compliance controls validated.
3. Incident response owner assigned 24/7 for match windows.
4. Financial reconciliation tested end-to-end.

## 9) Repo Deliverables Checklist

Immediate deliverables to keep in GitHub:

1. This plan file.
2. x402 integration tests (preflight + paid retry).
3. Production readiness checklist issue template.
4. Territory configuration template (`country`, `competition`, `rightsStatus`, `provider`).
