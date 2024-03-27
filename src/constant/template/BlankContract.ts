export const BlankContract = {
  testScript: `import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from '@ton/core';

export type BlankContractConfig = {};

export function blankContractConfigToCell(config: BlankContractConfig): Cell {
    return beginCell().endCell();
}

export class BlankContract implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new BlankContract(address);
    }

    static createFromConfig(config: BlankContractConfig, code: Cell, workchain = 0) {
        const data = blankContractConfigToCell(config);
        const init = { code, data };
        return new BlankContract(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }
}`,
  testCases: `import { Blockchain, SandboxContract } from '@ton/sandbox';
import { Cell, toNano } from '@ton/core';
import { BlankContract } from './BlankContract';

describe('BlankContract', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('main.fc');
    });

    let blockchain: Blockchain;
    let blankContract: SandboxContract<BlankContract>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        blankContract = blockchain.openContract(BlankContract.createFromConfig({}, code));

        const deployer = await blockchain.treasury('deployer');

        const deployResult = await blankContract.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: blankContract.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and blankContract are ready to use
    });
});`,
  tactTestCase: `import { Blockchain, SandboxContract } from '@ton/sandbox';
import { toNano } from '@ton/core';
import { BlankContract } from '../dist/tact_BlankContract';
import '@ton/test-utils';

describe('BlankContract', () => {
let blockchain: Blockchain;
let blankContract: SandboxContract<BlankContract>;

beforeEach(async () => {
    blockchain = await Blockchain.create();

    blankContract = blockchain.openContract(await BlankContract.fromInit());

    const deployer = await blockchain.treasury('deployer');

    const deployResult = await blankContract.send(
        deployer.getSender(),
        {
            value: toNano('0.05'),
        },
        {
            $$type: 'Deploy',
            queryId: 0n,
        }
    );

    expect(deployResult.transactions).toHaveTransaction({
        from: deployer.address,
        to: blankContract.address,
        deploy: true,
        success: true,
    });
});

it('should deploy', async () => {
    // the check is done inside beforeEach
    // blockchain and blankContract are ready to use
});
});
`,
};
