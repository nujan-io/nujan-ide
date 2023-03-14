import { UserOnboarding } from '@/components/shared';
import { GetServerSidePropsContext, InferGetServerSidePropsType } from 'next';
import { getServerSession } from 'next-auth/next';
import { getProviders } from 'next-auth/react';
import { authOptions } from './api/auth/[...nextauth]';

export default function Home({
  providers,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return (
    <>
      <UserOnboarding authProviders={providers} />
    </>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);

  // If the user is already logged in, redirect.
  // Note: Make sure not to redirect to the same page
  // To avoid an infinite loop!
  if (session) {
    return { redirect: { destination: '/project' } };
  }

  const providers = await getProviders();

  return {
    props: { providers: providers ?? [] },
  };
}
