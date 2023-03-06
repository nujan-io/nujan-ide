import { WorkSpace } from '@/components/workspace';
import { AppConfig } from '@/config/AppConfig';
import Head from 'next/head';

export default function Home() {
  return (
    <>
      <Head>
        <title>{`Project Details | ${AppConfig.seo.title}`}</title>
      </Head>
      <WorkSpace />
    </>
  );
}
