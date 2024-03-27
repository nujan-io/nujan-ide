import {
  ProjectTemplate as ProjectTemplateData,
  commonProjectFiles,
} from '@/constant/ProjectTemplate';
import {
  ContractLanguage,
  Project,
  ProjectTemplate,
  Tree,
} from '@/interfaces/workspace.interface';
import { OverwritableVirtualFileSystem } from '@/utility/OverwritableVirtualFileSystem';
import { FileInterface } from '@/utility/fileSystem';
import { extractCompilerDiretive, parseGetters } from '@/utility/getterParser';
import {
  build as buildTact,
  createVirtualFileSystem,
} from '@tact-lang/compiler';
import stdLibFiles from '@tact-lang/compiler/dist/imports/stdlib';
import { precompile } from '@tact-lang/compiler/dist/pipeline/precompile';
import { getType } from '@tact-lang/compiler/dist/types/resolveDescriptors';

import { CompilerContext } from '@tact-lang/compiler/dist/context';
import {
  CompileResult,
  SuccessResult,
  compileFunc,
} from '@ton-community/func-js';
import { BlobReader, TextWriter, ZipReader } from '@zip.js/zip.js';
import { RcFile } from 'antd/es/upload';
import cloneDeep from 'lodash.clonedeep';
import { v4 as uuidv4 } from 'uuid';
import { useSettingAction } from './setting.hooks';
import { useWorkspaceActions } from './workspace.hooks';

