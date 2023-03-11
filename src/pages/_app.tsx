import { AppConfig } from '@/config/AppConfig';
import '@/styles/theme.scss';
import { THEME, TonConnectUIProvider } from '@tonconnect/ui-react';
import { ConfigProvider, theme } from 'antd';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { RecoilRoot } from 'recoil';

export default function App({ Component, pageProps }: AppProps) {
  const { darkAlgorithm } = theme;

  return (
    <>
      <Head>
        <title>{AppConfig.seo.title}</title>
        <meta name="description" content="" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <RecoilRoot>
        <ConfigProvider
          theme={{
            token: {
              colorPrimary: '#007fd4',
            },
            algorithm: darkAlgorithm,
          }}
        >
          {/* On some of the ISP raw.githubusercontent.com was getting blocked which is the domain for manifest and wallet list. So we are keeping local at the moment */}
          <TonConnectUIProvider
            uiPreferences={{ theme: THEME.DARK }}
            manifestUrl="https://ton-connect.github.io/demo-dapp-with-react-ui/tonconnect-manifest.json"
            // manifestUrl="/assets/ton/tonconnect-manifest.json"
            // walletsListSource="/assets/ton/wallets.json"
          >
            <Component {...pageProps} />
          </TonConnectUIProvider>
        </ConfigProvider>
      </RecoilRoot>
    </>
  );
}
