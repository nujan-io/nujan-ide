import { Layout } from '@/components/shared';
import { AppConfig } from '@/config/AppConfig';
import '@/styles/theme.scss';
import { THEME } from '@tonconnect/ui';
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { WebContainer } from '@webcontainer/api';
import { ConfigProvider, theme } from 'antd';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useEffect } from 'react';
import { RecoilRoot } from 'recoil';

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps) {
  const { darkAlgorithm } = theme;

  useEffect(() => {
    (async () => {
      try {
        (window as any).webcontainerInstance = await WebContainer.boot({
          coep: 'credentialless',
        });
        await (window as any).webcontainerInstance.mount({
          'package.json': {
            file: {
              contents: `
                {
                  "name": "nujan-app",
                  "type": "module",
                  "dependencies": {
                    "jest": "29.6.2",
                    "ton-core": "^0.48.0",
                    "@ton-community/test-utils": "0.3.0",
                    "@ton-community/sandbox": "^0.11.0"
                  }
                }`,
            },
          },
        });
        const installProcess = await (window as any).webcontainerInstance.spawn(
          'npm',
          ['install']
        );
        installProcess.output.pipeTo(
          new WritableStream({
            write(data) {
              console.log('data', data);
            },
          })
        );
        // Wait for install command to exit
        return installProcess.exit;
      } catch (error) {
        console.log('error', error);
      }
    })();

    return () => {
      try {
        (window as any).webcontainerInstance?.teardown();
        (window as any).webcontainerInstance = null;
      } catch (error) {}
    };
  }, []);

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
