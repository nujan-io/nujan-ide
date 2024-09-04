import { Project, Tree } from '@/interfaces/workspace.interface';
import { OverwritableVirtualFileSystem } from '@/utility/OverwritableVirtualFileSystem';
import { extractCompilerDiretive, parseGetters } from '@/utility/getterParser';
import {
  LogLevel,
  build as buildTact,
  createVirtualFileSystem,
} from '@tact-lang/compiler';
import stdLibFiles from '@tact-lang/compiler/dist/imports/stdlib';
import { precompile } from '@tact-lang/compiler/dist/pipeline/precompile';

import fileSystem from '@/lib/fs';
import { getContractInitParams } from '@/utility/abi';
import TactLogger from '@/utility/tactLogger';
import { CompilerContext } from '@tact-lang/compiler/dist/context';
import {
  CompileResult,
  SuccessResult,
  compileFunc,
} from '@ton-community/func-js';
import { useProject } from './projectV2.hooks';
import { useSettingAction } from './setting.hooks';
import { useWorkspaceActions } from './workspace.hooks';

export function useProjectActions() {
  const { getFileByPath, createFiles, projectFiles } = useWorkspaceActions();
  const { isContractDebugEnabled } = useSettingAction();
  const { writeFiles } = useProject();

  return {
    compileFuncProgram,
    compileTactProgram,
  };

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

    const fs = new OverwritableVirtualFileSystem(`/`);

    while (filesToProcess.length !== 0) {
      const fileToProcess = filesToProcess.pop();
      const filePath = `/${projectId}/${fileToProcess}`;
      const fileContent = await fileSystem.readFile(filePath!);
      if (fileContent) {
        fs.writeContractFile(filePath!, fileContent as string);
      }
    }

    let ctx = new CompilerContext({ shared: {} });
    const stdlib = createVirtualFileSystem('@stdlib', stdLibFiles);
    const entryFile = `/${projectId}/${file.path}`;
    ctx = precompile(ctx, fs, stdlib, entryFile);

    const response = await buildTact({
      config: {
        path: entryFile,
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

    const buildFiles: Pick<Tree, 'path' | 'content' | 'type'>[] = [];
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
        type: 'file',
      });
      // TODO: Do this after the build files are updated.
      // EventEmitter.emit('FORCE_UPDATE_FILE', filePath);
    });

    await writeFiles(projectId, buildFiles, { overwrite: true });
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
