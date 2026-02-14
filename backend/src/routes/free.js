/**
 * Free routes — No payment required
 * Proxies football-data.org v4 API for live scores, standings, and fixtures.
 */

const express = require('express');
const axios = require('axios');
const router = express.Router();
const { PRICES, NETWORK } = require('../middleware/x402');
const { STREAM_CATALOG, formatStreamForCatalog } = require('../data/streams');

const FOOTBALL_API = 'https://api.football-data.org/v4';
const API_KEY = process.env.FOOTBALL_DATA_API_KEY;

// Competition codes for major leagues
const COMPETITIONS = {
    PL: 'Premier League',
    PD: 'La Liga',
    SA: 'Serie A',
    BL1: 'Bundesliga',
    FL1: 'Ligue 1',
    CL: 'Champions League',
    EC: 'European Championship',
    WC: 'FIFA World Cup',
};

const VALID_MATCH_STATUSES = new Set([
    'SCHEDULED',
    'TIMED',
    'LIVE',
    'IN_PLAY',
    'PAUSED',
    'FINISHED',
]);

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MATCH_ID_PATTERN = /^\d+$/;

function normalizeCompetitionCode(code) {
    if (typeof code !== 'string') return null;
    const normalized = code.trim().toUpperCase();
    return normalized || null;
}

function normalizeStatus(status) {
    if (typeof status !== 'string') return null;
    const normalized = status.trim().toUpperCase();
    return normalized || null;
}

function isValidDateString(value) {
    if (typeof value !== 'string') return false;
    return DATE_PATTERN.test(value);
}

function isValidMatchId(id) {
    if (typeof id !== 'string') return false;
    return MATCH_ID_PATTERN.test(id.trim());
}

