export const CounterContract = {
  testScript: `import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from 'ton-core';

    export type ContractConfig = {
        id: number;
        counter: number;
    };
    
    export function contractConfigToCell(config: ContractConfig): Cell {
        return beginCell().storeUint(config.id, 32).storeUint(config.counter, 32).endCell();
    }
    
    export const Opcodes = {
        increase: 0x7e8764ef,
    };
    
    export class CounterContract implements Contract {
        constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}
    
        static createFromAddress(address: Address) {
            return new CounterContract(address);
        }
    
        static createFromConfig(config: ContractConfig, code: Cell, workchain = 0) {
            const data = contractConfigToCell(config);
            const init = { code, data };
            return new CounterContract(contractAddress(workchain, init), init);
        }
    
        async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
            await provider.internal(via, {
                value,
                sendMode: SendMode.PAY_GAS_SEPARATELY,
                body: beginCell().endCell(),
            });
        }
    
        async sendIncrease(
            provider: ContractProvider,
            via: Sender,
            opts: {
                increaseBy: number;
                value: bigint;
                queryID?: number;
            }
        ) {
            await provider.internal(via, {
                value: opts.value,
                sendMode: SendMode.PAY_GAS_SEPARATELY,
                body: beginCell()
                    .storeUint(Opcodes.increase, 32)
                    .storeUint(opts.queryID ?? 0, 64)
                    .storeUint(opts.increaseBy, 32)
                    .endCell(),
            });
        }
    
        async getCounter(provider: ContractProvider) {
            const result = await provider.get('get_counter', []);
            return result.stack.readNumber();
        }
    
        async getID(provider: ContractProvider) {
            const result = await provider.get('get_id', []);
            return result.stack.readNumber();
        }
    }
    `,
  testCases: `import { Blockchain, SandboxContract } from '@ton-community/sandbox';
    import { Cell, toNano } from 'ton-core';
    import { CounterContract } from './CounterContract';
    
    describe('CounterContract', () => {
        let code: Cell;
    
        beforeAll(async () => {
            code = compile("main.fc");
        });
    
        let blockchain: Blockchain;
        let counterContract: SandboxContract<CounterContract>;
    
        beforeEach(async () => {
            blockchain = await Blockchain.create();
    
            counterContract = blockchain.openContract(
                CounterContract.createFromConfig(
                    {
                        id: 0,
                        counter: 0,
                    },
                    code
                )
            );
    
            const deployer = await blockchain.treasury('deployer');
    
            const deployResult = await counterContract.sendDeploy(deployer.getSender(), toNano('0.05'));
        });
    
        it('should deploy 2', async () => {
            // the check is done inside beforeEach
            // blockchain and counterContract are ready to use
        });
    
        it('should increase counter', async () => {
            const increaseTimes = 3;
            for (let i = 0; i < increaseTimes; i++) {
                console.log("increase" + (i + 1/increaseTimes));
    
                const increaser = await blockchain.treasury('increaser' + i);
    
                const counterBefore = await counterContract.getCounter();
    
                console.log('counter before increasing', counterBefore);
    
                const increaseBy = Math.floor(Math.random() * 100);
    
                console.log('increasing by', increaseBy);
    
                const increaseResult = await counterContract.sendIncrease(increaser.getSender(), {
                    increaseBy,
                    value: toNano('0.05'),
                });
    
                const counterAfter = await counterContract.getCounter();
    
                console.log('counter after increasing', counterAfter);
    
                expect(counterAfter).toBe(counterBefore + increaseBy);
            }
        });
    });
    `,
};
