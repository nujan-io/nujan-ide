import { Project, Tree } from '@/interfaces/workspace.interface';
import { buildTs } from '@/utility/typescriptHelper';
import { OutputChunk } from 'rollup';
import { useProject } from './projectV2.hooks';
export { useWorkspaceActions };

function useWorkspaceActions() {
  const { readdirTree } = useProject();

  return {
    compileTsFile,
    isProjectEditable,
  };

  async function compileTsFile(
    filePath: Tree['path'],
    projectId: Project['id'],
  ) {
    if (!filePath.endsWith('.ts')) {
      throw new Error('Not a typescript file');
    }
    const tsProjectFiles: Record<string, string> = {};

    const filesWithContent = await readdirTree(
      projectId,
      {
        basePath: null,
        content: true,
      },
      (file: { path: string; name: string }) => file.name.endsWith('.ts'),
    );

    filesWithContent.forEach((file) => {
      tsProjectFiles[file.path!] = file.content ?? '';
    });

    return buildTs(tsProjectFiles, filePath) as Promise<OutputChunk[]>;
  }

  function isProjectEditable() {
    return true;
  }
}
