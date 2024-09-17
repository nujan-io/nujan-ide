import fileSystem from '@/lib/fs';

const useFile = () => {
  const getFile = async (filePath: string) => {
    return fileSystem.readFile(filePath);
  };

  const saveFile = async (filePath: string, content: string) => {
    return fileSystem.writeFile(filePath, content, {
      overwrite: true,
    });
  };

  return {
    getFile,
    saveFile,
  };
};

export default useFile;
