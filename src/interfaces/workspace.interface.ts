import { ABITypeRef } from '@ton/core';
import { Maybe } from '@ton/core/dist/utils/maybe';

export interface Tree {
  id: string;
  name: string;
  parent: string | null;
  type: 'directory' | 'file';
  isOpen?: boolean;
  path?: string;
  content?: string;
  isDirty?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type ProjectTemplate = 'tonBlank' | 'tonCounter' | 'import';

export type NetworkEnvironment = 'TESTNET' | 'MAINNET' | 'SANDBOX';

export type ContractLanguage = 'func' | 'tact';

type ProjectFiles = Record<string, Tree[]>;

export interface InitParams {
  name: string;
  type: string;
  optional: boolean;
}

export interface CellABI {
  deploy?: InitParams;
  setter?: InitParams;
}
export interface Project {
  id: string;
  userId?: string;
  name: string;
  language?: ContractLanguage;
  template: string;
  contractAddress?: string;
  contractBOC?: string;
  abi?: ABI;
  contractScript?: Buffer;
  initParams?: InitParams[];
  contractName?: string;
  selectedContract?: string;
  isPublic?: boolean;
  network?: NetworkEnvironment;
  createdAt?: Date;
  updatedAt?: Date;
  cellABI?: CellABI;
}

export type WorkspaceState = {
  openFiles: ProjectFiles;
  projectFiles: ProjectFiles | null;
  projects: Project[];
  activeProjectId: string;
};

export interface ABIParameter {
  type: string;
  name: string;
  optional?: boolean;
  format?: number;
}

export interface TactSetters {
  name: string;
  parameters: ABIParameter[];
  returnTypes?: ABIParameter;
  kind?: string;
}

export interface ABIFieldMessage {
  type: string;
  kind: string;
  text: string;
  name: string;
}

export interface ABIField {
  name: string;
  kind?: string;
  message?: ABIFieldMessage;
  parameters?: ABIParameter[];
  arguments?: ABIParameter[];
  returnTypes?: ABIParameter;
}

export interface ABI {
  getters: ABIField[];
  setters: ABIField[];
}

export interface TactABIField {
  name: string;
  type: ABITypeRef & { defaultValue?: string | number };
  fields: ABIField[] | null;
}

export interface TactType {
  name: string;
  type?: ABITypeRef;
  params: TactABIField[];
  returnType: Maybe<ABITypeRef>;
}
export interface TactABI {
  receivers: TactType[];
  getters: TactType[];
  init: Maybe<TactType[]>;
}

type TactInputValueType =
  | string
  | number
  | boolean
  | null
  | undefined
  | TactInputValueType[]
  | { [key: string]: TactInputValueType };

interface TactInputBaseField {
  value: TactInputValueType;
  type: string;
  $$type?: string;
}

export interface TactInputFields extends TactInputBaseField {
  [key: string]: TactInputValueType | TactInputBaseField | TactInputFields;
}

export type ParameterType = 'address' | 'cell' | 'slice' | 'int' | 'bool';
