import { Layout } from '@/components/shared';
import { AppConfig } from '@/config/AppConfig';
import '@/styles/theme.scss';
import { THEME } from '@tonconnect/ui';
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { ConfigProvider, theme } from 'antd';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { RecoilRoot } from 'recoil';

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps) {
  const { darkAlgorithm } = theme;

  return (
    <>
      <Head>
        <title>{AppConfig.seo.title}</title>
        <meta name="description" content="" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/png" href="/images/logo.png" />
      </Head>
      <RecoilRoot>
        <ConfigProvider
          theme={{
            token: {
              colorPrimary: '#007fd4',
              fontFamily: 'var(--font-body)',
            },
            algorithm: darkAlgorithm,
          }}
        >
          <TonConnectUIProvider
            uiPreferences={{ theme: THEME.DARK }}
            manifestUrl="https://ton-ide-nujan.vercel.app/assets/ton/tonconnect-manifest.json"
          >
            <Layout>
              <Component {...pageProps} />
            </Layout>
          </TonConnectUIProvider>
        </ConfigProvider>
      </RecoilRoot>
    </>
  );
}