// Helper: proxy request to football-data.org
async function footballAPI(endpoint) {
    const headers = {};
    if (API_KEY) {
        headers['X-Auth-Token'] = API_KEY;
    }

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

/**
 * GET /api/matches
 * Returns today's matches across all competitions.
 * Optional query: ?competition=PL&dateFrom=2026-02-13&dateTo=2026-02-14
 */
router.get('/matches', async (req, res) => {
    try {
        const { competition, dateFrom, dateTo, status } = req.query;
        const competitionCode = normalizeCompetitionCode(competition);
        const statusCode = normalizeStatus(status);

        if (competitionCode && !COMPETITIONS[competitionCode]) {
            return res.status(400).json({ error: `Invalid competition code: ${competition}` });
        }

        if (statusCode && !VALID_MATCH_STATUSES.has(statusCode)) {
            return res.status(400).json({ error: `Invalid status: ${status}` });
        }

        if (dateFrom && !isValidDateString(dateFrom)) {
            return res.status(400).json({ error: 'dateFrom must be in YYYY-MM-DD format' });
        }

        if (dateTo && !isValidDateString(dateTo)) {
            return res.status(400).json({ error: 'dateTo must be in YYYY-MM-DD format' });
        }

        const params = new URLSearchParams();
        if (competitionCode) params.set('competitions', competitionCode);
        if (dateFrom) params.set('dateFrom', dateFrom);
        if (dateTo) params.set('dateTo', dateTo);
        if (statusCode) params.set('status', statusCode);

        const query = params.toString();
        const endpoint = query ? `/matches?${query}` : '/matches';

        if (dateFrom && dateTo && dateFrom > dateTo) {
            return res.status(400).json({ error: 'dateFrom must be earlier than or equal to dateTo' });
        }

        const data = await footballAPI(endpoint);

        // Transform response for frontend
        const matches = (data.matches || []).map(match => ({
            id: match.id,
            competition: {
                name: match.competition?.name,
                code: match.competition?.code,
                emblem: match.competition?.emblem,
            },
            homeTeam: {
                id: match.homeTeam?.id,
                name: match.homeTeam?.name,
                shortName: match.homeTeam?.shortName,
                crest: match.homeTeam?.crest,
            },
            awayTeam: {
                id: match.awayTeam?.id,
                name: match.awayTeam?.name,
                shortName: match.awayTeam?.shortName,
                crest: match.awayTeam?.crest,
            },
            score: match.score,
            status: match.status,
            utcDate: match.utcDate,
            matchday: match.matchday,
        }));

        res.json({
            count: matches.length,
            competitions: COMPETITIONS,
            matches
        });
    } catch (error) {
        res.status(error.status || 500).json({ error: error.message });
    }
});

/**
 * GET /api/standings/:competition
 * Returns league standings. Competition code: PL, PD, SA, BL1, FL1
 */
router.get('/standings/:competition', async (req, res) => {
    try {
        const competitionCode = normalizeCompetitionCode(req.params.competition);
        if (!competitionCode || !COMPETITIONS[competitionCode]) {
            return res.status(400).json({ error: `Invalid competition code: ${req.params.competition}` });
        }

        const data = await footballAPI(`/competitions/${competitionCode}/standings`);

        const standings = data.standings?.[0]?.table?.map(entry => ({
            position: entry.position,
            team: {
                id: entry.team?.id,
                name: entry.team?.name,
                shortName: entry.team?.shortName,
                crest: entry.team?.crest,
            },
            playedGames: entry.playedGames,
            won: entry.won,
            draw: entry.draw,
            lost: entry.lost,
            goalsFor: entry.goalsFor,
            goalsAgainst: entry.goalsAgainst,
            goalDifference: entry.goalDifference,
            points: entry.points,
        })) || [];

        res.json({
            competition: {
                name: data.competition?.name,
                code: data.competition?.code,
                emblem: data.competition?.emblem,
            },
            season: data.season,
            standings
        });
    } catch (error) {
        res.status(error.status || 500).json({ error: error.message });
    }
});

/**
 * GET /api/fixtures/:competition
 * Returns upcoming fixtures for a competition.
 */
router.get('/fixtures/:competition', async (req, res) => {
    try {
        const competitionCode = normalizeCompetitionCode(req.params.competition);
        if (!competitionCode || !COMPETITIONS[competitionCode]) {
            return res.status(400).json({ error: `Invalid competition code: ${req.params.competition}` });
        }

        const data = await footballAPI(`/competitions/${competitionCode}/matches?status=SCHEDULED`);

        const fixtures = (data.matches || []).slice(0, 20).map(match => ({
            id: match.id,
            homeTeam: {
                name: match.homeTeam?.name,
                shortName: match.homeTeam?.shortName,
                crest: match.homeTeam?.crest,
            },
            awayTeam: {
                name: match.awayTeam?.name,
                shortName: match.awayTeam?.shortName,
                crest: match.awayTeam?.crest,
            },
            utcDate: match.utcDate,
            matchday: match.matchday,
            status: match.status,
        }));

        res.json({ count: fixtures.length, fixtures });
    } catch (error) {
        res.status(error.status || 500).json({ error: error.message });
    }
});

/**
 * GET /api/match/:id
 * Returns basic match info (free preview).
 */
router.get('/match/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidMatchId(id)) {
            return res.status(400).json({ error: 'Invalid match id' });
        }

        const data = await footballAPI(`/matches/${id}`);

        res.json({
            id: data.id,
            competition: {
                name: data.competition?.name,
                code: data.competition?.code,
                emblem: data.competition?.emblem,
            },
            homeTeam: {
                id: data.homeTeam?.id,
                name: data.homeTeam?.name,
                shortName: data.homeTeam?.shortName,
                crest: data.homeTeam?.crest,
            },
            awayTeam: {
                id: data.awayTeam?.id,
                name: data.awayTeam?.name,
                shortName: data.awayTeam?.shortName,
                crest: data.awayTeam?.crest,
            },
            score: data.score,
            status: data.status,
            utcDate: data.utcDate,
            matchday: data.matchday,
            venue: data.venue,
            referees: data.referees,
            // goals is free preview
            goals: data.goals,
        });
    } catch (error) {
        res.status(error.status || 500).json({ error: error.message });
    }
});

/**
 * GET /api/competitions
 * Returns list of available competitions.
 */
router.get('/competitions', async (req, res) => {
    try {
        res.json({
            competitions: Object.entries(COMPETITIONS).map(([code, name]) => ({
                code,
                name,
            }))
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/streams
 * Returns catalog entries for pay-per-watch streams (metadata only).
 */
router.get('/streams', async (req, res) => {
    try {
        const streams = STREAM_CATALOG.map((stream) => ({
            ...formatStreamForCatalog(stream),
            price: PRICES.streamWatch,
            priceFormatted: `${parseInt(PRICES.streamWatch, 10) / 1000000} STX`,
            isDemoSource: true,
        }));

        res.json({
            network: NETWORK,
            count: streams.length,
            streams,
        });
    } catch (error) {
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
});

module.exports = router;
