import { Tree } from '@/interfaces/workspace.interface';

async function buildTs(file: Record<string, string>, rootFile: Tree['path']) {
  const compile = (await import('ts-browser-eval')).default;
  const result = await compile(
    file,
    rootFile as string,
    {
      target: 'ES2017',
    },
    {
      format: 'es',
      name: 'bundle',
    },
  );

  return result;
}

export { buildTs };
