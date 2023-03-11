import { useTonConnectUI } from '@tonconnect/ui-react';
import { Button } from 'antd';
import { FC, useEffect, useState } from 'react';
import s from './TonAuth.module.scss';

const TonAuth: FC = () => {
  const [tonConnector] = useTonConnectUI();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!tonConnector) {
      return;
    }

    tonConnector.onStatusChange((wallet) => {
      setIsConnected(!!wallet || tonConnector.connected);
    });
    setIsConnected(tonConnector.connected);

    return () => {};
  }, [tonConnector]);

  return (
    <div className={s.tonConnectRoot}>
      {!isConnected && (
        <Button
          type="primary"
          onClick={() => {
            tonConnector.connectWallet();
          }}
        >
          Connect Wallet
        </Button>
      )}

      {isConnected && (
        <Button
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
