export { Blockchain, BlockchainTransaction, PendingMessage, SandboxContract, SendMessageResult } from './blockchain/Blockchain';
export { BlockchainContractProvider } from './blockchain/BlockchainContractProvider';
export { BlockchainSender } from './blockchain/BlockchainSender';
export { BlockchainStorage, LocalBlockchainStorage, RemoteBlockchainStorage } from './blockchain/BlockchainStorage';
export { GetMethodParams, GetMethodResult, LogsVerbosity, MessageParams, SmartContract, SmartContractTransaction, Verbosity, createEmptyShardAccount, createShardAccount } from './blockchain/SmartContract';
export { defaultConfig, defaultConfigSeqno } from './config/defaultConfig';
export { Event, EventAccountCreated, EventAccountDestroyed, EventMessageSent } from './event/Event';
export { Treasury, TreasuryContract } from './treasury/Treasury';
export { internal } from './utils/message';
export { prettyLogTransaction, prettyLogTransactions } from './utils/prettyLogTransaction';


export type BlockchainTransaction = Transaction & {
    blockchainLogs: string;
    vmLogs: string;
    debugLogs: string;
    events: Event[];
    parent?: BlockchainTransaction;
    children: BlockchainTransaction[];
};
export type SendMessageResult = {
    transactions: BlockchainTransaction[];
    events: Event[];
};
export type SandboxContract<F> = {
    [P in keyof F]: P extends `get${string}` ? (F[P] extends (x: ContractProvider, ...args: infer P) => infer R ? (...args: P) => R : never) : (P extends `send${string}` ? (F[P] extends (x: ContractProvider, ...args: infer P) => infer R ? (...args: P) => Promise<SendMessageResult & {
        result: R extends Promise<infer PR> ? PR : R;
    }> : never) : F[P]);
};
export type PendingMessage = Message & {
    parentTransaction?: BlockchainTransaction;
};
export type TreasuryParams = Partial<{
    workchain: number;
    predeploy: boolean;
    balance: bigint;
    resetBalanceIfZero: boolean;
}>;
export declare class Blockchain {
    protected storage: BlockchainStorage;
    protected networkConfig: Cell;
    protected currentLt: bigint;
    protected messageQueue: PendingMessage[];
    protected logsVerbosity: LogsVerbosity;
    protected globalLibs?: Cell;
    protected lock: AsyncLock;
    protected contractFetches: Map<string, Promise<SmartContract>>;
    readonly executor: Executor;
    get lt(): bigint;
    protected constructor(opts: {
        executor: Executor;
        config?: Cell;
        storage: BlockchainStorage;
    });
    get config(): Cell;
    sendMessage(message: Message | Cell, params?: MessageParams): Promise<SendMessageResult>;
    runGetMethod(address: Address, method: number | string, stack?: TupleItem[], params?: GetMethodParams): Promise<import("./SmartContract").GetMethodResult>;
    protected pushMessage(message: Message | Cell): Promise<void>;
    protected runQueue(params?: MessageParams): Promise<SendMessageResult>;
    protected processQueue(params?: MessageParams): Promise<BlockchainTransaction[]>;
    provider(address: Address, init?: {
        code: Cell;
        data: Cell;
    }): ContractProvider;
    sender(address: Address): Sender;
    treasury(seed: string, params?: TreasuryParams): Promise<SandboxContract<TreasuryContract>>;
    openContract<T extends Contract>(contract: T): SandboxContract<T>;
    protected startFetchingContract(address: Address): Promise<SmartContract>;
    getContract(address: Address): Promise<SmartContract>;
    get verbosity(): LogsVerbosity;
    set verbosity(value: LogsVerbosity);
    setVerbosityForAddress(address: Address, verbosity: Partial<LogsVerbosity> | Verbosity | undefined): Promise<void>;
    setConfig(config: Cell): void;
    setShardAccount(address: Address, account: ShardAccount): Promise<void>;
    get libs(): Cell | undefined;
    set libs(value: Cell | undefined);
    static create(opts?: {
        config?: Cell;
        storage?: BlockchainStorage;
    }): Promise<Blockchain>;
}

export declare class BlockchainSender implements Sender {
    private readonly blockchain;
    readonly address: Address;
    constructor(blockchain: {
        pushMessage(message: Message): Promise<void>;
    }, address: Address);
    send(args: SenderArguments): Promise<void>;
}




