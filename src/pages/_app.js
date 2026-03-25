// pages/_app.js
import React from 'react';
import Head from 'next/head';
import { CacheProvider } from '@emotion/react';
import createEmotionCache from '@/lib/createEmotionCache';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { KinesisModeProvider } from '@/contexts/KinesisModeContext';
import ErrorBoundary from '@/components/ErrorBoundary';

import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import '@fontsource-variable/jetbrains-mono';

// Client-side cache, shared for the whole session of the user in the browser.
const clientSideEmotionCache = createEmotionCache();

export default function MyApp(props) {
    const { Component, emotionCache = clientSideEmotionCache, pageProps } = props;

    return (
        <CacheProvider value={emotionCache}>
            <Head>
                <meta name="viewport" content="initial-scale=1, width=device-width" />
                <title>Kinesis Stream Consumer</title>
            </Head>
            <ThemeProvider>
                <ErrorBoundary>
                    <KinesisModeProvider>
                        <Component {...pageProps} />
                    </KinesisModeProvider>
                </ErrorBoundary>
            </ThemeProvider>
        </CacheProvider>
    );
}
