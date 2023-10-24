import { globalWorkspace } from '@/components/workspace/globalWorkspace';
import {
  ContractLanguage,
  NetworkEnvironment,
  ParameterType,
  Project,
} from '@/interfaces/workspace.interface';
import { capitalizeFirstLetter } from '@/utility/utils';
import { Network, getHttpEndpoint } from '@orbs-network/ton-access';
import { SandboxContract, TreasuryContract } from '@ton-community/sandbox';
import { SendTransactionRequest } from '@tonconnect/sdk';
import { useTonConnectUI } from '@tonconnect/ui-react';
import { message } from 'antd';
import BN from 'bn.js';
import { StateInit, TonClient } from 'ton';
import {
  Address,
  Cell,
  Contract,
  ContractProvider,
  Sender,
  TupleItem,
  beginCell,
  contractAddress,
  storeStateInit,
  toNano,
} from 'ton-core';

export function useContractAction() {
  const [tonConnector] = useTonConnectUI();

  return {
    deployContract,
    sendMessage,
    callSetter,
    callGetter,
  };
  async function deployContract(
    codeBOC: string,
    dataCell: string,
    network: Network | Partial<NetworkEnvironment>,
    project: Project
  ): Promise<{ address: string; contract?: SandboxContract<UserContract> }> {
    const { sandboxBlockchain, sandboxWallet } = globalWorkspace;
    let codeCell = Cell.fromBoc(Buffer.from(codeBOC, 'base64'))[0];

    // Amount to send to contract. Gas fee
    const value = toNano('0.02');
    let stateInit: StateInit = {};
    if (project.language === 'tact') {
      const _contractInit = (window as any).contractInit;
      stateInit = {
        code: _contractInit.init.code,
        data: _contractInit.init.data,
      };
    } else {
      stateInit = {
        code: codeCell,
        data: Cell.fromBoc(Buffer.from(dataCell, 'base64'))[0],
      };
    }

    if (network.toUpperCase() === 'SANDBOX' && sandboxBlockchain) {
      if (project.language === 'tact') {
        const _contractInit = (window as any).contractInit;
        const _userContract = sandboxBlockchain.openContract(_contractInit);
        // TODO: Handle last parameter i.e. message
        const sender = sandboxWallet!!.getSender();
        const queryId = BigInt(0);
        let messageParams = {};
        if (project?.initParams && project?.initParams?.length > 0) {
          const hasQueryId = project?.initParams?.findIndex(
            (item) => item.name == 'queryId'
          );
          if (hasQueryId > -1) {
            messageParams = {
              $$type: 'Deploy',
              queryId,
            };
          } else {
            messageParams = {
              $$type: 'Deploy',
            };
          }
        }

        const response = await _userContract.send(
          sender,
          {
            value,
          },
          messageParams
        );

        return {
          address: _userContract.address.toString(),
          contract: _userContract,
        };
      } else {
        const _userContract = UserContract.createForDeploy(
          stateInit.code as Cell,
          stateInit.data as Cell
        );
        const userContract = sandboxBlockchain.openContract(_userContract);
        const response = await userContract.sendData(
          sandboxWallet!!.getSender()
        );
        if (network.toUpperCase() !== 'SANDBOX') {
          message.success('Contract Deployed');
        }
        return {
          address: _userContract.address.toString(),
          contract: userContract,
        };
      }
    }

    const _contractAddress = contractAddress(0, stateInit);
    const endpoint = await getHttpEndpoint({
      network: network as Network,
    });

    const client = new TonClient({ endpoint });

    if (await client.isContractDeployed(_contractAddress)) {
      message.error(
        'Contract is already deployed for same codebase and initial state. Update code or initial state.'
      );
      return { address: _contractAddress.toString() };
    }

    let initCell = beginCell().store(storeStateInit(stateInit)).endCell();

    const params: SendTransactionRequest = {
      validUntil: Date.now() + 1000000,
      messages: [
        {
          address: _contractAddress.toString(),
          amount: value.toString(),
          stateInit: initCell.toBoc().toString('base64'),
        },
      ],
    };
    try {
      const deployResponse = await tonConnector.sendTransaction(params);
      message.success('Contract Deployed');

      return { address: _contractAddress.toString() };
    } catch (error) {
      console.log('error', error);
      message.error('Not client');
    } finally {
    }
    return { address: _contractAddress.toString() };
  }

  async function sendMessage(
    dataCell: string,
    contractAddress: string,
    contract: SandboxContract<UserContract> | null = null,
    network: Network | Partial<NetworkEnvironment>,
    wallet: SandboxContract<TreasuryContract>
  ) {
    const _dataCell = Cell.fromBoc(Buffer.from(dataCell as any, 'base64'))[0];
    if (network.toUpperCase() === 'SANDBOX') {
      if (!contract) {
        message.error('Contract is not deployed');
        return;
      }
      const call = await contract.sendData(wallet.getSender(), _dataCell);
      return;
    }
    try {
      const params: SendTransactionRequest = {
        validUntil: Date.now() + 1000000,
        messages: [
          {
            address: contractAddress,
            amount: toNano('0.02').toString(),
            payload: _dataCell.toBoc().toString('base64'),
          },
        ],
      };

      const response = await tonConnector.sendTransaction(params);
    } catch (error) {
      console.log(error, 'error');
    } finally {
      return '';
    }
  }

  async function callSetter(
    contractAddress: string,
    methodName: string,
    contract: SandboxContract<UserContract> | null = null,
    language: ContractLanguage,
    kind?: string,
    stack?: TupleItem[],
    network?: Network | Partial<NetworkEnvironment>
  ) {
    if (network === 'SANDBOX' && contract) {
      const { sandboxWallet } = globalWorkspace;

      const sender = sandboxWallet!!.getSender();

      let messageParams: any = {
        $$type: methodName,
      };
      if (kind === 'text') {
        messageParams = methodName;
      }
      stack?.forEach((item: any) => {
        messageParams = {
          ...messageParams,
          [item.name]: BigInt(item.value),
        };
      });

      if (language === 'tact') {
        const response = await (contract as any).send(
          sender,
          { value: toNano('0.02') },
          messageParams
        );
        return { message: 'Message sent successfully' };
      } else {
      }
      return;
    }
  }

  async function callGetter(
    contractAddress: string,
    methodName: string,
    contract: SandboxContract<UserContract> | null = null,
    language: ContractLanguage,
    kind?: string,
    stack?: TupleItem[],
    network?: Network | Partial<NetworkEnvironment>
  ) {
    const parsedStack = stack?.map((item) => {
      switch (item.type as ParameterType) {
        case 'int':
          return {
            type: item.type,
            value: new BN((item as any).value.toString()),
          };
        case 'address':
          return {
            type: 'slice',
            cell: beginCell()
              .storeAddress(Address.parse((item as any).value))
              .endCell(),
          };
        default:
          return {
            type: item.type,
            value: Cell.fromBoc(
              Buffer.from((item as any).value.toString(), 'base64')
            )[0],
          };
      }
    });
    if (network === 'SANDBOX' && contract) {
      let responseValues = [];
      if (language === 'tact') {
        // convert getter function name as per script function name. Ex. counter will become getCounter
        const response = await (contract as any)[
          'get' + capitalizeFirstLetter(methodName)
        ]();
        responseValues.push({ method: methodName, value: response.toString() });
      } else {
        const call = await contract.getData(methodName, parsedStack as any);
        while (call.stack.remaining) {
          responseValues.push(parseReponse(call.stack.pop()));
        }
      }
      return responseValues;
    }

    const endpoint = await getHttpEndpoint({
      network: network?.toLocaleLowerCase() as Network,
    });
    const client = new TonClient({ endpoint });
    const call = await client.runMethod(
      Address.parse(contractAddress),
      methodName,
      stack
    );

    const responseValues = [];
    while (call.stack.remaining) {
      responseValues.push(parseReponse(call.stack.pop()));
    }
    return responseValues;
  }
}

