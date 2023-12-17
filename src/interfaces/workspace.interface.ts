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

interface ProjectFiles {
  [id: string]: Tree[];
}

export interface InitParams {
  name: string;
  type: string;
  optional: boolean;
}

interface CellABI {
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
  isPublic?: boolean;
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
}

export interface ABIField {
  name: string;
  kind: string;
  parameters: ABIParameter[];
  arguments: ABIParameter[];
  returnTypes: ABIParameter;
}

export interface ABI {
  getters: ABIField[];
  setters: ABIField[];
  // returnTypes: string[];
  // name: string;
  // parameters: ABIParameter[];
}

export type ParameterType = 'address' | 'cell' | 'slice' | 'int' | 'bool';
