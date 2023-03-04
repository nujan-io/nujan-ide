import { Dashboard } from '@/components/dashboard';
import { AppConfig } from '@/config/AppConfig';
import Head from 'next/head';

export default function Home() {
  return (
    <>
      <Head>
        <title>{`Project | ${AppConfig.seo.title}`}</title>
      </Head>
      <Dashboard />
    </>
  );
}
