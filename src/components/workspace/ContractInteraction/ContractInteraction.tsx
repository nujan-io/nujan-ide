import { UserContract, useContractAction } from '@/hooks/contract.hooks';
import { useWorkspaceActions } from '@/hooks/workspace.hooks';
import { ABI, NetworkEnvironment } from '@/interfaces/workspace.interface';
import { buildTs } from '@/utility/typescriptHelper';
import { SandboxContract, TreasuryContract } from '@ton-community/sandbox';
import { useTonConnectUI } from '@tonconnect/ui-react';
import { Button, Form, message } from 'antd';
import { FC, useEffect, useRef, useState } from 'react';
import ABIUi from '../ABIUi';
import s from './ContractInteraction.module.scss';

interface Props {
  contractAddress: string;
  projectId: string;
  abi: ABI[];
  network: NetworkEnvironment;
  contract: SandboxContract<UserContract> | null;
  wallet: SandboxContract<TreasuryContract>;
}
const ContractInteraction: FC<Props> = ({
  contractAddress,
  projectId,
  abi,
  network,
  contract = null,
  wallet,
}) => {
  const [tonConnector] = useTonConnectUI();
  const [isLoading, setIsLoading] = useState('');
  const { sendMessage } = useContractAction();
  const { getFileByPath } = useWorkspaceActions();

  const cellBuilderRef = useRef<HTMLIFrameElement>(null);

  const createCell = async () => {
    if (!cellBuilderRef.current?.contentWindow) return;
    const contractCellContent = await getFileByPath(
      'contract.cell.ts',
      projectId
    );
    if (contractCellContent && !contractCellContent.content) {
      throw 'Cell data is missing in file contract.cell.ts';
    }
    if (!contractCellContent?.content?.includes('cell')) {
      throw 'cell variable is missing in file contract.cell.ts';
    }
    const jsOutout = await buildTs(
      { 'contract.cell.ts': contractCellContent?.content },
      'contract.cell.ts'
    );

    const finalJsoutput = jsOutout[0].code
      .replace(/^import\s+{/, 'const {')
      .replace(/}\s+from\s.+/, '} = window.TonCore;');

    cellBuilderRef.current.contentWindow.postMessage(
      {
        name: 'nujan-ton-ide',
        type: 'abi-data',
        code: finalJsoutput,
      },
      '*'
    );
  };

  const onSubmit = async (formValues: any) => {
    if (!tonConnector) {
      message.warning('Wallet not connected');
      return;
    }

    try {
      setIsLoading('setter');
      await createCell();
    } catch (error: any) {
      setIsLoading('');
      if (typeof error === 'string') {
        message.error(error);
        return;
      }
      if (error.message.includes('Wrong AccessKey used for')) {
        message.error('Contract address changed. Relogin required.');
      }
    } finally {
    }
  };

  useEffect(() => {
    const handler = async (
      event: MessageEvent<{ name: string; type: string; data: any }>
    ) => {
      if (
        !event.data ||
        typeof event.data !== 'object' ||
        event.data?.type !== 'abi-data' ||
        event.data?.name !== 'nujan-ton-ide'
      ) {
        setIsLoading('');
        return;
      }

      try {
        if (!tonConnector && network !== 'SANDBOX') {
          message.warning('Wallet not connected');
          return;
        }

        await send(event.data.data);
      } catch (error) {
        console.log('error', error);
      } finally {
        setIsLoading('');
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [isLoading, tonConnector, network, contractAddress, contract]);

  const send = async (data: string) => {
    console.log('contract inside 2', contract);
    sendMessage(data, contractAddress, contract, network, wallet);
  };

  if (!contractAddress) {
    return <></>;
  }

  return (
    <div className={s.root}>
      <iframe
        className={s.cellBuilderRef}
        ref={cellBuilderRef}
        src="/html/tonweb.html"
        sandbox="allow-scripts"
      />
      <p>
        <br />
        <b>
          This will be used to send internal message and call getter method on
          contract
        </b>
      </p>
      <br />

      {abi && abi.length > 0 && (
        <>
          <h3 className={s.label}>Getter:</h3>
          {abi.map((item, i) => (
            <ABIUi
              abi={item}
              key={i}
              contractAddress={contractAddress}
              network={network}
              contract={contract}
            />
          ))}
        </>
      )}
      <br />
      <h3 className={s.label}>Setter:</h3>
      <p>Update values in contract.cell.ts and send message</p>
      <Form className={s.form} onFinish={onSubmit}>
        <Button
          type="default"
          htmlType="submit"
          loading={isLoading === 'setter'}
        >
          Send Internal Message
        </Button>
      </Form>
    </div>
  );
};

export default ContractInteraction;
