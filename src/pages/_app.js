// pages/_app.js
import React from 'react';
import Head from 'next/head';
import {ThemeProvider} from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import {CacheProvider} from '@emotion/react';
import createEmotionCache from '@/lib/createEmotionCache';
import theme from '@/lib/theme';
import {KinesisModeProvider} from "@/contexts/KinesisModeContext";

import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

// Client-side cache, shared for the whole session of the user in the browser.
const clientSideEmotionCache = createEmotionCache();

export default function MyApp(props) {
    const {Component, emotionCache = clientSideEmotionCache, pageProps} = props;

    return (
        <CacheProvider value={emotionCache}>
            <Head>
                <meta name="viewport" content="initial-scale=1, width=device-width"/>
                <title>Kinesis Stream Consumer</title>
            </Head>
            <ThemeProvider theme={theme}>
                {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
                <CssBaseline/>

                {/* KinesisModeProvider wraps the entire app to provide the KinesisModeContext */}
                <KinesisModeProvider>
                    <Component {...pageProps} />
                </KinesisModeProvider>
            </ThemeProvider>
        </CacheProvider>
    );
}
