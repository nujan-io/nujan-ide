import { VirtualFileSystem } from '@tact-lang/compiler';

import { Buffer } from 'buffer';

export class OverwritableVirtualFileSystem implements VirtualFileSystem {
  root: string;
  overwrites: Map<string, Buffer> = new Map(); // It will be used to store build output files
  files: Map<string, Buffer> = new Map(); // Simulate a file system

  constructor(root: string = '/') {
    this.root = this.normalizePath(root);
  }

  private normalizePath(path: string): string {
    // Ensure there is no trailing slash and replace backslashes with forward slashes
    return path.replace(/\\/g, '/').replace(/\/+$/, '');
  }

  private resolvePath(...pathSegments: string[]): string {
    const pathParts = this.root.split('/');
    for (const segment of pathSegments) {
      const normalizedSegment = this.normalizePath(segment);
      const parts = normalizedSegment.split('/');

      for (const part of parts) {
        if (part === '..') {
          // Go up one directory level
          if (pathParts.length > 0) {
            pathParts.pop();
          }
        } else if (part !== '.' && part !== '') {
          // Navigate down to the directory
          pathParts.push(part);
        }
        // Ignore '.' and empty segments as they represent the current directory
      }
    }
    return pathParts.join('/');
  }

  resolve(...path: string[]): string {
    return this.resolvePath(...path);
  }

  exists(path: string): boolean {
    const resolvedPath = this.resolvePath(path);
    return this.files.has(resolvedPath) || this.overwrites.has(resolvedPath);
  }

  readFile(path: string): Buffer {
    const resolvedPath = this.resolvePath(path);

    return (
      this.overwrites.get(resolvedPath) ??
      this.files.get(resolvedPath) ??
      Buffer.from('')
    );
  }

  writeContractFile(path: string, content: string | Buffer): void {
    const resolvedPath = this.resolvePath(path);
    const bufferContent =
      typeof content === 'string' ? Buffer.from(content, 'utf-8') : content;
    this.files.set(resolvedPath, bufferContent);
  }

  writeFile(path: string, content: string | Buffer): void {
    const resolvedPath = this.resolvePath(path);
    const bufferContent =
      typeof content === 'string' ? Buffer.from(content, 'utf-8') : content;
    this.overwrites.set(resolvedPath, bufferContent);
  }
}
