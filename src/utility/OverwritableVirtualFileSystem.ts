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
    return path.join('/').replace('./', '');
  }

  exists(path: string): boolean {
    return typeof this.overwrites.get(path) === 'string';
  }

  readFile(path: string): Buffer {
    return (
      this.overwrites.get(path) ?? Buffer.from(this.projectFiles[path], 'utf-8')
    );
  }

  writeFile(path: string, content: string | Buffer): void {
    this.overwrites.set(
      path,
      typeof content === 'string' ? Buffer.from(content, 'utf-8') : content
    );
  }
}
