export {
  Blockchain,
  BlockchainConfig,
  BlockchainSnapshot,
  BlockchainTransaction,
  ExternalOut,
  ExternalOutInfo,
  PendingMessage,
  SandboxContract,
  SendMessageResult,
  toSandboxContract,
} from './blockchain/Blockchain';
export {
  BlockchainContractProvider,
  SandboxContractProvider,
} from './blockchain/BlockchainContractProvider';
export { BlockchainSender } from './blockchain/BlockchainSender';
export {
  BlockchainStorage,
  LocalBlockchainStorage,
  RemoteBlockchainStorage,
  RemoteBlockchainStorageClient,
  wrapTonClient4ForRemote,
} from './blockchain/BlockchainStorage';
export {
  EmulationError,
  GetMethodError,
  GetMethodParams,
  GetMethodResult,
  LogsVerbosity,
  MessageParams,
  SmartContract,
  SmartContractSnapshot,
  SmartContractTransaction,
  TimeError,
  Verbosity,
  createEmptyShardAccount,
  createShardAccount,
} from './blockchain/SmartContract';
export { defaultConfig, defaultConfigSeqno } from './config/defaultConfig';
export {
  Event,
  EventAccountCreated,
  EventAccountDestroyed,
  EventMessageSent,
} from './event/Event';
export {
  Executor,
  EmulationResult as ExecutorEmulationResult,
  GetMethodArgs as ExecutorGetMethodArgs,
  GetMethodResult as ExecutorGetMethodResult,
  RunTickTockArgs as ExecutorRunTickTockArgs,
  RunTransactionArgs as ExecutorRunTransactionArgs,
  ExecutorVerbosity,
  IExecutor,
  TickOrTock,
} from './executor/Executor';
export { Treasury, TreasuryContract } from './treasury/Treasury';
export { internal } from './utils/message';
export {
  prettyLogTransaction,
  prettyLogTransactions,
} from './utils/prettyLogTransaction';
export { printTransactionFees } from './utils/printTransactionFees';
export {};

export type ExternalOutInfo = {
  type: 'external-out';
  src: Address;
  dest?: ExternalAddress;
  createdAt: number;
  createdLt: bigint;
};
export type ExternalOut = {
  info: ExternalOutInfo;
  init?: StateInit;
  body: Cell;
};
export type BlockchainTransaction = Transaction & {
  blockchainLogs: string;
  vmLogs: string;
  debugLogs: string;
  events: Event[];
  parent?: BlockchainTransaction;
  children: BlockchainTransaction[];
  externals: ExternalOut[];
};
export type SendMessageResult = {
  transactions: BlockchainTransaction[];
  events: Event[];
  externals: ExternalOut[];
};
type ExtendsContractProvider<T> = T extends ContractProvider
  ? true
  : T extends SandboxContractProvider
    ? true
    : false;
