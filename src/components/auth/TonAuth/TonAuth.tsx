import { useAuthAction } from '@/hooks/auth.hooks';
import { useTonConnectUI } from '@tonconnect/ui-react';
import { Button } from 'antd';
import Image from 'next/image';
import { FC, useEffect, useState } from 'react';
import s from './TonAuth.module.scss';

const TonAuth: FC = () => {
  const [tonConnector] = useTonConnectUI();
  const [isConnected, setIsConnected] = useState(false);
  const { updateAuth } = useAuthAction();

  const handleConnectWallet = () => {
    try {
      if (isConnected) {
        tonConnector.disconnect();
        return;
      }
      tonConnector.connectWallet();
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (!tonConnector) {
      return;
    }

    setIsConnected(tonConnector.connected);

    return () => {};
  }, [tonConnector]);

  useEffect(() => {
    if (!tonConnector) {
      return;
    }
    tonConnector.onStatusChange(async (wallet: any) => {
      setIsConnected(!!wallet || tonConnector.connected);
      updateAuth({ walletAddress: wallet?.account?.address });
    });
  }, []);

  return (
    <div className={s.root}>
      <Button
        className={s.btnAction}
        type="primary"
        onClick={handleConnectWallet}
      >
        <Image
          src={`/images/icon/ton-protocol-logo-white.svg`}
          width={30}
          height={30}
          alt={''}
          className={s.icon}
        />
        {isConnected ? 'Disconnect' : 'Connect'} Wallet
      </Button>
    </div>
  );
};

export default TonAuth;
