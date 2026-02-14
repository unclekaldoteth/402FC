/**
 * Paid routes — Protected by x402-stacks payment middleware
 * Each route returns HTTP 402 unless a valid payment is provided.
 */

const express = require('express');
const axios = require('axios');
const router = express.Router();
const { paidHighlights, paidAnalytics, paidAISummary, paidStreaming, PRICES, NETWORK } = require('../middleware/x402');
const { getStreamById } = require('../data/streams');

const FOOTBALL_API = 'https://api.football-data.org/v4';
const SCOREBAT_API = 'https://www.scorebat.com/video-api/v3';
const API_KEY = process.env.FOOTBALL_DATA_API_KEY;
const SCOREBAT_KEY = process.env.SCOREBAT_API_KEY;
const MATCH_ID_PATTERN = /^\d+$/;
const STREAM_ID_PATTERN = /^[a-z0-9-]+$/;

function isValidMatchId(id) {
    if (typeof id !== 'string') return false;
    return MATCH_ID_PATTERN.test(id.trim());
}

function validateMatchIdParam(req, res, next) {
    const { matchId } = req.params;
    if (!isValidMatchId(matchId)) {
        return res.status(400).json({ error: 'Invalid match id' });
    }
    return next();
}

function isValidStreamId(id) {
    if (typeof id !== 'string') return false;
    return STREAM_ID_PATTERN.test(id.trim());
}

function validateStreamIdParam(req, res, next) {
    const { streamId } = req.params;
    if (!isValidStreamId(streamId)) {
        return res.status(400).json({ error: 'Invalid stream id' });
    }
    return next();
}

function validateStreamExists(req, res, next) {
    const { streamId } = req.params;
    const stream = getStreamById(streamId);
    if (!stream) {
        return res.status(404).json({ error: 'Stream not found' });
    }
    req.stream = stream;
    return next();
}

// Helper: proxy football-data.org
async function footballAPI(endpoint) {
    const headers = {};
    if (API_KEY) headers['X-Auth-Token'] = API_KEY;

    try {
        const response = await axios.get(`${FOOTBALL_API}${endpoint}`, { headers });
        return response.data;
    } catch (error) {
        if (error.response?.status === 429) {
            throw { status: 429, message: 'Rate limit exceeded. Try again in a minute.' };
        }
        if (error.response?.status === 403) {
            throw { status: 403, message: 'Football API key invalid or missing.' };
        }
        throw { status: error.response?.status || 500, message: error.message };
    }
}

// Helper: fetch highlights from Scorebat
async function fetchHighlights(teamName) {
    try {
        // Try Scorebat API first
        const params = {};
        if (SCOREBAT_KEY) params.token = SCOREBAT_KEY;

        const response = await axios.get(`${SCOREBAT_API}/feed`, { params });
        const videos = response.data?.response || response.data || [];

        // Try to find videos matching the team
        if (teamName && Array.isArray(videos)) {
            const matched = videos.filter(v =>
                v.title?.toLowerCase().includes(teamName.toLowerCase()) ||
                v.matchviewUrl?.toLowerCase().includes(teamName.toLowerCase())
            );
            if (matched.length > 0) return matched.slice(0, 3);
        }

        // Return latest highlights if no match found
        return Array.isArray(videos) ? videos.slice(0, 5) : [];
    } catch (error) {
        console.warn('Scorebat API error:', error.message);
        // Return demo highlights as fallback
        return getDemoHighlights(teamName);
    }
}

// Demo highlights for when Scorebat API isn't available
function getDemoHighlights(teamName) {
    return [
        {
            title: `${teamName || 'Match'} - Full Highlights`,
            embed: `<iframe width="560" height="315" src="https://www.youtube.com/embed/dQw4w9WgXcQ" frameborder="0" allowfullscreen></iframe>`,
            thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
            matchviewUrl: '#',
            competition: { name: 'Demo League' },
            date: new Date().toISOString(),
        }
    ];
}

// Helper: generate AI match summary
async function generateAISummary(matchData) {
    const OPENAI_KEY = process.env.OPENAI_API_KEY;

    if (!OPENAI_KEY) {
        // Return a mock AI summary for demo
        return generateMockSummary(matchData);
    }

    try {
        const prompt = buildMatchPrompt(matchData);
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert football analyst. Provide tactical analysis of matches. Be concise, insightful, and data-driven. Use bullet points for key insights.'
                    },
                    { role: 'user', content: prompt }
                ],
                max_tokens: 500,
                temperature: 0.7,
            },
            { headers: { Authorization: `Bearer ${OPENAI_KEY}` } }
        );

        return {
            analysis: response.data.choices?.[0]?.message?.content,
            model: 'gpt-3.5-turbo',
            generatedAt: new Date().toISOString(),
        };
    } catch (error) {
        console.warn('OpenAI error, using mock:', error.message);
        return generateMockSummary(matchData);
    }
}

