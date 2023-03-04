import AppIcon from '@/components/ui/icon';
import Image from 'next/image';
import Link from 'next/link';
import { FC } from 'react';
import s from './DashboardSidebar.module.scss';

interface Props {
  className?: string;
}

const DashboardSidebar: FC<Props> = ({ className }) => {
  return (
    <div className={`${s.root} ${className}`}>
      <Link href="/projects" className={s.brandLogo} data-aos="fade-in">
        <Image src="/images/logo.svg" width={195} height={40} alt="Nujan" />
      </Link>

      <div className={s.menuItems}>
        <div>
          <Link className={s.item} href="/">
            <AppIcon name="Project" /> <span className={s.label}>Projects</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DashboardSidebar;
