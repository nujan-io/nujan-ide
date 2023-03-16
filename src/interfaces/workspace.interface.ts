export interface Tree {
  id: string;
  name: string;
  parent: string | null;
  type: 'directory' | 'file';
  isOpen?: boolean;
  path?: string;
  content?: string;
  isModified?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ProjectFiles {
  [id: string]: Tree[];
}

export interface Project {
  id: string;
  name: string;
  template: string;
  contractAddress?: string;
  isPublic?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type WorkspaceState = {
  openFiles: Tree[];
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
