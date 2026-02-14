/**
 * Demo stream catalog for pay-per-watch scaffolding.
 * Replace URLs with real provider-backed live/HLS feeds in production.
 */

const STREAM_CATALOG = [
    {
        id: 'premier-league-live-1',
        title: 'Premier League Live Hub',
        competition: 'Premier League',
        homeTeam: 'North London FC',
        awayTeam: 'Merseyside United',
        status: 'LIVE',
        startsAtUtc: '2026-02-13T18:00:00Z',
        tagline: 'Live tactical cam with stadium audio',
        // Prefer commondatastorage host; storage.googleapis.com paths can be access-restricted.
        streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
        fallbackEmbedUrl: 'https://www.youtube.com/embed/aqz-KE-bpKQ',
        sourceUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
        mimeType: 'video/mp4',
    },
    {
        id: 'laliga-live-2',
        title: 'La Liga Matchroom',
        competition: 'La Liga',
        homeTeam: 'Madrid City',
        awayTeam: 'Catalonia Athletic',
        status: 'UPCOMING',
        startsAtUtc: '2026-02-13T20:30:00Z',
        tagline: 'Kickoff build-up + full match stream',
        streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        fallbackEmbedUrl: 'https://www.youtube.com/embed/ScMzIvxBSi4',
        sourceUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        mimeType: 'video/mp4',
    },
    {
        id: 'ucl-night-feed',
        title: 'Champions Night Feed',
        competition: 'UEFA Champions League',
        homeTeam: 'Royal Blue',
        awayTeam: 'Bavarian XI',
        status: 'REPLAY',
        startsAtUtc: '2026-02-12T19:45:00Z',
        tagline: 'Full replay with commentary',
        streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        fallbackEmbedUrl: 'https://www.youtube.com/embed/aqz-KE-bpKQ',
        sourceUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        mimeType: 'video/mp4',
    },
];

function formatStreamForCatalog(stream) {
    return {
        id: stream.id,
        title: stream.title,
        competition: stream.competition,
        homeTeam: stream.homeTeam,
        awayTeam: stream.awayTeam,
        status: stream.status,
        startsAtUtc: stream.startsAtUtc,
        tagline: stream.tagline,
    };
}

function getStreamById(streamId) {
    if (typeof streamId !== 'string') return null;
    const normalized = streamId.trim().toLowerCase();
    return STREAM_CATALOG.find((stream) => stream.id.toLowerCase() === normalized) || null;
}

module.exports = {
    STREAM_CATALOG,
    formatStreamForCatalog,
    getStreamById,
};
