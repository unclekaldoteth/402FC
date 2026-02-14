'use client';

const TRUSTED_EMBED_HOSTS = new Set([
    'www.youtube.com',
    'youtube.com',
    'player.vimeo.com',
    'scorebat.com',
    'www.scorebat.com',
]);

function getTrustedEmbedUrl(embedHtml) {
    if (typeof embedHtml !== 'string' || embedHtml.length === 0) {
        return null;
    }

    const srcMatch = embedHtml.match(/src=["']([^"']+)["']/i);
    if (!srcMatch?.[1]) {
        return null;
    }

    const rawUrl = srcMatch[1];
    if (
        !rawUrl.startsWith('https://') &&
        !rawUrl.startsWith('http://') &&
        !rawUrl.startsWith('//')
    ) {
        return null;
    }

    try {
        const url = new URL(rawUrl, 'https://www.scorebat.com');
        if (!['https:', 'http:'].includes(url.protocol)) {
            return null;
        }

        if (!TRUSTED_EMBED_HOSTS.has(url.hostname)) {
            return null;
        }
        return url.toString();
    } catch (error) {
        return null;
    }
}

export default function HighlightPlayer({ highlights }) {
    if (!highlights || highlights.length === 0) {
        return (
            <div className="empty-state" style={{ padding: '20px' }}>
                <p style={{ fontSize: '13px' }}>No highlights available yet.</p>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {highlights.map((highlight, index) => {
                const trustedEmbedUrl = getTrustedEmbedUrl(highlight.embed);

                return (
                    <div key={highlight.url || highlight.title || index}>
                        {trustedEmbedUrl ? (
                            <div className="highlight-video">
                                <iframe
                                    src={trustedEmbedUrl}
                                    title={highlight.title || `Highlight ${index + 1}`}
                                    loading="lazy"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                    allowFullScreen
                                    referrerPolicy="strict-origin-when-cross-origin"
                                />
                            </div>
                        ) : highlight.url ? (
                            <a
                                href={highlight.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-secondary"
                                style={{ width: '100%', justifyContent: 'center' }}
                            >
                                ▶ Watch: {highlight.title}
                            </a>
                        ) : null}
                        {highlight.title && (
                            <p style={{
                                fontSize: '13px',
                                color: 'var(--text-secondary)',
                                marginTop: '8px',
                                lineHeight: '1.4'
                            }}>
                                {highlight.title}
                            </p>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
