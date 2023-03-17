import { useAuthAction } from '@/hooks/auth.hooks';
import { useProjectServiceActions } from '@/hooks/ProjectService.hooks';
import { useTonConnectUI } from '@tonconnect/ui-react';
import { Button, message } from 'antd';
import Image from 'next/image';
import { FC, useEffect, useState } from 'react';
import s from './TonAuth.module.scss';

const TonAuth: FC = () => {
  const [tonConnector] = useTonConnectUI();
  const [isConnected, setIsConnected] = useState(false);
  const { verifyTonProof } = useProjectServiceActions();
  const { updateAuth } = useAuthAction();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!tonConnector) {
      return;
    }

    tonConnector.onStatusChange(async (wallet) => {
      if (
        wallet?.connectItems?.tonProof &&
        'proof' in wallet?.connectItems?.tonProof
      ) {
        try {
          setIsLoading(true);
          const response = await verifyTonProof({
            account: wallet.account,
            connectItems: wallet?.connectItems,
          });
          const { user, token } = response.data.data;
          updateAuth({ ...user, token });
          setIsConnected(!!wallet || tonConnector.connected);
          localStorage.setItem('ton-ide-user-token', token);
        } catch (error) {
          message.error('Unable to connect');
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsConnected(false);
      }
    });
    setIsConnected(tonConnector.connected);

    return () => {};
  }, [tonConnector]);

  return (
    <div className={s.root}>
      {!isConnected && (
        <Button
          className={s.btnAction}
          type="primary"
          loading={isLoading}
          onClick={() => {
            tonConnector.connectWallet();
          }}
        >
          <Image
            src={`/images/icon/ton-protocol-logo-white.svg`}
            width={30}
            height={30}
            alt={''}
            className={s.icon}
          />
          Connect Wallet
        </Button>
      )}

      {isConnected && (
        <Button
          className={s.btnAction}
          type="primary"
          onClick={() => {
            tonConnector.disconnect();
          }}
        >
          Disconnect Wallet
        </Button>
      )}
    </div>
  );
};

export default TonAuth;
