import TonAuth from '@/components/auth/TonAuth/TonAuth';
import { useContractAction } from '@/hooks/contract.hooks';
import { useLogActivity } from '@/hooks/logActivity.hooks';
import { useWorkspaceActions } from '@/hooks/workspace.hooks';
import {
  ABIField,
  InitParams,
  NetworkEnvironment,
} from '@/interfaces/workspace.interface';
import { Analytics } from '@/utility/analytics';
import { buildTs } from '@/utility/typescriptHelper';
import { delay, getContractLINK, getFileExtension } from '@/utility/utils';
import { Network } from '@orbs-network/ton-access';
import { Cell } from '@ton/core';
import { Blockchain } from '@ton/sandbox';
import { CHAIN, useTonAddress, useTonConnectUI } from '@tonconnect/ui-react';
import { Button, Form, Select } from 'antd';
import Link from 'next/link';
import React, { FC, useEffect, useRef, useState } from 'react';
import ContractInteraction from '../ContractInteraction';
import ExecuteFile from '../ExecuteFile/ExecuteFile';
import s from './BuildProject.module.scss';

import AppIcon from '@/components/ui/icon';
import { useSettingAction } from '@/hooks/setting.hooks';
import { useForm } from 'antd/lib/form/Form';
import packageJson from 'package.json';
import {
  AddressInput,
  AmountInput,
  BoolInput,
  BufferInput,
  CellInput,
  NullInput,
  StringInput,
} from '../abiInputs';
import { globalWorkspace } from '../globalWorkspace';
import CellBuilder, { generateCellCode } from './CellBuilder';

const blankABI = {
  getters: [],
  setters: [],
  initParams: [],
};

