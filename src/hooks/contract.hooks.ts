import { NetworkEnvironment } from '@/interfaces/workspace.interface';
import { getHttpEndpoint, Network } from '@orbs-network/ton-access';
import {
  Blockchain,
  SandboxContract,
  TreasuryContract,
} from '@ton-community/sandbox';
import { SendTransactionRequest } from '@tonconnect/sdk';
import { useTonConnectUI } from '@tonconnect/ui-react';
import { message } from 'antd';
import { StateInit, TonClient } from 'ton';
import {
  Address,
  beginCell,
  Cell,
  Contract,
  contractAddress,
  ContractProvider,
  Sender,
  storeStateInit,
  toNano,
  TupleItem,
} from 'ton-core';

export function useContractAction() {
  const [tonConnector] = useTonConnectUI();

  return {
    deployContract,
    sendMessage,
    callGetter,
  };
  async function deployContract(
    codeBOC: string,
    dataCell: string,
    network: Network | Partial<NetworkEnvironment>,
    sandboxBlockchain: Blockchain | null = null,
    wallet: SandboxContract<TreasuryContract>
  ): Promise<{ address: string; contract?: SandboxContract<UserContract> }> {
    let codeCell = Cell.fromBoc(Buffer.from(codeBOC, 'base64'))[0];

    // Amount to send to contract. Gas fee
    const value = toNano('0.002');
    const stateInit: StateInit = {
      code: codeCell,
      data: Cell.fromBoc(Buffer.from(dataCell, 'base64'))[0],
    };

    if (network.toUpperCase() == 'SANDBOX' && sandboxBlockchain) {
      const _userContract = UserContract.createForDeploy(
        stateInit.code as Cell,
        stateInit.data as Cell
      );
      const userContract = sandboxBlockchain.openContract(_userContract);
      const response = await userContract.sendData(wallet.getSender());

      message.success('Contract Deployed');
      return {
        address: _userContract.address.toString(),
        contract: userContract,
      };
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
    if (network === 'SANDBOX') {
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

  async function callGetter(
    contractAddress: string,
    methodName: string,
    contract: SandboxContract<UserContract> | null = null,
    stack?: TupleItem[],
    network?: Network | Partial<NetworkEnvironment>
  ) {
    if (network === 'SANDBOX' && contract) {
      const call = await contract.getData(methodName, stack);
      return call.stack.peek();
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

    return call.stack.peek();
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
