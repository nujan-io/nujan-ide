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

interface ProjectFiles {
  [id: string]: Tree[];
}

export interface Project {
  id: string;
  userId?: string;
  name: string;
  template: string;
  contractAddress?: string;
  contractBOC?: string;
  abi?: ABI[];
  isPublic?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
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
}

export interface ABI {
  returnTypes: string[];
  name: string;
  parameters: ABIParameter[];
}

export type ParameterType = 'address' | 'cell' | 'slice' | 'int';
