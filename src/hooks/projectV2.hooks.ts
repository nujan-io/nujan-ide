import {
  ProjectTemplate as ProjectTemplateData,
  commonProjectFiles,
} from '@/constant/ProjectTemplate';
import {
  ContractLanguage,
  ProjectTemplate,
  Tree,
} from '@/interfaces/workspace.interface';
import fileSystem from '@/lib/fs';
import ZIP from '@/lib/zip';
import { RcFile } from 'antd/es/upload';
import cloneDeep from 'lodash.clonedeep';
import { useContext, useEffect } from 'react';
import { IDEContext } from '../state/IDE.context';

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  parent?: string;
}

export const useProjects = () => {
  const {
    projects,
    setProjects,
    activeProject,
    setActiveProject,
    projectFiles,
    setProjectFiles,
  } = useContext(IDEContext);
  const baseProjectPath = '/';

  useEffect(() => {
    if (activeProject) {
      loadProjectFiles(activeProject).catch(() => {});
    }
  }, [activeProject]);

  useEffect(() => {
    loadProjects().catch(() => {});
  }, []);

  const loadProjects = async () => {
    const projectCollection = await fileSystem.readdir(baseProjectPath, {
      onlyDir: true,
    });
    setProjects([...projectCollection]);
  };

  const createProject = async (
    name: string,
    language: ContractLanguage,
    template: ProjectTemplate,
    file: RcFile | null,
    defaultFiles?: Tree[],
  ) => {
    const projectDirectory = await fileSystem.mkdir(
      `${baseProjectPath}${name}`,
      {
        overwrite: false,
      },
    );

    let files =
      template === 'import' && defaultFiles?.length == 0
        ? await new ZIP(fileSystem).importZip(file as RcFile, projectDirectory)
        : createTemplateBasedProject(template, language, defaultFiles);

    const fileMapping: Record<string, Partial<Tree> | undefined> = files.reduce(
      (acc, current) => {
        acc[current.path] = current;
        return acc;
      },
      {} as Record<string, Partial<Tree>>,
    );

    if (
      (!fileMapping['stateInit.cell.ts'] || !fileMapping['message.cell.ts']) &&
      language === 'func'
    ) {
      const commonFiles = createTemplateBasedProject(
        'import',
        language,
        commonProjectFiles,
      );
      files = [...files, ...commonFiles];
    }

    const project = {
      language,
      template,
    };

    await Promise.all(
      files.map(async (file) => {
        const path = `/${projectDirectory}/${file.path}`;
        if (file.type === 'directory') {
          return fileSystem.mkdir(path);
        }
        return fileSystem.writeFile(path, file.content ?? '');
      }),
    );

    const projectSettingPath = `${projectDirectory}/.ide/setting.json`;
    if (!(await fileSystem.exists(projectSettingPath))) {
      await fileSystem.writeFile(
        projectSettingPath,
        JSON.stringify({ project }),
      );
    }
    await loadProjects();

    setActiveProject(projectDirectory.slice(1));
    return projectDirectory;
  };

  const loadProjectFiles = async (projectName: string) => {
    const projectFiles = await readdirTree(`${baseProjectPath}${projectName}`);
    setProjectFiles(projectFiles as Tree[]);
  };

  /**
   * Read the contents of a directory in a tree structure
   * @param path
   * @returns FileNode[]
   */
  const readdirTree = async (
    path: string,
    options: { basePath: null | string } = { basePath: null },
  ): Promise<FileNode[]> => {
    const results: FileNode[] = [];
    const basePath = options.basePath ?? path;

    const files = await fileSystem.readdir(path);

    for (const file of files) {
      const filePath = `${path}/${file}`;
      const stat = await fileSystem.stat(filePath);
      const fileNode: FileNode = {
        name: file,
        path: filePath.replace(basePath + '/', ''),
        type: stat.isDirectory() ? 'directory' : 'file',
        parent:
          path === basePath ? undefined : path.replace(basePath + '/', ''),
      };

      results.push(fileNode);

      if (stat.isDirectory()) {
        const nestedFiles = await readdirTree(filePath, { basePath });
        results.push(...nestedFiles);
      }
    }

    return results;
  };

  const deleteProject = async (projectName: string) => {
    await fileSystem.rmdir(projectName, { recursive: true });
    await loadProjects();
    setProjectFiles([]);

    return projectName;
  };

  const newFileFolder = async (path: string, type: 'file' | 'directory') => {
    if (!activeProject) return;
    const newPath = `${baseProjectPath}${activeProject}/${path}`;
    await fileSystem.create(newPath, type);
    await loadProjectFiles(activeProject);
  };

  const deleteProjectFile = async (path: string) => {
    if (!activeProject) return;
    await fileSystem.remove(`${baseProjectPath}${activeProject}/${path}`, {
      recursive: true,
    });
    await loadProjectFiles(activeProject);
  };

  const moveItem = async (oldPath: string, targetPath: string) => {
    if (!activeProject) return;
    if (oldPath === targetPath) return;

    const newPath = targetPath + '/' + oldPath.split('/').pop();

    await fileSystem.rename(
      `${baseProjectPath}/${oldPath}`,
      `${baseProjectPath}/${newPath}`,
    );
    await loadProjectFiles(activeProject);
  };

  const renameProjectFile = async (oldPath: string, newName: string) => {
    if (!activeProject) return;
    const newPath = oldPath.includes('/')
      ? oldPath.split('/').slice(0, -1).join('/') + '/' + newName
      : newName;

    const success = await fileSystem.rename(
      `${baseProjectPath}${activeProject}/${oldPath}`,
      `${baseProjectPath}${activeProject}/${newPath}`,
    );
    if (!success) return;
    await loadProjectFiles(activeProject);
  };

  return {
    projects,
    projectFiles,
    activeProject,
    createProject,
    deleteProject,
    newFileFolder,
    deleteProjectFile,
    moveItem,
    renameProjectFile,
    setActiveProject,
  };
};

const createTemplateBasedProject = (
  template: 'tonBlank' | 'tonCounter' | 'import',
  language: ContractLanguage = 'tact',
  files: Tree[] = [],
) => {
  let _files: Pick<Tree, 'type' | 'path' | 'content'>[] = cloneDeep(files);
  if (files.length === 0 && template !== 'import') {
    _files = ProjectTemplateData[template][language];
  }

  _files = _files.map((file) => {
    return {
      type: file.type,
      path: file.path,
      content: file.content,
    };
  });
  return _files;
};