export declare const SANDBOX_CONTRACT_SYMBOL: unique symbol;
export type SandboxContract<F> = {
  [P in keyof F]: P extends `get${string}`
    ? F[P] extends (x: infer CP, ...args: infer P) => infer R
      ? ExtendsContractProvider<CP> extends true
        ? (...args: P) => R
        : never
      : never
    : P extends `send${string}`
      ? F[P] extends (x: infer CP, ...args: infer P) => infer R
        ? ExtendsContractProvider<CP> extends true
          ? (...args: P) => Promise<
              SendMessageResult & {
                result: R extends Promise<infer PR> ? PR : R;
              }
            >
          : never
        : never
      : F[P];
};
export declare function toSandboxContract<T>(
  contract: OpenedContract<T>,
): SandboxContract<T>;
export type PendingMessage = (
  | ({
      type: 'message';
    } & Message)
  | {
      type: 'ticktock';
      which: TickOrTock;
      on: Address;
    }
) & {
  parentTransaction?: BlockchainTransaction;
};
export type TreasuryParams = Partial<{
  workchain: number;
  predeploy: boolean;
  balance: bigint;
  resetBalanceIfZero: boolean;
}>;
export type BlockchainConfig = Cell | 'default' | 'slim';
export type BlockchainSnapshot = {
  contracts: SmartContractSnapshot[];
  networkConfig: string;
  lt: bigint;
  time?: number;
  verbosity: LogsVerbosity;
  libs?: Cell;
  nextCreateWalletIndex: number;
};
export declare class Blockchain {
  protected storage: BlockchainStorage;
  protected networkConfig: string;
  protected currentLt: bigint;
  protected currentTime?: number;
  protected messageQueue: PendingMessage[];
  protected logsVerbosity: LogsVerbosity;
  protected globalLibs?: Cell;
  protected lock: AsyncLock;
  protected contractFetches: Map<string, Promise<SmartContract>>;
  protected nextCreateWalletIndex: number;
  readonly executor: Executor;
  snapshot(): BlockchainSnapshot;
  loadFrom(snapshot: BlockchainSnapshot): Promise<void>;
  get now(): number | undefined;
  set now(now: number | undefined);
  get lt(): bigint;
  protected constructor(opts: {
    executor: Executor;
    config?: BlockchainConfig;
    storage: BlockchainStorage;
  });
  get config(): Cell;
  get configBase64(): string;
  sendMessage(
    message: Message | Cell,
    params?: MessageParams,
  ): Promise<SendMessageResult>;
  sendMessageIter(
    message: Message | Cell,
    params?: MessageParams,
  ): Promise<
    AsyncIterator<BlockchainTransaction> & AsyncIterable<BlockchainTransaction>
  >;
  runTickTock(
    on: Address | Address[],
    which: TickOrTock,
    params?: MessageParams,
  ): Promise<SendMessageResult>;
  runGetMethod(
    address: Address,
    method: number | string,
    stack?: TupleItem[],
    params?: GetMethodParams,
  ): Promise<import('./SmartContract').GetMethodResult>;
  protected pushMessage(message: Message | Cell): Promise<void>;
  protected pushTickTock(on: Address, which: TickOrTock): Promise<void>;
  protected runQueue(params?: MessageParams): Promise<SendMessageResult>;
  protected txIter(
    needsLocking: boolean,
    params?: MessageParams,
  ): AsyncIterator<BlockchainTransaction> &
    AsyncIterable<BlockchainTransaction>;
  protected processInternal(
    params?: MessageParams,
  ): Promise<IteratorResult<BlockchainTransaction>>;
  protected processTx(
    needsLocking: boolean,
    params?: MessageParams,
  ): Promise<IteratorResult<BlockchainTransaction>>;
  protected processQueue(
    params?: MessageParams,
  ): Promise<BlockchainTransaction[]>;
  provider(address: Address, init?: StateInit | null): ContractProvider;
  sender(address: Address): Sender;
  protected treasuryParamsToMapKey(workchain: number, seed: string): string;
  treasury(
    seed: string,
    params?: TreasuryParams,
  ): Promise<SandboxContract<TreasuryContract>>;
  createWallets(
    n: number,
    params?: TreasuryParams,
  ): Promise<SandboxContract<TreasuryContract>[]>;
  openContract<T extends Contract>(contract: T): SandboxContract<T>;
  protected startFetchingContract(address: Address): Promise<SmartContract>;
  getContract(address: Address): Promise<SmartContract>;
  get verbosity(): LogsVerbosity;
  set verbosity(value: LogsVerbosity);
  setVerbosityForAddress(
    address: Address,
    verbosity: Partial<LogsVerbosity> | Verbosity | undefined,
  ): Promise<void>;
  setConfig(config: BlockchainConfig): void;
  setShardAccount(address: Address, account: ShardAccount): Promise<void>;
  get libs(): Cell | undefined;
  set libs(value: Cell | undefined);
  static create(opts?: {
    config?: BlockchainConfig;
    storage?: BlockchainStorage;
  }): Promise<Blockchain>;
}
/// <reference types="node" />

export interface BlockchainStorage {
  getContract(blockchain: Blockchain, address: Address): Promise<SmartContract>;
  knownContracts(): SmartContract[];
  clearKnownContracts(): void;
}
export declare class LocalBlockchainStorage implements BlockchainStorage {
  private contracts;
  getContract(blockchain: Blockchain, address: Address): Promise<SmartContract>;
  knownContracts(): SmartContract[];
  clearKnownContracts(): void;
}
export interface RemoteBlockchainStorageClient {
  getLastBlockSeqno(): Promise<number>;
  getAccount(
    seqno: number,
    address: Address,
  ): Promise<{
    state: AccountState;
    balance: bigint;
    lastTransaction?: {
      lt: bigint;
      hash: Buffer;
    };
  }>;
}
export declare function wrapTonClient4ForRemote(client: {
  getLastBlock(): Promise<{
    last: {
      seqno: number;
    };
  }>;
  getAccount(
    seqno: number,
    address: Address,
  ): Promise<{
    account: {
      state:
        | {
            type: 'uninit';
          }
        | {
            type: 'active';
            code: string | null;
            data: string | null;
          }
        | {
            type: 'frozen';
            stateHash: string;
          };
      balance: {
        coins: string;
      };
      last: {
        lt: string;
        hash: string;
      } | null;
    };
  }>;
}): RemoteBlockchainStorageClient;
export declare class RemoteBlockchainStorage implements BlockchainStorage {
  private contracts;
  private client;
  private blockSeqno?;
  constructor(client: RemoteBlockchainStorageClient, blockSeqno?: number);
  private getLastBlockSeqno;
  getContract(blockchain: Blockchain, address: Address): Promise<SmartContract>;
  knownContracts(): SmartContract[];
  clearKnownContracts(): void;
}
/// <reference types="node" />

