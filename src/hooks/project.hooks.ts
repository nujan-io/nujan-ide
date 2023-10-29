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
import {
  getContracts,
  getType,
} from '@tact-lang/compiler/dist/types/resolveDescriptors';

import EventEmitter from '@/utility/eventEmitter';
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
import { useWorkspaceActions } from './workspace.hooks';

export function useProjectActions() {
  const {
    createNewProject,
    getFileByPath,
    addFilesToDatabase,
    updateProjectById,
    createNewItem,
    updateFileContent,
    deleteItem,
  } = useWorkspaceActions();

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
    const data: Partial<Project> = {
      abi: { getters: abi as any, setters: [] },
      contractBOC: (buildResult as SuccessResult).codeBoc,
    };

    updateProjectById(data, projectId);
    return data;
  }

  async function compileTactProgram(
    file: Pick<Tree, 'path'>,
    projectId: Project['id']
  ) {
    const fileList: { [key: string]: string } = {};

    let filesToProcess = [file?.path];

    while (filesToProcess.length !== 0) {
      const fileToProcess = filesToProcess.pop();
      const file = await getFileByPath(fileToProcess, projectId);
      if (file?.content) {
        fileList[file.path!!] = file.content;
      }
      if (!file?.content) {
        continue;
      }
    }

    const fs = new OverwritableVirtualFileSystem(fileList);

    const response = await buildTact({
      config: {
        path: file.path!!,
        output: 'dist',
        name: 'tact',
      },
      project: fs,
      stdlib: '@stdlib',
    });

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

    const getters = (output.abi as any)?.getters?.map((item: any) => {
      return {
        name: item.name,
        parameters: item.arguments.map((parameter: any) => {
          return {
            name: parameter.name,
            type: parameter.type,
            format: parameter.format,
            optional: parameter.optional,
          };
        }),
      };
    });

    let setters: any = [];
    (output.abi as any)?.receivers?.forEach((item: any) => {
      if (item.message.type === 'Deploy') {
        return;
      }
      if (item.message.kind) {
        if (item.message.kind !== 'typed') {
          setters.push({
            name: item.message.text,
            parameters: [],
            kind: item.message.kind,
          });
          return;
        }
        const singleItem = (output.abi as any).types.find(
          (type: any) => type.name === item.message.type
        );
        const singleField = {
          name: singleItem.name,
          parameters: singleItem.fields.map((parameter: any) => {
            return {
              name: parameter.name,
              type: parameter.type.type,
              format: parameter.type.format,
              optional: parameter.type.optional,
              kind: item.message.kind,
            };
          }),
        };
        setters.push(singleField);
      }
    });

    let ctx = new CompilerContext({ shared: {} });
    let stdlib = createVirtualFileSystem('@stdlib', stdLibFiles);
    ctx = precompile(ctx, fs, stdlib, file.path!!);
    const _contract = getContracts(ctx);
    const contactType = getType(ctx, _contract[0]);

    const initParams = contactType.init?.args?.map((item: any) => {
      return {
        name: item.name,
        type: item.type.name,
        optional: item.type.optional,
      };
    });

    const deployFields = (output.abi as any).types.find(
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

    const data: Partial<Project> = {
      abi: { getters, setters },
      contractBOC: output.boc,
      initParams,
      contractScript: output.contractScript.value,
      contractName: _contract[0],
    };

    updateProjectById(data, projectId);

    const scriptFile = await getFileByPath(
      output.contractScript.name,
      projectId
    );

    let fileToReRender = scriptFile;

    if (!scriptFile?.id) {
      let distDirectory = await getFileByPath('dist', projectId);
      fileToReRender = await createNewItem(
        distDirectory?.id!!,
        output.contractScript.name,
        'file',
        projectId,
        output.contractScript.value.toString()
      );
    } else {
      updateFileContent(
        scriptFile.id,
        output.contractScript.value.toString(),
        projectId
      );
    }

    EventEmitter.emit('FORCE_UPDATE_FILE', fileToReRender?.id);

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

  let commonFiles: any = [];

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