export function useProjectActions() {
  const {
    createNewProject,
    getFileByPath,
    addFilesToDatabase,
    updateProjectById,
    createFiles,
    updateFileContent,
    deleteItem,
    projectFiles,
  } = useWorkspaceActions();
  const { isContractDebugEnabled } = useSettingAction();

  return {
    createProject,
    compileFuncProgram,
    compileTactProgram,
  };

  async function createProject(
    name: string,
    language: ContractLanguage,
    template: ProjectTemplate,
    file: RcFile | null,
    defaultFiles?: Tree[]
  ) {
    let { files, filesWithId } =
      template === 'import' && defaultFiles?.length == 0
        ? await importUserFile(file as RcFile, language)
        : createTemplateBasedProject(template, language, defaultFiles);

    const convertedFileObject = files.reduce((acc: any, current) => {
      acc[current.name] = current;
      return acc;
    }, {});

    if (
      (!convertedFileObject['stateInit.cell.ts'] ||
        !convertedFileObject['message.cell.ts']) &&
      language !== 'tact'
    ) {
      const commonFiles = createTemplateBasedProject(
        'import',
        language,
        commonProjectFiles
      );
      files = [...files, ...commonFiles.files];
      filesWithId = [...filesWithId, ...commonFiles.filesWithId];
    }

    addFilesToDatabase(filesWithId);
    const projectId = uuidv4();
    const project = {
      id: projectId,
      name,
      language,
      template,
    };

    createNewProject({ ...project }, files);
    return projectId;
  }

  async function compileFuncProgram(
    file: Pick<Tree, 'path'>,
    projectId: Project['id']
  ) {
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

    const contractName = file.path?.replace('.fc', '');
    createFiles(
      [
        {
          path: `dist/func_${contractName}.abi`,
          content: JSON.stringify({
            name: contractName,
            getters: abi,
            setters: [],
          }),
        },
        {
          path: `dist/func_${contractName}.code.boc`,
          content: (buildResult as SuccessResult).codeBoc,
        },
      ],
      'dist',
      projectId
    );
    return { contractBOC: (buildResult as SuccessResult).codeBoc };
  }

  async function compileTactProgram(
    file: Pick<Tree, 'path'>,
    projectId: Project['id']
  ) {
    const fileList: { [key: string]: string } = {};

    let filesToProcess = [file?.path];

    projectFiles(projectId).forEach((f) => {
      if (f.name.includes('.tact') && !filesToProcess.includes(f.path)) {
        filesToProcess.push(f.path);
      }
    });

    const fs = new OverwritableVirtualFileSystem();

    while (filesToProcess.length !== 0) {
      const fileToProcess = filesToProcess.pop();
      const file = await getFileByPath(fileToProcess, projectId);
      if (file?.path) {
        fs.writeContractFile(file.path!!, file?.content || '');
      }
    }

    let ctx = new CompilerContext({ shared: {} });
    let stdlib = createVirtualFileSystem('@stdlib', stdLibFiles);
    try {
      ctx = precompile(ctx, fs, stdlib, file.path!!);
    } catch (error: any) {
      throw error;
    }

    const response = await buildTact({
      config: {
        path: file.path!!,
        output: 'dist',
        name: 'tact',
        options: {
          debug: isContractDebugEnabled(),
        },
      },
      project: fs,
      stdlib: '@stdlib',
    });
    if (!response) {
      throw new Error('Error while building');
    }

    let output = {
      abi: '',
      boc: '',
      contractScript: {
        name: '',
        value: Buffer.from(''),
      },
    };

    fs.overwrites.forEach((value, key) => {
      if (key.includes('.abi')) {
        output.abi = JSON.parse(value.toString());
      } else if (key.includes('.boc')) {
        output.boc = Buffer.from(value).toString('base64');
      } else if (key.includes('.ts')) {
        output.contractScript = {
          name: key,
          value,
        };
      }
    });

    let buildFiles: Pick<Tree, 'path' | 'content'>[] = [];
    fs.overwrites.forEach((value, key) => {
      const filePath = key.slice(1);

      let fileContent = value.toString();
      if (key.includes('.abi')) {
        const contractName = key
          .replace('/dist/', '')
          .replace('.abi', '')
          .replace('tact_', '');
        fileContent = JSON.parse(fileContent);
        const parsedFileContent = {
          ...(fileContent as Object),
          initParams: getInitParams(ctx, contractName, fileContent),
        };
        fileContent = JSON.stringify(parsedFileContent);
      }
      if (key.includes('.boc')) {
        fileContent = Buffer.from(value).toString('base64');
      }
      buildFiles.push({
        path: filePath,
        content: fileContent,
      });
      // TODO: Do this after the build files are updated.
      // EventEmitter.emit('FORCE_UPDATE_FILE', filePath);
    });

    createFiles(buildFiles, 'dist', projectId);

    return fs.overwrites;
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

const createTemplateBasedProject = (
  template: 'tonBlank' | 'tonCounter' | 'import',
  language: ContractLanguage = 'tact',
  files: Tree[] = []
) => {
  let _files: Tree[] = cloneDeep(files);
  if (files.length === 0 && template !== 'import') {
    _files = ProjectTemplateData[template][language];
  }
  const filesWithId: FileInterface[] = [];

  _files = _files.map((file) => {
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
  return { files: _files, filesWithId };
};

const importUserFile = async (
  file: RcFile,
  language: ContractLanguage = 'tact'
) => {
  const sysrootArchiveReader = new ZipReader(new BlobReader(file));
  const sysrootArchiveEntries = await sysrootArchiveReader.getEntries();
  const filesToSkip = [
    '._',
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

  let commonFiles: any = { files: [], filesWithId: [] };

  if (language !== 'tact') {
    commonFiles = createTemplateBasedProject(
      'import',
      language,
      commonProjectFiles
    );
  }

  return {
    files: [...files, ...commonFiles.files],
    filesWithId: [...filesWithId, ...commonFiles.filesWithId],
  };
};

const getInitParams = (
  ctx: CompilerContext,
  contractName: string,
  abi: any
) => {
  const contactType = getType(ctx, contractName);
  let initParams: { name: string; type: string; optional: boolean }[] = [];

  initParams =
    contactType.init?.args?.map((item: any) => {
      return {
        name: item.name,
        type: item.type.name,
        optional: item.type.optional,
      };
    }) ?? [];

  const deployFields = abi.types.find(
    (item: any) => item.name === 'Deploy'
  )?.fields;

  if (deployFields && deployFields.length > 0) {
    deployFields.forEach((item: any) => {
      initParams?.push({
        name: item.name,
        type: item.type.type,
        optional: item.type.optional,
      });
    });
  }
  return initParams;
};
