import { UserContract, useContractAction } from '@/hooks/contract.hooks';
import { useLogActivity } from '@/hooks/logActivity.hooks';
import { useWorkspaceActions } from '@/hooks/workspace.hooks';
import {
  ABI,
  CellABI,
  ContractLanguage,
  NetworkEnvironment,
  Project,
} from '@/interfaces/workspace.interface';
import { buildTs } from '@/utility/typescriptHelper';
import { Cell } from '@ton/core';
import { SandboxContract } from '@ton/sandbox';
import { useTonConnectUI } from '@tonconnect/ui-react';
import { Button, Form } from 'antd';
import { useForm } from 'antd/lib/form/Form';
import { FC, useEffect, useRef, useState } from 'react';
import ABIUi from '../ABIUi';
import CellBuilder, {
  CellValues,
  generateCellCode,
} from '../BuildProject/CellBuilder';
import { globalWorkspace } from '../globalWorkspace';
import s from './ContractInteraction.module.scss';

interface Props {
  contractAddress: string;
  projectId: string;
  abi: ABI | null;
  network: NetworkEnvironment;
  contract: SandboxContract<UserContract> | null;
  language?: ContractLanguage;
}
const ContractInteraction: FC<Props> = ({
  contractAddress,
  projectId,
  abi,
  network,
  contract = null,
  language = 'func',
}) => {
  const [tonConnector] = useTonConnectUI();
  const [isLoading, setIsLoading] = useState('');
  const { sendMessage } = useContractAction();
  const { getFileByPath, updateProjectById } = useWorkspaceActions();
  const { createLog } = useLogActivity();
  const { sandboxWallet: wallet } = globalWorkspace;
  const [messageForm] = useForm();

  const cellBuilderRef = useRef<HTMLIFrameElement>(null);

  const createCell = async (cell: Cell | undefined) => {
    if (!cellBuilderRef.current?.contentWindow) return;
    let cellCode = '';

    const contractCellContent = await getFileByPath(
      'message.cell.ts',
      projectId,
    );
    if (contractCellContent && !contractCellContent.content && !cell) {
      throw new Error('Cell data is missing in file message.cell.ts');
    }
    if (cell) {
      cellCode = generateCellCode(cell as unknown as CellValues[]);
      updateProjectById(
        {
          cellABI: { setter: cell as CellABI },
        } as Project,
        projectId,
      );
    } else {
      cellCode = contractCellContent?.content ?? '';
    }
    try {
      const jsOutout = await buildTs(
        {
          'message.cell.ts': cellCode,
          'cell.ts': 'import cell from "./message.cell.ts"; cell;',
        },
        'cell.ts',
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
        '*',
      );
    } catch (error) {
      setIsLoading('');
      if ((error as Error).message.includes("'default' is not exported by ")) {
        throw new Error("'default' is not exported by message.cell.ts");
      }
      createLog(
        'Something went wrong. Check browser console for details.',
        'error',
      );
      throw error;
    }
  };

  type FormValues = Record<string, Cell> | undefined;

  const onSubmit = async (formValues: FormValues) => {
    try {
      setIsLoading('setter');
      await createCell(formValues?.cell);
    } catch (error) {
      setIsLoading('');
      console.log(error);
      if (typeof error === 'string') {
        createLog(error, 'error');
        return;
      }
      if ((error as Error).message.includes('Wrong AccessKey used for')) {
        createLog('Contract address changed. Relogin required.', 'error');
      }
    } finally {
      setIsLoading('');
    }
  };

  const cellBuilder = (info: string) => {
    if (language !== 'func') return <></>;
    return (
      <CellBuilder
        form={messageForm}
        info={info}
        projectId={projectId}
        type="setter"
      />
    );
  };

  useEffect(() => {
    const handler = async (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      event: MessageEvent<{ name: string; type: string; data: any }>,
    ) => {
      if (
        typeof event.data !== 'object' ||
        event.data.type !== 'abi-data' ||
        event.data.name !== 'nujan-ton-ide'
      ) {
        setIsLoading('');
        return;
      }

      try {
        await send(event.data.data);
        createLog('Message sent successfully', 'success');
      } catch (error) {
        console.log('error', error);
      } finally {
        setIsLoading('');
      }
    };

    window.addEventListener('message', handler as unknown as EventListener);
    return () => {
      window.removeEventListener(
        'message',
        handler as unknown as EventListener,
      );
    };
  }, [isLoading, tonConnector, network, contractAddress, contract]);

  const send = async (data: string) => {
    await sendMessage(data, contractAddress, contract, network, wallet!);
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
        sandbox="allow-scripts  allow-same-origin"
      />
      <p>
        Below options will be used to send internal message
        {language === 'tact' ? '(call receiver)' : ''} and call getter method on
        contract after the contract is deployed.
      </p>
      <br />

      {abi && abi.getters.length > 0 && (
        <>
          <h3 className={s.label}>Getters ({abi.getters.length}):</h3>
          {abi.getters.map((item, i) => (
            <ABIUi
              abi={item}
              key={i}
              contractAddress={contractAddress}
              network={network}
              contract={contract}
              language={language}
              type="Getter"
            />
          ))}
        </>
      )}
      <br />

      <h3 className={s.label}>
        {language === 'tact' ? 'Receivers' : 'Send internal message'}
        {abi?.setters.length && abi.setters.length > 0
          ? `(${abi.setters.length})`
          : ''}
      </h3>
      {language !== 'tact' && (
        <>
          <Form
            className={`${s.form} app-form`}
            form={messageForm}
            onFinish={(values) => {
              onSubmit(values as FormValues).catch(() => {});
            }}
          >
            {cellBuilder('Update cell in ')}
            <Button
              type="default"
              htmlType="submit"
              loading={isLoading === 'setter'}
              className={`${s.sendMessage} bordered-gradient`}
            >
              Send
            </Button>
          </Form>
        </>
      )}
      {abi && abi.setters.length > 0 && (
        <>
          {abi.setters.map((item, i) => (
            <ABIUi
              abi={item}
              key={i}
              contractAddress={contractAddress}
              network={network}
              contract={contract}
              language={language}
              type="Setter"
            />
          ))}
        </>
      )}
    </div>
  );
};

export default ContractInteraction;
