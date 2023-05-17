import { FC } from 'react';
import s from './Layout.module.scss';

interface Props {
  className?: string;
  children: React.ReactNode;
}
export const Layout: FC<Props> = ({ className, children }) => {
  return <main className={s.root}>{children}</main>;
};

export default Layout;
