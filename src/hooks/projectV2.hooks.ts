import {
  ProjectTemplate as ProjectTemplateData,
  commonProjectFiles,
} from '@/constant/ProjectTemplate';
import {
  ContractLanguage,
  ProjectSetting,
  ProjectTemplate,
  Tree,
} from '@/interfaces/workspace.interface';
import fileSystem from '@/lib/fs';
import ZIP from '@/lib/zip';
import EventEmitter from '@/utility/eventEmitter';
import { RcFile } from 'antd/es/upload';
import cloneDeep from 'lodash.clonedeep';
import { useContext } from 'react';
import { IDEContext } from '../state/IDE.context';

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  parent?: string;
  content?: string;
}

export const baseProjectPath = '/';

export const useProject = () => {
  const {
    projects,
    setProjects,
    activeProject,
    setActiveProject,
    projectFiles,
    setProjectFiles,
  } = useContext(IDEContext);

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
    if (!projectDirectory) return;

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

    const projectName = projectDirectory.slice(1);

    const project = {
      name: projectName,
      language,
      template,
    };

    await writeFiles(projectDirectory, files);

    const projectSettingPath = `${projectDirectory}/.ide/setting.json`;
    if (!(await fileSystem.exists(projectSettingPath))) {
      await fileSystem.writeFile(
        projectSettingPath,
        JSON.stringify({ ...project }),
      );
    }
    await loadProjects();

    setActiveProject({
      path: projectName,
      ...project,
    });
    return projectDirectory;
  };

  const writeFiles = async (
    projectPath: string,
    files: Pick<Tree, 'type' | 'path' | 'content'>[],
    options?: { overwrite?: boolean },
  ) => {
    await Promise.all(
      files.map(async (file) => {
        const path = `/${projectPath}/${file.path}`;
        if (file.type === 'directory') {
          return fileSystem.mkdir(path);
        }
        await fileSystem.writeFile(path, file.content ?? '', options);
        EventEmitter.emit('FORCE_UPDATE_FILE', path);
        return path;
      }),
    );
    EventEmitter.emit('RELOAD_PROJECT_FILES', projectPath);
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
    options: { basePath: null | string; content: boolean } = {
      basePath: null,
      content: false,
    },
    filter?: (fileNode: FileNode) => boolean,
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
        content: options.content
          ? ((await fileSystem.readFile(filePath)) as string)
          : '',
      };

      if (!filter || filter(fileNode)) {
        results.push(fileNode);
      }

      if (stat.isDirectory()) {
        const nestedFiles = await readdirTree(
          filePath,
          {
            basePath,
            content: options.content,
          },
          filter,
        );
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
    if (!activeProject?.path) return;
    const newPath = `${baseProjectPath}${activeProject.path}/${path}`;
    await fileSystem.create(newPath, type);
    await loadProjectFiles(activeProject.path);
  };

  const deleteProjectFile = async (path: string) => {
    if (!activeProject?.path) return;
    await fileSystem.remove(`${baseProjectPath}${activeProject.path}/${path}`, {
      recursive: true,
    });
    await loadProjectFiles(activeProject.path);
  };

  const moveItem = async (oldPath: string, targetPath: string) => {
    if (!activeProject?.path) return;
    if (oldPath === targetPath) return;

    const newPath = targetPath + '/' + oldPath.split('/').pop();

    await fileSystem.rename(
      `${baseProjectPath}/${oldPath}`,
      `${baseProjectPath}/${newPath}`,
    );
    await loadProjectFiles(activeProject.path);
  };

  const renameProjectFile = async (oldPath: string, newName: string) => {
    if (!activeProject?.path) return;
    const newPath = oldPath.includes('/')
      ? oldPath.split('/').slice(0, -1).join('/') + '/' + newName
      : newName;

    const success = await fileSystem.rename(
      `${baseProjectPath}${activeProject.path}/${oldPath}`,
      `${baseProjectPath}${activeProject.path}/${newPath}`,
    );
    if (!success) return;
    await loadProjectFiles(activeProject.path);
  };

  const updateActiveProject = async (
    projectPath: string | null,
    force = false,
  ) => {
    if (activeProject?.path === projectPath && !force) return;
    const projectSettingPath = `${baseProjectPath}${projectPath}/.ide/setting.json`;
    if (projectPath && (await fileSystem.exists(projectSettingPath))) {
      const setting = (await fileSystem.readFile(projectSettingPath)) as string;
      const parsedSetting = setting ? JSON.parse(setting) : {};
      setActiveProject({
        ...parsedSetting,
        path: projectPath,
      });
    } else {
      setActiveProject(null);
    }
  };

  const updateProjectSetting = async (itemToUpdate: ProjectSetting) => {
    if (!activeProject?.path) return;
    const projectSettingPath = `${baseProjectPath}${activeProject.path}/.ide/setting.json`;
    if (!(await fileSystem.exists(projectSettingPath))) {
      await fileSystem.writeFile(projectSettingPath, JSON.stringify({}));
    } else {
      const setting = (await fileSystem.readFile(projectSettingPath)) as string;
      const parsedSetting = setting ? JSON.parse(setting) : {};
      await fileSystem.writeFile(
        projectSettingPath,
        JSON.stringify({ ...parsedSetting, ...itemToUpdate }),
        {
          overwrite: true,
        },
      );
      await updateActiveProject(activeProject.path, true);
    }
    await loadProjectFiles(activeProject.path);
  };

  return {
    projects,
    projectFiles,
    activeProject,
    createProject,
    writeFiles,
    deleteProject,
    readdirTree,
    newFileFolder,
    deleteProjectFile,
    moveItem,
    renameProjectFile,
    setActiveProject: updateActiveProject,
    loadProjectFiles,
    loadProjects,
    updateProjectSetting,
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
