import { PromisifiedFS } from '@isomorphic-git/lightning-fs';
import git from 'isomorphic-git';
import fileSystem from './fs';

class GitManager {
  private fs: PromisifiedFS;

  constructor() {
    this.fs = fileSystem.fsInstance;
  }

  async init(dest: string) {
    await git.init({ fs: this.fs, dir: dest, defaultBranch: 'main' });
  }

  async isInitialized(dest: string) {
    // It only checks if .git/HEAD file exists. It doesn't check if the repo has any commits
    try {
      await this.fs.readFile(`${dest}/.git/HEAD`, 'utf8');
      return true;
    } catch (error) {
      return false;
    }
  }

  async addFiles(files: { path: string }[], dest: string) {
    for (const file of files) {
      // TODO: check if git.writeBlob is necessary
      await git.add({
        fs: this.fs,
        dir: dest,
        filepath: file.path,
      });
    }
  }

  async unstageFile(files: { path: string }[], dest: string) {
    for (const file of files) {
      await git.remove({
        fs: this.fs,
        dir: dest,
        filepath: file.path,
      });
    }
    // console.log(
    //   'unstaged',
    //   await git.status({ fs: this.fs, dir: dest, filepath: file }),
    // );
  }

  async commit(
    message: string,
    dest: string,
    author: { name: string; email: string },
  ) {
    const sha = await git.commit({
      fs: this.fs,
      dir: dest,
      message,
      author,
    });
    console.log('commit sha', sha);
  }

  async log(dest: string) {
    const commits = await git.log({ fs: this.fs, dir: dest });
    console.log('commits', commits);
  }

  async status(dest: string, filepath: string) {
    const status = await git.status({ fs: this.fs, dir: dest, filepath });
    console.log('status', status);
  }

  async addRemote(repo: string, dest: string) {
    await git.addRemote({
      fs: this.fs,
      dir: dest,
      remote: 'origin',
      url: repo,
    });
  }

  async getFileCollection(
    dest: string,
  ): Promise<Array<{ path: string; status: string; staged: boolean }>> {
    try {
      const statusMatrix = await git.statusMatrix({ fs: this.fs, dir: dest });
      type Status = 0 | 1 | 2;

      // Map over the status matrix to get the status for each file
      const filesWithStatus = statusMatrix.map(
        ([filePath, workDirStatus, stageStatus, headStatus]) => {
          let status = '';
          let isStaged = false;

          // TypeScript expects workDirStatus and others to be '0 | 1' in some cases, so we assert it as 'Status' (0 | 1 | 2)
          const workDir = workDirStatus as Status;
          const stage = stageStatus as Status;
          const head = headStatus as Status;

          // Determine status based on workDir, stage, and head
          if (workDir === 2 && stage === 0 && head === 0) {
            status = 'U'; // Untracked file
          } else if (workDir === 2 && stage === 0 && head === 1) {
            status = 'M'; // Modified but not staged
          } else if (workDir === 2 && stage === 2 && head === 1) {
            status = 'M'; // Modified and staged
            // isStaged = true;
          } else if (workDir === 0 && stage === 2 && head === 0) {
            status = 'A'; // Added (new file staged but not yet committed)
            // isStaged = true;
          } else if (workDir === 0 && stage === 0 && head === 1) {
            status = 'D'; // Deleted (file deleted but not staged)
          } else if (workDir === 0 && stage === 2 && head === 1) {
            status = 'D'; // Deleted and staged
            // isStaged = true;
          }
          if (head === 2) {
            isStaged = true;
          }

          return { path: filePath, status, staged: isStaged };
        },
      );

      return filesWithStatus;
    } catch (error) {
      console.error('Error getting files to commit:', error);
      throw error;
    }
  }

  // async clone(repo, dest) {
  // }

  // async pull(repo, dest) {
  // }
}

export default GitManager;
