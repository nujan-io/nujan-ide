import { Layout } from '@/components/shared';
import { AppConfig } from '@/config/AppConfig';
import '@/styles/theme.scss';
import { THEME, TonConnectUIProvider } from '@tonconnect/ui-react';
import { ConfigProvider, theme } from 'antd';
import axios from 'axios';
import type { Session } from 'next-auth';
import { SessionProvider } from 'next-auth/react';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { RecoilRoot } from 'recoil';

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps<{ session: Session }>) {
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
          <SessionProvider session={session}>
            {/* On some of the ISP raw.githubusercontent.com was getting blocked which is the domain for manifest and wallet list. So we are keeping local at the moment */}
            <TonConnectUIProvider
              uiPreferences={{ theme: THEME.DARK }}
              // manifestUrl="https://ton-connect.github.io/demo-dapp-with-react-ui/tonconnect-manifest.json"
              manifestUrl="https://ton-ide-dev.vercel.app/assets/ton/tonconnect-manifest.json"
              // walletsListSource="/assets/ton/wallets.json"
              getConnectParameters={async () => {
                // TODO: make payload generation only once. It will run at every popup open for wallet.
                const tonProof = await axios.post('/api/ton-proof', {
                  action: 'generate-payload',
                });
                return {
                  tonProof: tonProof.data.data.payload,
                };
              }}
            >
              <Layout>
                <Component {...pageProps} />
              </Layout>
            </TonConnectUIProvider>
          </SessionProvider>
        </ConfigProvider>
      </RecoilRoot>
    </>
  );
}
