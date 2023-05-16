import { ProjectTemplate as ProjectTemplateData } from '@/constant/ProjectTemplate';
import {
  Project,
  ProjectTemplate,
  Tree,
} from '@/interfaces/workspace.interface';
import { FileInterface } from '@/utility/fileSystem';
import { extractCompilerDiretive, parseGetters } from '@/utility/getterParser';
import {
  CompileResult,
  SuccessResult,
  compileFunc,
} from '@ton-community/func-js';
import { BlobReader, TextWriter, ZipReader } from '@zip.js/zip.js';
import { RcFile } from 'antd/es/upload';
import cloneDeep from 'lodash.clonedeep';
import { v4 as uuidv4 } from 'uuid';
import { useWorkspaceActions } from './workspace.hooks';

export function useProjectActions() {
  const {
    createNewProject,
    getFileByPath,
    addFilesToDatabase,
    updateProjectById,
  } = useWorkspaceActions();

  return {
    createProject,
    compileFuncProgram,
  };

  async function createProject(
    name: string,
    template: ProjectTemplate,
    file: RcFile | null
  ) {
    const { files, filesWithId } =
      template === 'import'
        ? await importUserFile(file as RcFile)
        : createTemplateBasedProject(template);

    addFilesToDatabase(filesWithId);
    const projectId = uuidv4();
    const project = {
      id: projectId,
      name: name,
      template: template,
    };

    createNewProject({ ...project }, files);
  }

  async function compileFuncProgram(file: Tree, projectId: Project['id']) {
    const fileList: any = {};

    let filesToProcess = [file?.path];

    while (filesToProcess.length !== 0) {
      const fileToProcess = filesToProcess.pop();
      const file = await getFileByPath(fileToProcess, projectId);
      if (file?.content) {
        fileList[file.id] = file;
      }
      if (!file?.content) {
        continue;
      }
      let compileDirectives = await extractCompilerDiretive(file.content);

      compileDirectives = compileDirectives.map((d: string) => {
        const pathParts = file?.path?.split('/');
        if (!pathParts) {
          return d;
        }

        // Convert relative path to absolute path by prepending the current file directory
        if (pathParts.length > 1) {
          let fileDirectory = pathParts
            .slice(0, pathParts.length - 1)
            .join('/');
          return `${fileDirectory}/${d}`;
        }

        return d;
      });
      if (compileDirectives.length === 0) {
        continue;
      }
      filesToProcess.push(...compileDirectives);
    }
    const filesCollection: Tree[] = Object.values(fileList);
    let buildResult: CompileResult = await compileFunc({
      targets: [file?.path!!],
      sources: (path) => {
        const file = filesCollection.find((f: Tree) => f.path === path);
        if (file?.content) {
          fileList[file.id] = file;
        }
        return file?.content || '';
      },
    });

    if (buildResult.status === 'error') {
      throw buildResult.message;
    }

    const abi = await generateABI(fileList);
    const data: Partial<Project> = {
      abi: abi,
      contractBOC: (buildResult as SuccessResult).codeBoc,
    };

    updateProjectById(data, projectId);
    return data;
  }

  async function generateABI(fileList: any) {
    const unresolvedPromises = Object.values(fileList).map(
      async (file: any) => {
        return await parseGetters(file.content);
      }
    );
    const results = await Promise.all(unresolvedPromises);
    return results[0];
  }
}

const createTemplateBasedProject = (template: 'tonBlank' | 'tonCounter') => {
  let files: Tree[] = cloneDeep(ProjectTemplateData[template])['func'];
  const filesWithId: FileInterface[] = [];

  files = files.map((file) => {
    if (file.type !== 'file') {
      return file;
    }
    const fileId = uuidv4();
    filesWithId.push({ id: fileId, content: file.content || '' });
    return {
      ...file,
      id: fileId,
      content: '',
    };
  });
  return { files, filesWithId };
};

const importUserFile = async (file: RcFile) => {
  const sysrootArchiveReader = new ZipReader(new BlobReader(file));
  const sysrootArchiveEntries = await sysrootArchiveReader.getEntries();
  const filesToSkip = [
    '._.DS_Store',
    '.DS_Store',
    'node_modules',
    'build',
    '.git',
    '.zip',
  ];
  const files: Tree[] = [];

  const fileDirectoryMap: { [key: string]: string } = {};

  // for storing file in indexed DB
  const filesWithId: FileInterface[] = [];
  for (const entry of sysrootArchiveEntries) {
    if (filesToSkip.some((file) => entry.filename.includes(file))) {
      continue;
    }
    const filePath = entry.filename;
    const pathParts = filePath.split('/');
    const fileName = pathParts[pathParts.length - 1];
    let fileDirectory = pathParts.slice(0, pathParts.length - 1).join('/');
    const currentDirectory = fileDirectory.split('/').slice(-1)[0];
    let parentDirectory = '';
    let fileContent = '';

    if (entry.directory) {
      parentDirectory = fileDirectory.split('/').slice(0, -1).join('/');
    }

    const fileId = uuidv4();

    const currentFile: Tree = {
      id: fileId,
      name: entry.directory ? currentDirectory : fileName,
      type: entry.directory ? 'directory' : 'file',
      parent: null,
      path: filePath.replace(/^\/|\/$/g, ''), // remove last slash
    };

    currentFile.parent =
      fileDirectoryMap[fileDirectory] || fileDirectoryMap[parentDirectory];

    if (entry.directory && fileDirectory) {
      fileDirectoryMap[fileDirectory] = fileId;
    }

    if (!entry.directory) {
      fileContent = await entry.getData!(new TextWriter());
    }

    filesWithId.push({ id: fileId, content: fileContent });
    files.push(currentFile);
  }
  return { files, filesWithId };
};
