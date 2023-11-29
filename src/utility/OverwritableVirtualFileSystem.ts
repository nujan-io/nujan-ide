import { VirtualFileSystem } from '@tact-lang/compiler';

export class OverwritableVirtualFileSystem implements VirtualFileSystem {
  root: string;
  overwrites: Map<string, Buffer> = new Map();
  projectFiles: { [key: string]: string };

  constructor(files: { [key: string]: string }) {
    this.root = '/';
    this.projectFiles = files;
  }

  resolve(...path: string[]): string {
    const _path = this.root + path.join('/').replace('./', '');
    return this.normalize(_path);
  }

  exists(_path: string): boolean {
    let path = this.normalize(_path);

    if (typeof this.overwrites.get(path) === 'string') {
      return true;
    } else if (typeof this.projectFiles[path] === 'string') {
      return true;
    }
    return false;
  }

  readFile(_path: string): any {
    let path = this.normalize(_path);

    if (this.overwrites.get(path)) {
      return this.overwrites.get(path)
        ? Buffer.from(this.projectFiles[path], 'utf-8')
        : Buffer.from('');
    }
    return this.projectFiles[path];
  }

  writeFile(path: string, content: string | Buffer): void {
    this.overwrites.set(
      path,
      typeof content === 'string' ? Buffer.from(content, 'utf-8') : content
    );
  }

  normalize(path: string): string {
    // TODO: Was getting base file path also in beginning. so added this hack. Need to resolve in future
    let pathArray = path.split('/');

    const tactIndex = pathArray.findIndex((item) => item.endsWith('.tact'));

    // Check if '.tact' is found and it's not the last element
    if (tactIndex !== -1 && tactIndex < pathArray.length - 1) {
      pathArray.splice(0, 1);
    }

    let newPath = pathArray.join('/');
    newPath = newPath.startsWith('.') ? newPath.replace('.', '/') : newPath;

    return newPath;
  }
}