export class UserContract implements Contract {
  constructor(
    readonly address: Address,
    readonly init?: { code: Cell; data: Cell }
  ) {}

  static createForDeploy(code: Cell, data: Cell) {
    const workchain = 0;
    const address = contractAddress(workchain, { code, data });
    return new UserContract(address, { code, data });
  }

  async sendData(
    provider: ContractProvider,
    via: Sender,
    body: Cell = Cell.EMPTY
  ) {
    await provider.internal(via, {
      value: '0.02',
      bounce: false,
      body,
    });
  }

  async getData(
    provider: ContractProvider,
    methodName: string,
    stackInput: TupleItem[] = []
  ) {
    return provider.get(methodName, stackInput);
  }
}

function parseReponse(tupleItem: TupleItem) {
  if (tupleItem.type === 'null') return;

  if (['cell', 'slice', 'builder'].includes(tupleItem.type)) {
    const cell = (tupleItem as any).cell as Cell;
    try {
      if (cell.bits.length === 267) {
        return {
          type: 'address',
          value: cell.beginParse().loadAddress().toString(),
        };
      }
      return {
        type: 'base64',
        value: cell.toBoc().toString('base64'),
      };
    } catch (e) {
      console.log(e);
      // Ignore
    }
  } else if (tupleItem.type === 'int') {
    return { type: 'int', value: (tupleItem as any).value.toString() };
  } else {
    return { type: 'raw', value: String((tupleItem as any).value) };
  }
}
