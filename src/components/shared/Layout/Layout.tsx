import { useSession } from 'next-auth/react';
import Router, { useRouter } from 'next/router';
import { FC, useEffect } from 'react';
import s from './Layout.module.scss';

interface Props {
  className?: string;
  children: React.ReactNode;
}
export const Layout: FC<Props> = ({ className, children }) => {
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    if (!session && router.pathname !== '/project/[id]') {
      Router.push('/');
    }
    if (session && router.pathname === '/') {
      Router.push('/projects');
      return;
    }
  }, [session]);
  return <main className={s.root}>{children}</main>;
};

export default Layout;
