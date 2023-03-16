import AppIcon from '@/components/ui/icon';
import { Button } from 'antd';
import { signIn } from 'next-auth/react';
import Image from 'next/image';
import { FC } from 'react';

import s from './UserOnboarding.module.scss';

interface Props {
  authProviders: any;
}

const UserOnboarding: FC<Props> = ({ authProviders }) => {
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
          <p>Sign in to get started</p>
          <div className={s.form}>
            {Object.values(authProviders).map((provider: any) => (
              <div key={provider.name}>
                <Button
                  className={s.btnAction}
                  type="primary"
                  onClick={() => signIn(provider.id)}
                >
                  <AppIcon className={s.icon} name={provider.name} />
                  Sign in with {provider.name}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default UserOnboarding;