function buildMatchPrompt(matchData) {
    const home = matchData.homeTeam?.name || 'Home Team';
    const away = matchData.awayTeam?.name || 'Away Team';
    const homeGoals = matchData.score?.fullTime?.home ?? '?';
    const awayGoals = matchData.score?.fullTime?.away ?? '?';

    return `Analyze this football match:
${home} ${homeGoals} - ${awayGoals} ${away}
Competition: ${matchData.competition?.name || 'Unknown'}
Status: ${matchData.status}
Goals: ${JSON.stringify(matchData.goals || [])}

Provide:
1. Match overview (2-3 sentences)
2. Key tactical observations (3 bullet points)
3. Stand-out player performances
4. What this result means for both teams`;
}

function generateMockSummary(matchData) {
    const home = matchData.homeTeam?.name || 'Home Team';
    const away = matchData.awayTeam?.name || 'Away Team';
    const homeGoals = matchData.score?.fullTime?.home ?? 0;
    const awayGoals = matchData.score?.fullTime?.away ?? 0;

    const winner = homeGoals > awayGoals ? home : homeGoals < awayGoals ? away : null;

    return {
        analysis: `## Match Analysis: ${home} ${homeGoals} - ${awayGoals} ${away}

**Overview:** ${winner ? `${winner} secured a decisive victory` : 'A hard-fought draw'} in what was an enthralling ${matchData.competition?.name || ''} encounter. ${home} showed ${homeGoals > awayGoals ? 'dominant' : 'resilient'} form throughout the match.

**Key Tactical Observations:**
• ${home}'s pressing intensity in the first half was a key factor, forcing ${away} into mistakes in the build-up phase
• The midfield battle was crucial — the winning side showed better ball retention and transitional play
• Set pieces proved decisive, with ${homeGoals + awayGoals > 2 ? 'multiple goals coming from dead-ball situations' : 'both teams defending well from corners and free kicks'}

**Standout Performances:**
The ${winner || home} midfield orchestrated the game well, with their defensive line maintaining an excellent high press that limited ${winner === home ? away : home}'s attacking opportunities.

**Implications:**
This result ${winner ? `boosts ${winner}'s chances in the title race` : 'keeps both teams in contention'} as the season enters a crucial phase.`,
        model: 'mock-analysis',
        generatedAt: new Date().toISOString(),
    };
}

/**
 * GET /api/highlights/:matchId
 * 💰 PAID — 0.05 STX
 * Returns highlight videos for a match.
 */
router.get('/highlights/:matchId', validateMatchIdParam, paidHighlights, async (req, res) => {
    try {
        const { matchId } = req.params;

        // Get match info first to know team names
        let matchData;
        try {
            matchData = await footballAPI(`/matches/${matchId}`);
        } catch (e) {
            matchData = { homeTeam: { name: 'Team' }, awayTeam: { name: 'Opponent' } };
        }

        const teamName = matchData.homeTeam?.name;
        const highlights = await fetchHighlights(teamName);

        res.json({
            matchId,
            match: {
                home: matchData.homeTeam?.name,
                away: matchData.awayTeam?.name,
                score: matchData.score,
            },
            highlights: highlights.map(h => ({
                title: h.title,
                embed: h.embed,
                thumbnail: h.thumbnail,
                url: h.matchviewUrl,
                competition: h.competition?.name,
                date: h.date,
            })),
            paymentInfo: {
                amount: PRICES.highlights,
                asset: 'STX',
                description: 'Match highlights unlocked via x402 payment',
            }
        });
    } catch (error) {
        res.status(error.status || 500).json({ error: error.message || 'Internal server error' });
    }
});

/**
 * GET /api/analytics/:matchId
 * 💰 PAID — 0.03 STX
 * Returns deep match analytics: head2head, lineups, events, stats.
 */
router.get('/analytics/:matchId', validateMatchIdParam, paidAnalytics, async (req, res) => {
    try {
        const { matchId } = req.params;
        const matchData = await footballAPI(`/matches/${matchId}`);

        // Get head-to-head data
        let h2h = null;
        try {
            const h2hData = await footballAPI(`/matches/${matchId}`);
            h2h = h2hData.head2head;
        } catch (e) {
            // h2h not always available
        }

        res.json({
            matchId,
            match: {
                home: matchData.homeTeam?.name,
                away: matchData.awayTeam?.name,
                score: matchData.score,
                status: matchData.status,
            },
            analytics: {
                goals: matchData.goals || [],
                bookings: matchData.bookings || [],
                substitutions: matchData.substitutions || [],
                stats: matchData.statistics || generateMockStats(matchData),
                headToHead: h2h,
                venue: matchData.venue,
                referees: matchData.referees,
            },
            paymentInfo: {
                amount: PRICES.analytics,
                asset: 'STX',
                description: 'Deep analytics unlocked via x402 payment',
            }
        });
    } catch (error) {
        res.status(error.status || 500).json({ error: error.message || 'Internal server error' });
    }
});

