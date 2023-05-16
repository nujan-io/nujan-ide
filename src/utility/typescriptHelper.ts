import { Tree } from '@/interfaces/workspace.interface';

async function buildTs(file: any, rootFile: Tree['path']) {
  const compile = (await import('ts-browser-eval')).default;
  const result = await compile(
    file,
    rootFile!!,
    {
      target: 'ES2017',
    },
    {
      format: 'es',
      name: 'bundle',
    }
  );

  return result;
}

export { buildTs };
