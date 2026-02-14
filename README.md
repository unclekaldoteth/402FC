# 402FC ⚽ — Pay-Per-Watch Football Streaming

> Pay micro-amounts of STX to unlock stream sessions, match highlights, deep analytics, and AI-powered tactical analysis. No subscriptions — powered by **x402-stacks** on the Stacks blockchain.

Built for the [x402 Stacks Challenge](https://dorahacks.io/hackathon/x402-stacks/detail) hackathon (Feb 9-16, 2026).

Future development roadmap:
- [Future Development: Premier League + World Cup + Predictions](docs/FUTURE_DEVELOPMENT.md)
- [Why 402FC Exists: Background, Problem, Solution, Market Opportunity](docs/WHY_402FC.md)

## 🎯 What is 402FC?

402FC is a web3 dApp that demonstrates the x402 payment protocol for football content monetization:

| Content | Price | Description |
|---------|-------|-------------|
| 🆓 Live Scores | Free | Matches, standings, fixtures across 5+ leagues |
| 📺 Stream Watch Pass | 0.08 STX | Pay-per-watch stream session (current MVP development) |
| 🎬 Highlights | 0.05 STX | Official video highlights from Scorebat |
| 📊 Deep Analytics | 0.03 STX | Possession, xG, shots, tactical breakdowns |
| 🤖 AI Summary | 0.02 STX | AI-generated tactical analysis |

## ⚡ How x402 Works

1. **Browse** — Free scores and standings, no wallet needed
2. **Click Unlock** — Premium content returns HTTP 402 (Payment Required)
3. **Pay** — Your Stacks wallet signs a micro STX payment
4. **Enjoy** — Payment verified by facilitator, content delivered instantly

```
Client → GET /api/streams/premier-league-live-1/watch
Server → 402 Payment Required (0.08 STX)
Client → Pays via Stacks Wallet
Client → GET /api/streams/premier-league-live-1/watch + payment-signature
Server → 200 OK + stream session payload
```

## 🛠️ Tech Stack

- **Frontend:** Next.js 16, Vanilla CSS, Recharts
- **Backend:** Express.js, x402-stacks middleware
- **Payments:** x402-stacks (STX/sBTC on Stacks blockchain)
- **Wallet:** @stacks/connect (Leather/Xverse)
- **Data:** Football-Data.org API, Scorebat Video API, OpenAI

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Stacks wallet (Leather or Xverse)
- API keys (see below)

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/402fc.git
cd 402fc

# Install backend
cd backend && npm install

# Install frontend
cd ../frontend && npm install
```

### 2. Configure Environment

```bash
# backend/.env
PORT=3001
NETWORK=testnet
STX_ADDRESS=your_stx_testnet_address
FACILITATOR_URL=https://facilitator.stacksx402.com
FOOTBALL_DATA_API_KEY=your_key  # Free at football-data.org
SCOREBAT_API_KEY=your_key       # Free at scorebat.com
OPENAI_API_KEY=your_key         # Optional
```

### 3. Run

```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

## 📁 Project Structure

```
402fc/
├── backend/
│   ├── src/
│   │   ├── index.js              # Express server
│   │   ├── data/streams.js       # Stream catalog metadata
│   │   ├── middleware/x402.js    # x402 payment gates
│   │   └── routes/
│   │       ├── free.js           # Free: scores, standings, stream catalog
│   │       └── paid.js           # Paid: stream watch, highlights, analytics, AI
│   └── .env
├── frontend/
│   └── src/
│       ├── app/                  # Next.js pages
│       │   ├── page.js           # Landing page
│       │   ├── matches/          # Match browser
│       │   ├── standings/        # League tables
│       │   ├── streaming/        # Pay-per-watch stream unlock page
│       │   └── match/[id]/       # Match detail + paid content
│       ├── components/
│       │   ├── PaymentGate.jsx   # Core x402 payment flow
│       │   ├── WalletConnect.jsx # Stacks wallet
│       │   ├── MatchCard.jsx     # Match preview card
│       │   └── ...
│       └── lib/
│           ├── api.js            # Backend API client
│           └── stacks.js         # Stacks wallet helpers
├── docs/
│   └── FUTURE_DEVELOPMENT.md
└── README.md
```

## 🏗️ Architecture

```
Frontend (Next.js) → HTTP/x402 → Backend (Express)
                                   ├── Free Routes → Football-Data.org
                                   └── Paid Routes (x402 paywall)
                                        ├── Streaming → Session unlock API
                                        ├── Highlights → Scorebat API
                                        ├── Analytics → Football-Data.org
                                        └── AI Summary → OpenAI
```

## 📜 License

MIT

## 🙏 Credits

- [x402-stacks](https://docs.x402stacks.xyz/) — Payment protocol
- [Stacks](https://stacks.co) — Bitcoin L2 blockchain
- [Football-Data.org](https://football-data.org) — Match data
- [Scorebat](https://scorebat.com) — Video highlights
