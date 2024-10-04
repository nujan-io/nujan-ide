import GitManager from '@/lib/git';

self.onmessage = async (e) => {
  const gitManager = new GitManager();

  const { projectPath } = e.data.payload.data;
  switch (e.data.type) {
    case 'init': {
      try {
        console.log('Initializing repo projectPath', projectPath);
        await gitManager.init(projectPath);
        // as we cannot use EventEmitter here, we will post message to main thread
        self.postMessage({ type: 'GIT_INITIALIZED', projectPath });
      } catch (error) {
        console.log('error', error);
      }
      break;
    }

    case 'getFilesToCommit': {
      try {
        const files = await gitManager.getFileCollection(projectPath);
        // Post the list of files back to the main thread
        postMessage({ type: 'FILES_TO_COMMIT', payload: files });
      } catch (error) {
        postMessage({
          type: 'ERROR',
          message: 'Error getting files to commit',
          error,
        });
      }
      break;
    }

    case 'addFiles': {
      const { files } = e.data.payload.data;
      try {
        await gitManager.addFiles(files, projectPath);
        postMessage({ type: 'FILES_ADDED' });
      } catch (error) {
        postMessage({
          type: 'ERROR',
          message: 'Error adding files',
          error,
        });
      }
      break;
    }

    case 'unstageFile': {
      const { files } = e.data.payload.data;
      try {
        await gitManager.unstageFile(files, projectPath);
        postMessage({ type: 'FILE_UNSTAGED' });
      } catch (error) {
        postMessage({
          type: 'ERROR',
          message: 'Error unstaging file',
          error,
        });
      }
      break;
    }

    case 'commit': {
      const { message, author } = e.data.payload.data;
      try {
        await gitManager.commit(message, projectPath, author);
        postMessage({ type: 'COMMIT_COMPLETE' });
      } catch (error) {
        postMessage({
          type: 'ERROR',
          message: 'Error committing changes',
          error,
        });
      }
      break;
    }

    default:
      // Handle any cases that are not explicitly mentioned
      console.error('Unhandled message type:', e.data.type);
  }
};

self.onerror = (e) => {
  console.error('Worker error:', e);
};
