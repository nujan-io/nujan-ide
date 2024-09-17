import FS, { PromisifiedFS } from '@isomorphic-git/lightning-fs';

class FileSystem {
  private fs: PromisifiedFS;
  constructor(fs: PromisifiedFS) {
    this.fs = fs;
  }

  async readFile(path: string) {
    if (!(await this.exists(path))) {
      throw new Error(`File not found: ${path}`);
    }
    return this.fs.readFile(path, 'utf8');
  }

  /**
   * Writes a file to the filesystem, ensuring the directory structure exists.
   *
   * @param path - The path where the file should be written, including the directory structure.
   * @param data - The content to be written to the file. Can be a string or Uint8Array.
   * @returns A promise that resolves once the file has been written.
   */
  async writeFile(
    path: string,
    data: string | Uint8Array,
    options?: { overwrite?: boolean },
  ) {
    const { overwrite } = options ?? {};
    const finalPath = overwrite ? path : await this.getUniquePath(path);
    await this.ensureDirectoryExists(finalPath);
    return this.fs.writeFile(finalPath, data);
  }

  /**
   * Ensures that the directory structure for a given file path exists.
   * Creates any missing directories in the path.
   *
   * @param filePath - The full file path, including the directory structure.
   * @returns A promise that resolves once the directory structure is ensured.
   */
  async ensureDirectoryExists(filePath: string) {
    const dirname = filePath.substring(0, filePath.lastIndexOf('/'));
    if (!dirname) return;

    try {
      await this.fs.mkdir(dirname);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      if (error.code === 'EEXIST') {
        // Directory already exists, no need to do anything
      } else if (error.code === 'ENOENT') {
        // Parent directory does not exist, create it recursively
        await this.ensureDirectoryExists(dirname);
        await this.fs.mkdir(dirname);
      } else {
        throw error;
      }
    }
  }

  /**
   * Read the contents of a directory
   * @param path
   * @param options
   * @returns string[]
   */
  async readdir(
    path: string,
    options: { recursive?: boolean; basePath?: string; onlyDir?: boolean } = {},
  ) {
    if (!path) return [];
    const { recursive, basePath, onlyDir } = options;
    if (!recursive) {
      const files = await this.fs.readdir(path);
      if (!onlyDir) return files;
      const results: string[] = [];
      for (const file of files) {
        const stat = await this.fs.stat(`${path}/${file}`);
        if (stat.isDirectory()) {
          results.push(file);
        }
      }
      return results;
    }
    let results: string[] = [];
    const files = await this.readdir(path);
    for (const file of files) {
      const filePath = `${path}/${file}`;
      const stat = await this.stat(filePath);
      if (stat.isDirectory()) {
        const nestedFiles = await this.readdir(filePath, {
          recursive,
          basePath,
          onlyDir,
        });
        results = results.concat(nestedFiles);
      } else {
        // Remove the rootPath from the file path
        results.push(filePath.replace(basePath + '/', ''));
      }
    }
    return results;
  }

  async mkdir(
    path: string,
    options: { overwrite?: boolean } = { overwrite: true },
  ) {
    if (!path) return;
    const newPath = options.overwrite
      ? path
      : await this.getUniquePath(path, true);
    await this.fs.mkdir(newPath);
    return newPath;
  }

  async create(path: string, type: 'file' | 'directory') {
    if (await this.exists(path)) {
      const name = path.substring(path.lastIndexOf('/') + 1);
      throw new Error(
        `File or folder already exists with the same name: ${name}`,
      );
    }
    if (type === 'file') {
      return this.writeFile(path, '');
    }
    return this.mkdir(path);
  }

  async rmdir(path: string, options: { recursive?: boolean } = {}) {
    if (!options.recursive) {
      return this.fs.rmdir(path);
    }

    const entries = await this.fs.readdir(path);

    for (const entry of entries) {
      const fullPath = `${path}/${entry}`;
      const stat = await this.fs.stat(fullPath);

      if (stat.isDirectory()) {
        // If the entry is a directory, recursively delete its contents
        await this.rmdir(fullPath, { recursive: true });
      } else {
        // If the entry is a file, delete it
        await this.fs.unlink(fullPath);
      }
    }

    // Once all the contents are deleted, remove the directory itself
    return this.fs.rmdir(path);
  }

  async unlink(path: string) {
    return this.fs.unlink(path);
  }

  async exists(path: string) {
    try {
      await this.fs.stat(path);
      return true;
    } catch (e) {
      return false;
    }
  }

  async stat(path: string) {
    return this.fs.stat(path);
  }

  async rename(oldPath: string, newPath: string) {
    if (oldPath === newPath) return false;
    if (await this.exists(newPath)) {
      throw new Error(`File or folder already exists with the same name`);
    }
    await this.fs.rename(oldPath, newPath);
    return true;
  }

  async copy(oldPath: string, newPath: string) {
    const data = await this.readFile(oldPath);
    await this.writeFile(newPath, data);
  }

  async copyDir(oldPath: string, newPath: string) {
    await this.mkdir(newPath);
    const files = await this.readdir(oldPath);
    for (const file of files) {
      const oldFilePath = `${oldPath}/${file}`;
      const newFilePath = `${newPath}/${file}`;
      const stat = await this.stat(oldFilePath);
      if (stat.isDirectory()) {
        await this.copyDir(oldFilePath, newFilePath);
      } else {
        await this.copy(oldFilePath, newFilePath);
      }
    }
  }

  async remove(path: string, options: { recursive?: boolean } = {}) {
    const stat = await this.stat(path);
    if (stat.isDirectory()) {
      if (options.recursive) {
        await this.removeDir(path);
        return;
      }
      await this.rmdir(path);
    } else {
      await this.unlink(path);
    }
  }

  private async removeDir(path: string) {
    const files = await this.readdir(path);
    for (const file of files) {
      const filePath = `${path}/${file}`;
      const stat = await this.stat(filePath);
      if (stat.isDirectory()) {
        await this.removeDir(filePath);
      } else {
        await this.unlink(filePath);
      }
    }
    await this.rmdir(path);
  }

  async du(path = '/') {
    return this.fs.du(path);
  }

  // Generate a unique path if the file/directory already exists
  private async getUniquePath(
    path: string,
    isDirectory = false,
  ): Promise<string> {
    let newPath = path;
    let counter = 1;
    while (await this.exists(newPath)) {
      const extension = isDirectory ? '' : this.getExtension(path);
      const baseName = this.getBaseName(path, extension);
      newPath = `${baseName}(${counter})${extension}`;
      counter++;
    }
    return newPath;
  }

  private getExtension(path: string): string {
    const dotIndex = path.lastIndexOf('.');
    return dotIndex !== -1 ? path.substring(dotIndex) : '';
  }

  private getBaseName(path: string, extension: string): string {
    return extension ? path.substring(0, path.length - extension.length) : path;
  }
}

const fileSystem = new FileSystem(new FS('IDE_FS').promises);
Object.freeze(fileSystem);
export default fileSystem;
export type { FileSystem };
