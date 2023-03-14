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
  console.log('router.basePath', router.route);

  useEffect(() => {
    if (session && router.basePath === '/') {
      Router.push('/projects');
      return;
    }
    Router.push('/');
  }, [session]);
  return <main className={s.root}>{children}</main>;
};

export default Layout;
