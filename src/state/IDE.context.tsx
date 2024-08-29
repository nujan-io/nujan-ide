import { Tree } from '@/interfaces/workspace.interface';
import { FC, createContext, useEffect, useState } from 'react';

interface IDEContextProps {
  projects: string[];
  setProjects: (projects: string[]) => void;
  projectFiles: Tree[];
  setProjectFiles: (files: Tree[]) => void;
  activeProject: string | null;
  setActiveProject: (project: string | null) => void;
  tabs: string[];
  setTabs: (tabs: string[]) => void;
}

export const IDEContext = createContext<IDEContextProps>({
  projects: [],
  projectFiles: [],
  setProjectFiles: () => {},
  setProjects: () => {},
  activeProject: null,
  setActiveProject: () => {},
  tabs: [],
  setTabs: () => {},
});

export const IDEProvider: FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [projects, setProjects] = useState<string[]>([]);
  const [projectFiles, setProjectFiles] = useState<Tree[]>([]);
  const [tabs, setTabs] = useState<string[]>([]);
  const [activeProject, setActiveProject] = useState<string | null>(null);

  const value = {
    projects,
    setProjects,
    projectFiles,
    setProjectFiles,
    activeProject,
    setActiveProject,
    tabs,
    setTabs,
  };

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