const fields = (type: String) => {
  if (
    type.includes('int') ||
    type == 'Int' ||
    type == 'bigint | number' ||
    type == 'number | bigint'
  )
    return AmountInput;
  switch (type) {
    case 'Address':
      return AddressInput;
    case 'Bool':
      return BoolInput;
    case 'Buffer':
      return BufferInput;
    case 'bigint':
    case 'number':
      return AmountInput;
    case 'string':
      return StringInput;
    case 'Cell':
    case 'Builder':
    case 'Slice':
      return CellInput;
    case 'null':
      return NullInput;
    default:
      return StringInput;
  }
};

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
  const [contractABI, setContractABI] = useState<{
    getters: ABIField[];
    setters: ABIField[];
    initParams: InitParams[];
  }>(blankABI);
  const [selectedContract, setSelectedContract] = useState<string | undefined>(
    undefined
  );

  const { isAutoBuildAndDeployEnabled } = useSettingAction();

  const [tonConnector] = useTonConnectUI();
  const chain = tonConnector.wallet?.account.chain;
  const connectedWalletAddress = useTonAddress();

  const { sandboxBlockchain } = globalWorkspace;
  const tactVersion = packageJson.dependencies['@tact-lang/compiler'].replace(
    '^',
    ''
  );

  const { Option } = Select;
  const [deployForm] = useForm();

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

  const contractsToDeploy = () => {
    return projectFiles(projectId)
      .filter((f) => {
        const _fileExtension = getFileExtension(f?.name || '');
        return (
          f.path?.startsWith('dist') &&
          ['abi'].includes(_fileExtension as string)
        );
      })
      .map((f) => {
        return {
          id: f.id,
          name: f.name
            .replace('.abi', '')
            .replace('tact_', '')
            .replace('func_', ''),
          path: f.path,
        };
      });
  };

  const cellBuilder = (info: string) => {
    if (!activeProject?.language || activeProject?.language !== 'func')
      return <></>;
    return (
      <CellBuilder
        form={deployForm}
        info={info}
        projectId={projectId}
        type="deploy"
      />
    );
  };

  const deployView = () => {
    const _contractsToDeploy = contractsToDeploy();

    if (_contractsToDeploy.length === 0) {
      return;
    }

    return (
      <>
        <hr />
        <Form
          className={`${s.form} app-form`}
          form={deployForm}
          onFinish={initDeploy}
          onValuesChange={(changedValues) => {
            if (Object.hasOwn(changedValues, 'contract')) {
              setSelectedContract(changedValues.contract);
            }
          }}
        >
          <Form.Item
            name="contract"
            className={s.formItem}
            rules={[{ required: true, message: 'Please select contract' }]}
          >
            <Select
              placeholder="Select a contract"
              className="w-100"
              allowClear
            >
              {_contractsToDeploy.map((f) => (
                <Select.Option key={f.id} value={f.path} title={f.path}>
                  {f.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          {cellBuilder('Update initial contract state in ')}
          {contractABI?.initParams && (
            <div>
              {contractABI?.initParams?.map((item, index) => {
                if (item.name === 'queryId')
                  return <React.Fragment key={index} />;
                const Field = fields(item.type);
                return (
                  <Field
                    key={index}
                    className={s.formItem}
                    name={item.name}
                    placeholder={`${item.name}: ${item.type}${
                      item.optional ? '?' : ''
                    }`}
                    rules={[{ required: !item.optional }]}
                  />
                );
              })}
            </div>
          )}
          <Button
            type="primary"
            htmlType="submit"
            // loading={isLoading == 'deploy'}
            disabled={selectedContract === undefined}
            className="w-100 item-center-align ant-btn-primary-gradient"
          >
            <AppIcon name="Rocket" /> Deploy
          </Button>
        </Form>
      </>
    );
  };

  const initDeploy = async (formValues: any) => {
    const _temp: any = { ...formValues };

    let initParams = '';
    if (_temp.queryId) {
      delete _temp.queryId;
    }
    if (_temp.cell) {
      delete _temp.cell;
    }
    const initParamsData = contractABI?.initParams;
    let parametrsType: any = {};
    if (initParamsData) {
      parametrsType = initParamsData.reduce(
        (acc: any, curr: any) => ((acc[curr.name] = curr.type), acc),
        {}
      );
    }

    for (const [key, value] of Object.entries(_temp)) {
      const type = parametrsType[key];
      if (key === 'contract') {
        continue;
      }
      if (
        type?.includes('int') ||
        type == 'Int' ||
        type == 'bigint | number' ||
        type == 'number | bigint'
      ) {
        initParams += `BigInt(${value}),`;
        continue;
      }
      // if (value) {
      switch (type) {
        case 'Address':
          initParams += `window.TonCore.Address.parse('${value}'),`;
          continue;
        case 'Bool':
          initParams += `${!!value},`;
          continue;
        default:
          initParams += `${value},`;
      }
      if (parametrsType[key] == 'Address') {
      }
      // }
    }
    initParams = initParams?.slice(0, -1);
    if (formValues.cell) {
      initParams = formValues.cell;
    }

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
    createLog(`Deploying contract ...`, 'info');
    const contractBOCPath = selectedContract?.replace('.abi', '.code.boc');
    const contractBOC = await getFileByPath(contractBOCPath, projectId);
    if (!contractBOC?.content) {
      throw 'Contract BOC is missing. Rebuild the contract.';
    }
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
      const {
        address: _contractAddress,
        contract,
        logs,
      } = await deployContract(
        contractBOC.content,
        buildOutput?.dataCell as any,
        environment.toLowerCase() as Network,
        activeProject!!,
        contractABI.initParams
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

      for (let i = 0; i < (logs || []).length; i++) {
        if (!logs?.[i]) continue;
        createLog(logs[i], 'info', false);
      }

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
    if (!selectedContract) {
      throw 'Please select contract';
    }
    const contractScriptPath = selectedContract?.replace('.abi', '.ts');
    if (!cellBuilderRef.current?.contentWindow) return;
    const contractScript = await getFileByPath(contractScriptPath, projectId);
    if (activeProject?.language === 'tact' && !contractScript?.content) {
      throw 'Contract script is missing. Rebuild the contract.';
    }

    try {
      let jsOutout = [{ code: '' }];

      if (activeProject?.language == 'tact') {
        jsOutout = await buildTs(
          {
            'tact.ts': contractScript?.content,
          },
          'tact.ts'
        );
      } else {
        let stateInitContent = await getFileByPath(
          'stateInit.cell.ts',
          projectId
        );
        let cellCode = '';
        if (stateInitContent && !stateInitContent.content && !initParams) {
          throw 'State init data is missing in file stateInit.cell.ts';
        }
        if (initParams) {
          cellCode = generateCellCode(initParams as any);
          updateProjectById(
            {
              cellABI: { deploy: initParams },
            },
            projectId
          );
        } else {
          cellCode = stateInitContent?.content || '';
        }

        jsOutout = await buildTs(
          {
            'stateInit.cell.ts': cellCode,
            'cell.ts': 'import cell from "./stateInit.cell.ts"; cell;',
          },
          'cell.ts'
        );
      }

      const finalJsoutput = jsOutout[0].code
        .replace(/^import\s+{/, 'const {')
        .replace(/}\s+from\s.+/, '} = window.TonCore;')
        .replace(/^\s*export\s+\{[^}]*\};\s*/m, '');

      const contractName = selectedContract
        .replace('dist/', '')
        .replace('.abi', '')
        .replace('tact_', '')
        .replace('func_', '');

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
      if (error?.message?.includes('object is not defined')) {
        throw 'Rebuild contract first';
      }
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

  const updateABI = async () => {
    if (!selectedContract) {
      setContractABI(blankABI);
      return;
    }
    const contractABIFile = await getFileByPath(selectedContract, projectId);

    if (!contractABIFile?.content) {
      createLog('Contract ABI is missing. Rebuild the contract.', 'error');
      return;
    }
    const contractABI = JSON.parse(contractABIFile?.content || '{}');
    if (activeProject?.language === 'tact') {
      contractABI.getters = contractABI?.getters?.map((item: any) => {
        return {
          name: item.name,
          parameters: item.arguments.map((parameter: any) => {
            return {
              name: parameter.name,
              type: parameter.type,
              format: parameter.format,
              optional: parameter.optional,
            };
          }),
        };
      });
      let setters: any = [];
      contractABI?.receivers?.forEach((item: any) => {
        if (item.message.type === 'Deploy') {
          return;
        }
        if (item.message.kind) {
          if (item.message.kind !== 'typed') {
            setters.push({
              name: item.message.text,
              parameters: [],
              kind: item.message.kind,
            });
            return;
          }
          const singleItem = contractABI.types.find(
            (type: any) => type.name === item.message.type
          );
          const singleField = {
            name: singleItem.name,
            parameters: singleItem.fields.map((parameter: any) => {
              return {
                name: parameter.name,
                type: parameter.type.type,
                format: parameter.type.format,
                optional: parameter.type.optional,
                kind: item.message.kind,
              };
            }),
          };
          setters.push(singleField);
        }
      });

      contractABI.setters = setters;
    }

    setContractABI({
      getters: contractABI.getters || [],
      setters: contractABI.setters || [],
      initParams: contractABI.initParams || [],
    });
  };

  const getConnectedWallet = () => {
    let _connectedWalletAddress =
      environment === 'SANDBOX' &&
      globalWorkspace.sandboxWallet?.address.toString();

    if (environment !== 'SANDBOX' && connectedWalletAddress) {
      _connectedWalletAddress = connectedWalletAddress;
    }
    if (!_connectedWalletAddress) {
      return <></>;
    }

    return (
      <div className={`${s.connectedWallet} wrap-text`}>
        Connected Wallet: <span>{_connectedWalletAddress}</span>
      </div>
    );
  };

  useEffect(() => {
    updateABI();
  }, [selectedContract, contract]);

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
      <Form.Item
        label="Environment"
        className={`${s.formItem} select-search-input-dark`}
      >
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
      {getConnectedWallet()}

      <div className={s.actionWrapper}>
        <ExecuteFile
          file={currentActiveFile}
          projectId={projectId as string}
          icon="Build"
          label={
            environment === 'SANDBOX' && activeProject?.language !== 'tact'
              ? 'Build'
              : 'Build'
          }
          description={`- Select a contract to build <br /> 
            ${
              isAutoBuildAndDeployEnabled()
                ? '- Auto-build and deploy is enabled for Sandbox and can be changed in settings. <br />'
                : ''
            }
            ${
              activeProject?.language === 'tact' &&
              '<br />- Tact version: ' + tactVersion
            }
            `}
          allowedFile={['fc', 'tact']}
          onCompile={async () => {
            if (
              environment == 'SANDBOX' &&
              activeProject?.language === 'tact'
            ) {
              if (!isAutoBuildAndDeployEnabled()) return;
              await delay(100);
              deployForm.submit();
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
            <AppIcon name="Eye" /> View Deployed Contract
          </Link>
        </div>
      )}

      {isContractInteraction() && (
        <div className={s.contractInteraction}>
          <ContractInteraction
            contractAddress={activeProject?.contractAddress!!}
            projectId={projectId}
            abi={contractABI || null}
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