export interface BlockchainStorage {
    getContract(blockchain: Blockchain, address: Address): Promise<SmartContract>;
}
export declare class LocalBlockchainStorage implements BlockchainStorage {
    private contracts;
    getContract(blockchain: Blockchain, address: Address): Promise<SmartContract>;
}
export declare class RemoteBlockchainStorage implements BlockchainStorage {
    private contracts;
    private client;
    constructor(client: TonClient4);
    getContract(blockchain: Blockchain, address: Address): Promise<SmartContract>;
}


export declare class BlockchainContractProvider implements ContractProvider {
    private readonly blockchain;
    private readonly address;
    private readonly init?;
    constructor(blockchain: {
        getContract(address: Address): Promise<SmartContract>;
        pushMessage(message: Message): Promise<void>;
    }, address: Address, init?: {
        code: Cell;
        data: Cell;
    } | undefined);
    private getContract;
    getState(): Promise<ContractState>;
    get(name: string, args: TupleItem[]): Promise<{
        stack: TupleReader;
    }>;
    external(message: Cell): Promise<void>;
    internal(via: Sender, args: {
        value: string | bigint;
        bounce?: boolean | null;
        sendMode?: SendMode;
        body?: string | Cell | null;
    }): Promise<void>;
}
/// <reference types="node" />


export declare function createShardAccount(args: {
    address?: Address;
    code: Cell;
    data: Cell;
    balance: bigint;
    workchain?: number;
}): ShardAccount;
export declare function createEmptyShardAccount(address: Address): ShardAccount;
export type Verbosity = 'none' | 'vm_logs' | 'vm_logs_full';
export type LogsVerbosity = {
    print: boolean;
    blockchainLogs: boolean;
    vmLogs: Verbosity;
    debugLogs: boolean;
};
export type SmartContractTransaction = Transaction & {
    blockchainLogs: string;
    vmLogs: string;
    debugLogs: string;
};
export type MessageParams = Partial<{
    now: number;
    randomSeed: Buffer;
    ignoreChksig: boolean;
}>;
export type GetMethodParams = Partial<{
    now: number;
    randomSeed: Buffer;
    gasLimit: bigint;
}>;
export type GetMethodResult = {
    stack: TupleItem[];
    stackReader: TupleReader;
    exitCode: number;
    gasUsed: bigint;
    blockchainLogs: string;
    vmLogs: string;
    debugLogs: string;
};
export declare class SmartContract {
    #private;
    readonly address: Address;
    readonly blockchain: Blockchain;
    constructor(shardAccount: ShardAccount, blockchain: Blockchain);
    get balance(): bigint;
    set balance(v: bigint);
    get lastTransactionHash(): bigint;
    get lastTransactionLt(): bigint;
    get accountState(): import("ton-core").AccountState | undefined;
    get account(): ShardAccount;
    set account(account: ShardAccount);
    static create(blockchain: Blockchain, args: {
        address: Address;
        code: Cell;
        data: Cell;
        balance: bigint;
    }): SmartContract;
    static empty(blockchain: Blockchain, address: Address): SmartContract;
    receiveMessage(message: Message, params?: MessageParams): {
        blockchainLogs: string;
        vmLogs: string;
        debugLogs: string;
        address: bigint;
        lt: bigint;
        prevTransactionHash: bigint;
        prevTransactionLt: bigint;
        now: number;
        outMessagesCount: number;
        oldStatus: import("ton-core").AccountStatus;
        endStatus: import("ton-core").AccountStatus;
        inMessage: Message | undefined;
        outMessages: import("ton-core").Dictionary<number, Message>;
        totalFees: import("ton-core").CurrencyCollection;
        stateUpdate: import("ton-core").HashUpdate;
        description: import("ton-core").TransactionDescription;
    };
    get(method: string | number, stack?: TupleItem[], params?: GetMethodParams): GetMethodResult;
    get verbosity(): LogsVerbosity;
    set verbosity(value: LogsVerbosity);
    setVerbosity(verbosity: Partial<LogsVerbosity> | Verbosity | undefined): void;
}
export declare class AsyncLock {
    #private;
    acquire(): Promise<void>;
    release(): Promise<void>;
    with<T>(fn: () => Promise<T>): Promise<T>;
}
/// <reference types="node" />

