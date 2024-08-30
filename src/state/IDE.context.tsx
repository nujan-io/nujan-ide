import { Tree } from '@/interfaces/workspace.interface';
import { FC, createContext, useEffect, useMemo, useState } from 'react';

interface ITabItems {
  name: string;
  path: string;
  isDirty: boolean;
}

export interface IFileTab {
  items: ITabItems[];
  active: string | null;
}

interface IDEContextProps {
  projects: string[];
  setProjects: (projects: string[]) => void;
  projectFiles: Tree[];
  setProjectFiles: (files: Tree[]) => void;
  activeProject: string | null;
  setActiveProject: (project: string | null) => void;
  fileTab: IFileTab;
  setFileTab: (fileTab: IFileTab) => void;
}

const defaultState = {
  projects: [],
  projectFiles: [],
  setProjectFiles: () => {},
  setProjects: () => {},
  activeProject: null,
  setActiveProject: () => {},
  fileTab: {
    items: [],
    active: null,
  },
  setFileTab: () => {},
};

export const IDEContext = createContext<IDEContextProps>(defaultState);

export const IDEProvider: FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [projects, setProjects] = useState<string[]>([]);
  const [projectFiles, setProjectFiles] = useState<Tree[]>([]);
  const [fileTab, setFileTab] = useState<IFileTab>(defaultState.fileTab);
  const [activeProject, setActiveProject] = useState<string | null>(null);

  const value = useMemo(
    () => ({
      projects,
      setProjects,
      projectFiles,
      setProjectFiles,
      activeProject,
      setActiveProject,
      fileTab,
      setFileTab,
    }),
    [activeProject, projects, projectFiles, fileTab],
  );

  const onInit = () => {
    const storedActiveProject = localStorage.getItem('IDE_activeProject');
    if (storedActiveProject) {
      setActiveProject(storedActiveProject);
    }
  };

  useEffect(() => {
    onInit();
  }, []);

  useEffect(() => {
    localStorage.setItem('IDE_activeProject', activeProject ?? '');
  }, [activeProject]);

  return <IDEContext.Provider value={value}>{children}</IDEContext.Provider>;
};
