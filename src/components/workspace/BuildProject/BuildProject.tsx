import TonAuth from '@/components/auth/TonAuth/TonAuth';
import { useContractAction } from '@/hooks/contract.hooks';
import { useLogActivity } from '@/hooks/logActivity.hooks';
import { useWorkspaceActions } from '@/hooks/workspace.hooks';
import { NetworkEnvironment } from '@/interfaces/workspace.interface';
import { Analytics } from '@/utility/analytics';
import { buildTs } from '@/utility/typescriptHelper';
import { getContractLINK } from '@/utility/utils';
import { Network } from '@orbs-network/ton-access';
import { Blockchain } from '@ton-community/sandbox';
import { CHAIN, useTonConnectUI } from '@tonconnect/ui-react';
import { Button, Form, Input, Select } from 'antd';
import Link from 'next/link';
import { FC, useEffect, useRef, useState } from 'react';
import { Cell } from 'ton-core';
import ContractInteraction from '../ContractInteraction';
import ExecuteFile from '../ExecuteFile/ExecuteFile';
import OpenFile from '../OpenFile/OpenFile';
import s from './BuildProject.module.scss';

import { globalWorkspace } from '../globalWorkspace';

interface Props {
  projectId: string;
  onCodeCompile: (codeBOC: string) => void;
  contract: any;
  updateContract: (contractInstance: any) => void;
}
const BuildProject: FC<Props> = ({
  projectId,
  onCodeCompile,
  contract,
  updateContract,
}) => {
  const [isLoading, setIsLoading] = useState('');
  const { createLog } = useLogActivity();
  const [environment, setEnvironment] = useState<NetworkEnvironment>('SANDBOX');
  const [buildOutput, setBuildoutput] = useState<{
    contractBOC: string | null;
    dataCell: Cell | null;
  } | null>(null);
  const cellBuilderRef = useRef<HTMLIFrameElement>(null);
  const [tonConnector] = useTonConnectUI();
  const chain = tonConnector.wallet?.account.chain;

  const { sandboxBlockchain } = globalWorkspace;

  const { Option } = Select;

  const {
    projectFiles,
    getFileByPath,
    updateProjectById,
    project,
    activeFile,
  } = useWorkspaceActions();

  const currentActiveFile = activeFile(projectId as string);

  const { deployContract } = useContractAction();

  const activeProject = project(projectId);

  const deployView = () => {
    if (!activeProject?.contractBOC) {
      return;
    }

    if (activeProject?.language != 'tact' && environment === 'SANDBOX') {
      return;
    }

    return (
      <>
        <Form className={s.form} onFinish={initDeploy}>
          {activeProject?.initParams && (
            <div>
              {activeProject?.initParams?.map((item, index) => (
                <Form.Item
                  className={s.formItem}
                  key={index}
                  name={item.name}
                  rules={[{ required: !item.optional }]}
                >
                  <Input
                    placeholder={`${item.name}: ${item.type}${
                      item.optional ? '?' : ''
                    }`}
                  />
                </Form.Item>
              ))}
            </div>
          )}
          <Button
            type="primary"
            htmlType="submit"
            // loading={isLoading == 'deploy'}
            disabled={!activeProject?.contractBOC}
            className="w-100"
          >
            Deploy
          </Button>
        </Form>
      </>
    );
  };

  const initDeploy = async (formValues = {}) => {
    const _temp: any = { ...formValues };
    let initParams = '';
    if (_temp.queryId) {
      delete _temp.queryId;
    }

    for (const [key, value] of Object.entries(_temp)) {
      if (value) {
        initParams += `BigInt(${value}),`;
      }
    }
    initParams = initParams.slice(0, -1);

    try {
      if (!tonConnector.connected && environment !== 'SANDBOX') {
        throw 'Please connect wallet';
      }
      if (chain && environment !== 'SANDBOX' && CHAIN[environment] !== chain) {
        throw `Please connect wallet to ${environment}`;
      }
      setIsLoading('deploy');
      await createStateInitCell(initParams);
    } catch (error: any) {
      setIsLoading('');
      console.log(error, 'error');
      if (typeof error === 'string') {
        createLog(error, 'error');
        return;
      }
    } finally {
    }
  };

  const deploy = async () => {
    createLog(
      `Deploying contract with code BOC -  ${activeProject?.contractBOC}`,
      'info'
    );
    try {
      if (sandboxBlockchain && environment === 'SANDBOX') {
        const blockchain = await Blockchain.create();
        globalWorkspace.sandboxBlockchain = blockchain;

        const wallet = await blockchain.treasury('user');
        globalWorkspace.sandboxWallet = wallet;
        createLog(
          `Sandbox account created. Address: <i>${wallet.address.toString()}</i>`,
          'info',
          false
        );
      }
      const { address: _contractAddress, contract } = await deployContract(
        activeProject?.contractBOC as string,
        buildOutput?.dataCell as any,
        environment.toLowerCase() as Network,
        activeProject!!
      );

      Analytics.track('Deploy project', {
        platform: 'IDE',
        type: 'TON-func',
        environment: environment.toLowerCase(),
      });
      createLog(
        `Contract deployed on <b><i>${environment}</i></b> <br /> Contract address: ${_contractAddress}  ${getContractLINK(
          _contractAddress,
          environment
        )}`,
        'success'
      );
      if (!_contractAddress) {
        return;
      }
      if (contract) {
        updateContract(contract);
      }

      updateProjectById(
        {
          contractAddress: _contractAddress,
        },
        projectId
      );
    } catch (error: any) {
      console.log(error, 'error');
      const errroMessage = error?.message?.split('\n');
      for (let i = 0; i < errroMessage.length; i++) {
        createLog(errroMessage[i], 'error', true, true);
      }
    } finally {
      setIsLoading('');
    }
  };

  const createStateInitCell = async (initParams = '') => {
    if (!cellBuilderRef.current?.contentWindow) return;

    try {
      let jsOutout = [{ code: '' }];

      if (activeProject?.language == 'tact') {
        const contractScript = activeProject?.contractScript?.toString();
        if (!contractScript || typeof contractScript !== 'string') {
          throw 'Build project built first';
        }
        jsOutout = await buildTs(
          {
            'tact.ts': activeProject?.contractScript?.toString(),
          },
          'tact.ts'
        );
      } else {
        const stateInitContent = await getFileByPath(
          'stateInit.cell.ts',
          projectId
        );
        if (stateInitContent && !stateInitContent.content) {
          throw 'State init data is missing in file stateInit.cell.ts';
        }

        jsOutout = await buildTs(
          {
            'stateInit.cell.ts': stateInitContent?.content,
            'cell.ts': 'import cell from "./stateInit.cell.ts"; cell;',
          },
          'cell.ts'
        );
      }

      const finalJsoutput = jsOutout[0].code
        .replace(/^import\s+{/, 'const {')
        .replace(/}\s+from\s.+/, '} = window.TonCore;')
        .replace(/^\s*export\s+\{[^}]*\};\s*/m, '');

      let contractName = activeProject?.contractName;

      if (activeProject?.language == 'tact') {
        const _code = `async function main() {
          ${finalJsoutput}
          const contractInit  = await ${contractName}.fromInit(${initParams});
          return contractInit;
        } main()`;
        const contractInit = await eval(_code);
        (window as any).contractInit = contractInit;
        deploy();
        return;
      }

      cellBuilderRef.current.contentWindow.postMessage(
        {
          name: 'nujan-ton-ide',
          type: 'state-init-data',
          code: finalJsoutput,
          language: activeProject?.language,
          contractName: activeProject?.contractName,
          initParams,
        },
        '*'
      );
    } catch (error: any) {
      setIsLoading('');
      if (error?.message?.includes("'default' is not exported by ")) {
        throw "'default' is not exported by stateInit.cell.ts";
      }
      if (error?.message) {
        createLog(error?.message, 'error');
        return;
      }
      throw error;
    }
  };

  const isContractInteraction = () => {
    let isValid =
      activeProject?.id && tonConnector && activeProject?.contractAddress
        ? true
        : false;

    if (environment === 'SANDBOX') {
      isValid = isValid && globalWorkspace.sandboxBlockchain ? true : false;
    }
    return isValid;
  };

  useEffect(() => {
    const handler = (
      event: MessageEvent<{
        name: string;
        type: string;
        data: any;
        error: string;
      }>
    ) => {
      if (
        !event.data ||
        typeof event.data !== 'object' ||
        event.data?.type !== 'state-init-data' ||
        event.data?.name !== 'nujan-ton-ide'
      ) {
        return;
      }
      if (event.data?.error) {
        setIsLoading('');
        createLog(event.data.error, 'error');
        return;
      }
      setBuildoutput((t: any) => {
        return {
          ...t,
          dataCell: event.data.data || '//',
        };
      });
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  useEffect(() => {
    if (!buildOutput?.dataCell || !isLoading) {
      return;
    }
    deploy();
  }, [buildOutput?.dataCell]);

  return (
    <div className={`${s.root} onboarding-build-deploy`}>
      <h3 className={s.heading}>Build & Deploy</h3>
      <iframe
        className={`${s.cellBuilderRef} cell-builder-ref`}
        ref={cellBuilderRef}
        src="/html/tonweb.html"
        sandbox="allow-scripts  allow-same-origin"
      />
      <Form.Item label="Environment" className={s.formItem}>
        <Select
          defaultValue="SANDBOX"
          onChange={(value) => setEnvironment(value as NetworkEnvironment)}
          options={[
            { value: 'SANDBOX', label: 'Sandbox' },
            { value: 'TESTNET', label: 'Testnet' },
            { value: 'MAINNET', label: 'Mainnet' },
          ]}
        />
      </Form.Item>

      {environment !== 'SANDBOX' && <TonAuth />}

      {activeProject?.language !== 'tact' && (
        <p className={s.info}>
          - Update initial contract state in{' '}
          <OpenFile
            projectId={projectId}
            name="stateInit.cell.ts"
            path="stateInit.cell.ts"
          />{' '}
        </p>
      )}

      <div className={s.actionWrapper}>
        <ExecuteFile
          file={currentActiveFile}
          projectId={projectId as string}
          label={
            environment === 'SANDBOX' && activeProject?.language !== 'tact'
              ? 'Build and Deploy'
              : 'Build'
          }
          description="- Select a contract file to build and deploy"
          allowedFile={['fc', 'tact']}
          onCompile={() => {
            if (
              environment == 'SANDBOX' &&
              activeProject?.language !== 'tact'
            ) {
              initDeploy();
            }
          }}
        />
        {deployView()}
      </div>

      {activeProject?.contractAddress!! && environment !== 'SANDBOX' && (
        <div className={`${s.contractAddress} wrap`}>
          <Link
            href={`https://${
              chain === CHAIN.TESTNET ? 'testnet.' : ''
            }tonscan.org/address/${activeProject?.contractAddress}`}
            target="_blank"
          >
            View Deployed Contract
          </Link>
        </div>
      )}

      {isContractInteraction() && (
        <div className={s.contractInteraction}>
          <ContractInteraction
            contractAddress={activeProject?.contractAddress!!}
            projectId={projectId}
            abi={activeProject?.abi || null}
            network={environment}
            contract={contract}
            language={activeProject?.language}
          />
        </div>
      )}
    </div>
  );
};

export default BuildProject;
