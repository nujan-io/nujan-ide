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
import { extractCompilerDiretive, parseGetters } from '@/utility/getterParser';
import {
  LogLevel,
  build as buildTact,
  createVirtualFileSystem,
} from '@tact-lang/compiler';
import stdLibFiles from '@tact-lang/compiler/dist/imports/stdlib';
import { precompile } from '@tact-lang/compiler/dist/pipeline/precompile';

import ZIP from '@/lib/zip';
import { getContractInitParams } from '@/utility/abi';
import TactLogger from '@/utility/tactLogger';
import { CompilerContext } from '@tact-lang/compiler/dist/context';
import {
  CompileResult,
  SuccessResult,
  compileFunc,
} from '@ton-community/func-js';
import { RcFile } from 'antd/es/upload';
import cloneDeep from 'lodash.clonedeep';
import { useSettingAction } from './setting.hooks';
import { useWorkspaceActions } from './workspace.hooks';

export function useProjectActions() {
  const { getFileByPath, createFiles, projectFiles } = useWorkspaceActions();
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
    defaultFiles?: Tree[],
  ) {
    const fileSystem = (await import('@/lib/fs')).default;
    // Create project directory at the root of the file system
    const projectDirectory = await fileSystem.mkdir(`/${name}`, {
      overwrite: false,
    });

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

    // Create files, directories
    await Promise.all(
      files.map(async (file) => {
        const path = `/${projectDirectory}/${file.path}`;
        if (file.type === 'directory') {
          return fileSystem.mkdir(path);
        }
        return fileSystem.writeFile(path, file.content ?? '');
      }),
    );

    // Save project settings
    const projectSettingPath = `/${projectDirectory}/.ide/setting.json`;
    if (!(await fileSystem.exists(projectSettingPath))) {
      await fileSystem.writeFile(
        projectSettingPath,
        JSON.stringify({ project }),
      );
    }

    return projectDirectory;
  }

  async function compileFuncProgram(
    file: Pick<Tree, 'path'>,
    projectId: Project['id'],
  ) {
    const fileList: Record<string, Tree> = {};

    const filesToProcess = [file.path];

    while (filesToProcess.length !== 0) {
      const fileToProcess = filesToProcess.pop();
      const file = await getFileByPath(fileToProcess!, projectId);
      if (file?.content) {
        fileList[file.id] = file;
      }
      if (!file?.content) {
        continue;
      }
      let compileDirectives = await extractCompilerDiretive(file.content);

      compileDirectives = compileDirectives.map((d: string) => {
        const pathParts = file.path.split('/');
        // if (!pathParts) {
        //   return d;
        // }

        // Convert relative path to absolute path by prepending the current file directory
        if (pathParts.length > 1) {
          const fileDirectory = pathParts
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
    const buildResult: CompileResult = await compileFunc({
      targets: [file.path!],
      sources: (path) => {
        const file = filesCollection.find((f: Tree) => f.path === path);
        if (file?.content) {
          fileList[file.id] = file;
        }
        return file?.content ?? '';
      },
    });

    if (buildResult.status === 'error') {
      throw new Error(buildResult.message);
    }

    const abi = await generateABI(fileList);

    const contractName = file.path.replace('.fc', '');
    await createFiles(
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
      projectId,
    );
    return { contractBOC: (buildResult as SuccessResult).codeBoc };
  }

  async function compileTactProgram(
    file: Pick<Tree, 'path'>,
    projectId: Project['id'],
  ) {
    const filesToProcess = [file.path];

    projectFiles(projectId).forEach((f) => {
      if (
        /\.(tact|fc|func)$/.test(f.name) &&
        !filesToProcess.includes(f.path) &&
        !f.path.startsWith('dist/')
      ) {
        filesToProcess.push(f.path);
      }
    });

    const fs = new OverwritableVirtualFileSystem();

    while (filesToProcess.length !== 0) {
      const fileToProcess = filesToProcess.pop();
      const file = await getFileByPath(fileToProcess!, projectId);
      if (file?.path) {
        fs.writeContractFile(file.path!, file.content ?? '');
      }
    }

    let ctx = new CompilerContext({ shared: {} });
    const stdlib = createVirtualFileSystem('@stdlib', stdLibFiles);
    ctx = precompile(ctx, fs, stdlib, file.path!);

    const response = await buildTact({
      config: {
        path: file.path!,
        output: 'dist',
        name: 'tact',
        options: {
          debug: isContractDebugEnabled(),
        },
      },
      project: fs,
      stdlib: '@stdlib',
      logger: new TactLogger(LogLevel.DEBUG),
    });
    if (!response.ok) {
      throw new Error('Error while building');
    }

    const output = {
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

    const buildFiles: Pick<Tree, 'path' | 'content'>[] = [];
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
          ...(fileContent as Partial<Tree>),
          init: getContractInitParams(ctx, contractName),
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

    await createFiles(buildFiles, 'dist', projectId);

    return fs.overwrites;
  }

  async function generateABI(fileList: Record<string, Tree>) {
    const unresolvedPromises = Object.values(fileList).map(async (file) => {
      if (!file.content) {
        return;
      }
      return await parseGetters(file.content);
    });
    const results = await Promise.all(unresolvedPromises);
    return results[0];
  }
}

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