/**
 * GET /api/ai-summary/:matchId
 * 💰 PAID — 0.02 STX
 * Returns AI-generated tactical analysis of the match.
 */
router.get('/ai-summary/:matchId', validateMatchIdParam, paidAISummary, async (req, res) => {
    try {
        const { matchId } = req.params;

        let matchData;
        try {
            matchData = await footballAPI(`/matches/${matchId}`);
        } catch (e) {
            matchData = {
                homeTeam: { name: 'Home Team' },
                awayTeam: { name: 'Away Team' },
                score: { fullTime: { home: 1, away: 0 } },
                competition: { name: 'League' },
                status: 'FINISHED',
                goals: [],
            };
        }

        const summary = await generateAISummary(matchData);

        res.json({
            matchId,
            match: {
                home: matchData.homeTeam?.name,
                away: matchData.awayTeam?.name,
                score: matchData.score,
            },
            aiSummary: summary,
            paymentInfo: {
                amount: PRICES.aiSummary,
                asset: 'STX',
                description: 'AI tactical analysis unlocked via x402 payment',
            }
        });
    } catch (error) {
        res.status(error.status || 500).json({ error: error.message || 'Internal server error' });
    }
});

/**
 * GET /api/streams/:streamId/watch
 * 💰 PAID — 0.08 STX
 * Returns stream session payload after payment verification.
 */
router.get(
    '/streams/:streamId/watch',
    validateStreamIdParam,
    validateStreamExists,
    paidStreaming,
    async (req, res) => {
    try {
        const stream = req.stream;

        const now = Date.now();
        const sessionTtlMs = 15 * 60 * 1000; // 15 min demo session window
        const expiresAt = new Date(now + sessionTtlMs).toISOString();
        const paidBy = req.payment?.payer || null;

        res.json({
            streamId: stream.id,
            title: stream.title,
            competition: stream.competition,
            status: stream.status,
            startsAtUtc: stream.startsAtUtc,
            teams: {
                home: stream.homeTeam,
                away: stream.awayTeam,
            },
            session: {
                id: `sess_${stream.id}_${now}`,
                issuedAt: new Date(now).toISOString(),
                expiresAt,
                ttlSeconds: Math.floor(sessionTtlMs / 1000),
                paidBy,
            },
            playback: {
                url: stream.streamUrl,
                sourceUrl: stream.sourceUrl || stream.streamUrl,
                mimeType: stream.mimeType || 'video/mp4',
                fallbackEmbedUrl: stream.fallbackEmbedUrl || null,
                drm: false,
                lowLatency: false,
                isDemoSource: true,
            },
            paymentInfo: {
                amount: PRICES.streamWatch,
                asset: 'STX',
                description: 'Pay-per-watch live stream session unlocked via x402 payment',
            }
        });
    } catch (error) {
        res.status(error.status || 500).json({ error: error.message || 'Internal server error' });
    }
});

/**
 * GET /api/pricing
 * Returns current pricing for all paid endpoints.
 */
router.get('/pricing', (req, res) => {
    res.json({
        currency: 'STX',
        network: NETWORK,
        tiers: [
            {
                endpoint: '/api/highlights/:matchId',
                name: 'Match Highlights',
                description: 'Official video highlights from top leagues',
                price: PRICES.highlights,
                priceFormatted: `${parseInt(PRICES.highlights) / 1000000} STX`,
                icon: '🎬',
            },
            {
                endpoint: '/api/analytics/:matchId',
                name: 'Deep Analytics',
                description: 'Goals, bookings, tactics, and head-to-head stats',
                price: PRICES.analytics,
                priceFormatted: `${parseInt(PRICES.analytics) / 1000000} STX`,
                icon: '📊',
            },
            {
                endpoint: '/api/ai-summary/:matchId',
                name: 'AI Match Summary',
                description: 'AI-generated tactical analysis and insights',
                price: PRICES.aiSummary,
                priceFormatted: `${parseInt(PRICES.aiSummary) / 1000000} STX`,
                icon: '🤖',
            },
            {
                endpoint: '/api/streams/:streamId/watch',
                name: 'Live Stream Watch Pass',
                description: 'Pay-per-watch stream access session',
                price: PRICES.streamWatch,
                priceFormatted: `${parseInt(PRICES.streamWatch) / 1000000} STX`,
                icon: '📺',
            },
        ]
    });
});

// Mock stats generator for when detailed stats aren't available from the API
function generateMockStats(matchData) {
    return {
        possession: { home: 55, away: 45 },
        shots: { home: 14, away: 8 },
        shotsOnTarget: { home: 6, away: 3 },
        corners: { home: 7, away: 4 },
        fouls: { home: 11, away: 13 },
        yellowCards: { home: 2, away: 3 },
        redCards: { home: 0, away: 0 },
        offsides: { home: 2, away: 1 },
        passAccuracy: { home: 87, away: 82 },
        xG: { home: 1.8, away: 0.9 },
    };
}

module.exports = router;
