import { AppConfig } from '@/config/AppConfig';
import '@/styles/theme.scss';
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
          <Component {...pageProps} />
        </ConfigProvider>
      </RecoilRoot>
    </>
  );
}
