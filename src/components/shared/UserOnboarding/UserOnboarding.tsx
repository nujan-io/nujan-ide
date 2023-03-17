import TonAuth from '@/components/auth/TonAuth';
import Image from 'next/image';
import { FC } from 'react';

import s from './UserOnboarding.module.scss';

const UserOnboarding: FC = () => {
  return (
    <section className={s.root}>
      <div className={s.columnLeft}>
        <div className={s.content}>
          <h1 className={s.heading}>
            Write Your <br />
            Smart Contract <br />
            <span>Effortlessly</span>
          </h1>
          <p>No Setup | No Configuration | No Downloads</p>
        </div>
      </div>
      <div className={s.columnRight}>
        <div className={s.content}>
          <Image src="/images/logo.svg" width={140} height={30} alt="Nujan" />
          <h3 className={s.heading}>Hey, Hackers</h3>
          <p>Connect your wallet to get started</p>
          <div className={s.form}>
            <TonAuth />
          </div>
        </div>
      </div>
    </section>
  );
};

export default UserOnboarding;