export type GetMethodArgs = {
    code: Cell;
    data: Cell;
    methodId: number;
    stack: TupleItem[];
    config: Cell;
    verbosity: ExecutorVerbosity;
    libs?: Cell;
    address: Address;
    unixTime: number;
    balance: bigint;
    randomSeed: Buffer;
    gasLimit: bigint;
};
export type GetMethodResultSuccess = {
    success: true;
    stack: string;
    gas_used: string;
    vm_exit_code: number;
    vm_log: string;
    c7: string;
    missing_library: string | null;
};
export type GetMethodResultError = {
    success: false;
    error: string;
};
export type GetMethodResult = {
    output: GetMethodResultSuccess | GetMethodResultError;
    logs: string;
    debugLogs: string;
};
export type RunTransactionArgs = {
    config: Cell;
    libs: Cell | null;
    verbosity: ExecutorVerbosity;
    shardAccount: Cell;
    message: Cell;
    now: number;
    lt: bigint;
    randomSeed: Buffer | null;
    ignoreChksig: boolean;
};
export type ExecutorVerbosity = 'short' | 'full' | 'full_location' | 'full_location_stack';
export type EmulationResultSuccess = {
    success: true;
    transaction: string;
    shardAccount: string;
    vmLog: string;
    c7: string | null;
    actions: string | null;
};
export type VMResults = {
    vmLog: string;
    vmExitCode: number;
};
export type EmulationResultError = {
    success: false;
    error: string;
    vmResults?: VMResults;
};
export type EmulationResult = {
    result: EmulationResultSuccess | EmulationResultError;
    logs: string;
    debugLogs: string;
};
export declare class Executor {
    private module;
    private heap;
    private emulator?;
    private debugLogs;
    private constructor();
    static create(): Promise<Executor>;
    runGetMethod(args: GetMethodArgs): GetMethodResult;
    runTransaction(args: RunTransactionArgs): EmulationResult;
    private createEmulator;
    private getEmulatorPointer;
    invoke(method: string, args: (number | string)[]): number;
    private extractString;
}

export declare function prettyLogTransaction(tx: Transaction): string;
export declare function prettyLogTransactions(txs: Transaction[]): void;
export declare const defaultConfigSeqno = 25235362;

export declare function getSelectorForMethod(methodName: string): number;
export declare function testKey(seed: string): import("ton-crypto").KeyPair;
export declare function base64Decode(sBase64: string): Uint8Array;

export type EventAccountCreated = {
    type: 'account_created';
    account: Address;
};
export type EventAccountDestroyed = {
    type: 'account_destroyed';
    account: Address;
};
export type EventMessageSent = {
    type: 'message_sent';
    from: Address;
    to: Address;
    value: bigint;
    body: Cell;
    bounced: boolean;
};
export type Event = EventAccountCreated | EventAccountDestroyed | EventMessageSent;
export declare function extractEvents(tx: Transaction): Event[];

export declare function internal(params: {
    from: Address;
    to: Address;
    value: bigint;
    body?: Cell;
    stateInit?: StateInit;
    bounce?: boolean;
    bounced?: boolean;
    ihrDisabled?: boolean;
    ihrFee?: bigint;
    forwardFee?: bigint;
    createdAt?: number;
    createdLt?: bigint;
}): Message;
/// <reference types="node" />
export declare function crc16(data: string | Buffer): number;


export type Treasury = Sender & {
    address: Address;
};
export declare class TreasuryContract implements Contract {
    static readonly code: Cell;
    static create(workchain: number, keypair: KeyPair): TreasuryContract;
    readonly address: Address;
    readonly init: {
        code: Cell;
        data: Cell;
    };
    readonly keypair: KeyPair;
    private seqno;
    constructor(workchain: number, keypair: KeyPair);
    sendMessages(provider: ContractProvider, messages: MessageRelaxed[], sendMode?: SendMode): Promise<void>;
    send(provider: ContractProvider, args: SenderArguments): Promise<void>;
    getSender(provider: ContractProvider): Treasury;
    /**
     * Create signed transfer
     */
    createTransfer(args: {
        seqno: number;
        messages: MessageRelaxed[];
        sendMode?: SendMode;
    }): Cell;
}