export type GetMethodArgs = {
  code: Cell;
  data: Cell;
  methodId: number;
  stack: TupleItem[];
  config: string;
  verbosity: ExecutorVerbosity;
  libs?: Cell;
  address: Address;
  unixTime: number;
  balance: bigint;
  randomSeed: Buffer;
  gasLimit: bigint;
  debugEnabled: boolean;
};
export type GetMethodResultSuccess = {
  success: true;
  stack: string;
  gas_used: string;
  vm_exit_code: number;
  vm_log: string;
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
export type RunCommonArgs = {
  config: string;
  libs: Cell | null;
  verbosity: ExecutorVerbosity;
  shardAccount: string;
  now: number;
  lt: bigint;
  randomSeed: Buffer | null;
  ignoreChksig: boolean;
  debugEnabled: boolean;
};
export type RunTransactionArgs = {
  message: Cell;
} & RunCommonArgs;
export type TickOrTock = 'tick' | 'tock';
export type RunTickTockArgs = {
  which: TickOrTock;
} & RunCommonArgs;
export type ExecutorVerbosity =
  | 'short'
  | 'full'
  | 'full_location'
  | 'full_location_gas'
  | 'full_location_stack'
  | 'full_location_stack_verbose';
export type EmulationResultSuccess = {
  success: true;
  transaction: string;
  shardAccount: string;
  vmLog: string;
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
export interface IExecutor {
  runGetMethod(args: GetMethodArgs): Promise<GetMethodResult>;
  runTickTock(args: RunTickTockArgs): Promise<EmulationResult>;
  runTransaction(args: RunTransactionArgs): Promise<EmulationResult>;
}
export declare class Executor implements IExecutor {
  private module;
  private heap;
  private emulator?;
  private debugLogs;
  private constructor();
  static create(): Promise<Executor>;
  runGetMethod(args: GetMethodArgs): Promise<GetMethodResult>;
  private runCommon;
  runTickTock(args: RunTickTockArgs): Promise<EmulationResult>;
  runTransaction(args: RunTransactionArgs): Promise<EmulationResult>;
  private createEmulator;
  private getEmulatorPointer;
  invoke(method: string, args: (number | string)[]): number;
  private extractString;
}

export declare class BlockchainSender implements Sender {
  private readonly blockchain;
  readonly address: Address;
  constructor(
    blockchain: {
      pushMessage(message: Message): Promise<void>;
    },
    address: Address,
  );
  send(args: SenderArguments): Promise<void>;
}
export declare const slimConfigSeqno = 34945086;
export declare const slimConfig =
  'te6cckECdQEABYcAAgPNwC8BAgEgGwICASAWAwIBIBEEAQFYBQEBwAYCASAIBwBDv+6SYlD5XEfFuCmona5jYtGN4iWVOW5abGAZxXh4ab9iwAIBIAoJAEK/jVwCELNdrdqiGfrEWdug/e+x+uTpeg0Hl3Of4FDWlMoCASAOCwIBWA0MAEG+3N3+hWqZxcuAeEGZwHcL6jHyjg1zOPc3hEgN70TNkBQAQb7ZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZnAIBSBAPAEG+9ev/zlOHA3TxFUSRetc6kI1OtRpUBKdHCsPbA17dsxQAA99wAgEgFBIBASATAErZAQMAAAfQAAA+gAAAAAMAAAAIAAAABAAgAAAAIAAAAAIAACcQAQEgFQAkwgEAAAD6AAAA+gAAA+gAAAAXAgFIGRcBASAYAELqAAAAAAAPQkAAAAAAA+gAAAAAAAGGoAAAAAGAAFVVVVUBASAaAELqAAAAAACYloAAAAAAJxAAAAAAAA9CQAAAAAGAAFVVVVUCASAnHAIBICIdAgEgIB4BASAfAFBdwwACAAAACAAAABAAAMMAHoSAAJiWgAExLQDDAAAD6AAAE4gAACcQAQEgIQBQXcMAAgAAAAgAAAAQAADDAB6EgAAehIACNJNAwwAAA+gAABOIAAAnEAIBICUjAQEgJACU0QAAAAAAAABkAAAAAAABhqDeAAAAAAPoAAAAAAAAAA9CQAAAAAAAD0JAAAAAAAAAJxAAAAAAAJiWgAAAAAAF9eEAAAAAADuaygABASAmAJTRAAAAAAAAAGQAAAAAAA9CQN4AAAAAJxAAAAAAAAAAD0JAAAAAAAIWDsAAAAAAAAAnEAAAAAACNJNAAAAAAAX14QAAAAAAO5rKAAIBICooAQFIKQBN0GYAAAAAAAAAAAAAAACAAAAAAAAA+gAAAAAAAAH0AAAAAAAD0JBAAgEgLSsBASAsADdwEQ2TFuwAByOG8m/BAACAEKdBpGJ4AAAAMAAIAQEgLgAMAZAAZABLAgEgYTACASA6MQIBIDcyAgEgNTMBASA0ACAAAQAAAACAAAAAIAAAAIAAAQEgNgAUa0ZVPxAEO5rKAAEBSDgBAcA5ALfQUy7nTs8AAAJwACrYn7aHDoYaZOELB7fIx0lsFfzu58bxcmSlH++c6KojdwX2/yWZOw/Zr08OxAx1OQZWjQc9ppdrOeJEc5dIgaEAAAAAD/////gAAAAAAAAABAIBIEo7AgEgQDwBASA9AgKRPz4AKjYEBwMFAExLQAExLQAAAAACAAAD6AAqNgIGAgUAD0JAAJiWgAAAAAEAAAH0AQEgQQIBIEVCAgm3///wYERDAAHcAAH8AgLZSEYCAWJHUQIBIFtbAgEgVkkCAc5eXgIBIF9LAQEgTAIDzUBOTQADqKACASBWTwIBIFNQAgEgUlEAAdQCAUheXgIBIFVUAgEgWVkCASBZWwIBIF1XAgEgWlgCASBbWQIBIF5eAgEgXFsAAUgAAVgCAdReXgABIAEBIGAAGsQAAAAEAAAAAAAAAC4CASBtYgIBIGhjAQFYZAEBwGUCASBnZgAVv////7y9GpSiABAAFb4AAAO8s2cNwVVQAgEga2kBASBqAFMB//////////////////////////////////////////+AAAAAgAAAAUABASBsAEDlZ1T4NCb2mwkme9h2rJfESCE0W34ma9lWp7+/uY3zXAIBIHBuAQFIbwBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACASBzcQEBIHIAQDMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzAQEgdABAVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX9poTo';
/// <reference types="node" />

export declare function createShardAccount(args: {
  address?: Address;
  code: Cell;
  data: Cell;
  balance: bigint;
  workchain?: number;
}): ShardAccount;
export declare function createEmptyShardAccount(address: Address): ShardAccount;
export type Verbosity =
  | 'none'
  | 'vm_logs'
  | 'vm_logs_location'
  | 'vm_logs_gas'
  | 'vm_logs_full'
  | 'vm_logs_verbose';
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
export declare class GetMethodError extends Error {
  exitCode: number;
  gasUsed: bigint;
  blockchainLogs: string;
  vmLogs: string;
  debugLogs: string;
  constructor(
    exitCode: number,
    gasUsed: bigint,
    blockchainLogs: string,
    vmLogs: string,
    debugLogs: string,
  );
}
export declare class TimeError extends Error {
  address: Address;
  previousTxTime: number;
  currentTime: number;
  constructor(address: Address, previousTxTime: number, currentTime: number);
}
export declare class EmulationError extends Error {
  error: string;
  vmLogs?: string | undefined;
  exitCode?: number | undefined;
  constructor(
    error: string,
    vmLogs?: string | undefined,
    exitCode?: number | undefined,
  );
}
export type SmartContractSnapshot = {
  address: Address;
  account: ShardAccount;
  lastTxTime: number;
  verbosity?: Partial<LogsVerbosity>;
};
export declare class SmartContract {
  #private;
  readonly address: Address;
  readonly blockchain: Blockchain;
  constructor(shardAccount: ShardAccount, blockchain: Blockchain);
  snapshot(): SmartContractSnapshot;
  loadFrom(snapshot: SmartContractSnapshot): void;
  get balance(): bigint;
  set balance(v: bigint);
  get lastTransactionHash(): bigint;
  get lastTransactionLt(): bigint;
  get accountState(): import('@ton/core').AccountState | undefined;
  get account(): ShardAccount;
  set account(account: ShardAccount);
  static create(
    blockchain: Blockchain,
    args: {
      address: Address;
      code: Cell;
      data: Cell;
      balance: bigint;
    },
  ): SmartContract;
  static empty(blockchain: Blockchain, address: Address): SmartContract;
  protected createCommonArgs(params?: MessageParams): RunCommonArgs;
  receiveMessage(
    message: Message,
    params?: MessageParams,
  ): Promise<SmartContractTransaction>;
  runTickTock(
    which: TickOrTock,
    params?: MessageParams,
  ): Promise<SmartContractTransaction>;
  protected runCommon(
    run: () => Promise<EmulationResult>,
  ): Promise<SmartContractTransaction>;
  get(
    method: string | number,
    stack?: TupleItem[],
    params?: GetMethodParams,
  ): Promise<GetMethodResult>;
  get verbosity(): LogsVerbosity;
  set verbosity(value: LogsVerbosity);
  setVerbosity(verbosity: Partial<LogsVerbosity> | Verbosity | undefined): void;
}
export declare const defaultConfigSeqno = 34945086;

export declare class AsyncLock {
  #private;
  acquire(): Promise<void>;
  release(): Promise<void>;
  with<T>(fn: () => Promise<T>): Promise<T>;
}
/// <reference types="node" />
export declare function crc16(data: string | Buffer): number;

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
export type Event =
  | EventAccountCreated
  | EventAccountDestroyed
  | EventMessageSent;
export declare function extractEvents(tx: Transaction): Event[];
/// <reference types="node" />

export interface SandboxContractProvider extends ContractProvider {
  tickTock(which: TickOrTock): Promise<void>;
}
export declare class BlockchainContractProvider
  implements SandboxContractProvider
{
  private readonly blockchain;
  private readonly address;
  private readonly init?;
  constructor(
    blockchain: {
      getContract(address: Address): Promise<SmartContract>;
      pushMessage(message: Message): Promise<void>;
      runGetMethod(
        address: Address,
        method: string,
        args: TupleItem[],
      ): Promise<GetMethodResult>;
      pushTickTock(on: Address, which: TickOrTock): Promise<void>;
      openContract<T extends Contract>(contract: T): OpenedContract<T>;
    },
    address: Address,
    init?: StateInit | null | undefined,
  );
  open<T extends Contract>(contract: T): OpenedContract<T>;
  getState(): Promise<ContractState>;
  get(name: string, args: TupleItem[]): Promise<ContractGetMethodResult>;
  getTransactions(
    address: Address,
    lt: bigint,
    hash: Buffer,
    limit?: number | undefined,
  ): Promise<Transaction[]>;
  external(message: Cell): Promise<void>;
  internal(
    via: Sender,
    args: {
      value: string | bigint;
      bounce?: boolean | null;
      sendMode?: SendMode;
      body?: string | Cell | null;
    },
  ): Promise<void>;
  tickTock(which: TickOrTock): Promise<void>;
}

export type Treasury = Sender & {
  address: Address;
};
export declare class TreasuryContract implements Contract {
  static readonly code: Cell;
  static create(workchain: number, subwalletId: bigint): TreasuryContract;
  readonly address: Address;
  readonly init: StateInit;
  readonly subwalletId: bigint;
  constructor(workchain: number, subwalletId: bigint);
  sendMessages(
    provider: ContractProvider,
    messages: MessageRelaxed[],
    sendMode?: SendMode,
  ): Promise<void>;
  send(provider: ContractProvider, args: SenderArguments): Promise<void>;
  getSender(provider: ContractProvider): Treasury;
  getBalance(provider: ContractProvider): Promise<bigint>;
  createTransfer(args: {
    messages: MessageRelaxed[];
    sendMode?: SendMode;
  }): Cell;
}
export declare function base64Decode(sBase64: string): Uint8Array;

export declare function prettyLogTransaction(tx: Transaction): string;
export declare function prettyLogTransactions(txs: Transaction[]): void;

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
export declare function testSubwalletId(seed: string): bigint;

export declare function formatCoinsPure(
  value: bigint,
  precision?: number,
): string;
export declare function printTransactionFees(transactions: Transaction[]): void;
export declare function getSelectorForMethod(methodName: string): number;
