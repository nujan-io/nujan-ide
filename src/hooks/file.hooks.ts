import fileSystem from '@/lib/fs';
import { IDEContext } from '@/state/IDE.context';
import { useContext } from 'react';
import { baseProjectPath } from './projectV2.hooks';

const useFile = () => {
  const { activeProject } = useContext(IDEContext);
  const projectPath = `${baseProjectPath}${activeProject?.path}`;
  const getFile = async (filePath: string) => {
    return fileSystem.readFile(`${projectPath}/${filePath}`);
  };

  const saveFile = async (filePath: string, content: string) => {
    return fileSystem.writeFile(`${projectPath}/${filePath}`, content, {
      overwrite: true,
    });
  };

  return {
    getFile,
    saveFile,
  };
};

export default useFile;
