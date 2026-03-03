'use client';

import dynamic from 'next/dynamic';

// Dynamically import FlipBook with SSR disabled
const FlipBook = dynamic(() => import('@/components/FlipBook'), { ssr: false });

export default function EnergDiveInsightsPdfPage() {
    return (
        <>
            <head>
                <title>EnergDive Insights &amp; Market Intelligence</title>
                <meta name="description" content="EnergDive Market Intelligence Report" />
                {/* Ensure viewport is set for mobile responsiveness */}
                <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
            </head>

            <div style={containerStyle}>
                {/* ── Header ── */}
                <header style={headerStyle}>
                    <h1 style={titleStyle}>
                        ENERG<span style={accentStyle}>DIVE</span> <span style={lightTextStyle}>INSIGHTS</span>
                    </h1>
                </header>

                {/* ── Flipbook Area ── */}
                <main style={mainStyle}>
                    <FlipBook />
                </main>
            </div>
        </>
    );
}

/* ── Styles ── */
const containerStyle = {
    height: '100vh', // Fixed height to prevent body scroll
    width: '100vw',
    background: '#f8f9fa', // Slightly off-white for better contrast with page
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden', // Hide scrollbars on body, let flipbook handle it
};

const headerStyle = {
    textAlign: 'center',
    padding: '1rem',
    height: '60px', // Fixed small header to give max room to book
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#fff',
    borderBottom: '1px solid #eaeaea',
    zIndex: 10,
};

const titleStyle = {
    fontSize: '1.2rem',
    fontWeight: 800,
    color: '#1a1a1a',
    margin: 0,
    fontFamily: 'var(--font-sans), sans-serif',
};

const accentStyle = {
    color: '#09B697', // Your teal color
};

const lightTextStyle = {
    fontWeight: 400,
    color: '#666',
};

const mainStyle = {
    flex: 1,
    position: 'relative',
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    padding: '10px',
};