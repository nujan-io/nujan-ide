import { Tree } from '@/interfaces/workspace.interface';

function validateAndTransformPath(repoURL: string): string {
  const url = new URL(repoURL);
  const pathnameParts = url.pathname.split('/');

  if (pathnameParts.length >= 3) {
    if (pathnameParts[3] === 'tree' && pathnameParts.length >= 6) {
      // GitHub path with /tree, so transform it to API URL
      const apiUrl = `https://api.github.com/repos/${pathnameParts[1]}/${
        pathnameParts[2]
      }/contents/${pathnameParts.slice(5).join('/')}`;
      return apiUrl;
    } else {
      // GitHub path without /tree, so transform it to API URL with the default branch (e.g., main)
      const apiUrl = `https://api.github.com/repos/${pathnameParts[1]}/${
        pathnameParts[2]
      }/contents/${pathnameParts.slice(3).join('/')}`;
      return apiUrl;
    }
  }

  // Invalid path format
  throw new Error('Invalid GitHub path format. Please provide a valid path.');
}

// Function to convert GitHub API response to custom format
interface DataItem {
  type: 'file' | 'dir';
  name: string;
  sha: string;
  download_url?: string;
  url: string;
}

interface ResultItem {
  id: string;
  name: string;
  parent: string | null;
  type: 'file' | 'directory';
  path: string;
  content?: string;
  isOpen?: boolean;
}

async function convertToCustomFormat(
  data: DataItem[],
  parent: string | null = null,
  parentPath: string = '',
): Promise<ResultItem[]> {
  const result: ResultItem[] = [];

  for (const item of data) {
    if (item.type === 'file') {
      if (!item.download_url) continue;
      const response = await fetch(item.download_url);
      const content = await response.text();
      const fileName = parentPath ? parentPath + '/' + item.name : item.name;
      result.push({
        id: item.sha,
        name: item.name,
        parent: parent,
        type: 'file',
        path: fileName,
        content: content,
      });
    } else {
      const dirName = parentPath ? parentPath + '/' + item.name : item.name;
      result.push({
        id: item.sha,
        name: item.name,
        parent: parent,
        type: 'directory',
        isOpen: false,
        path: dirName,
      });

      // Fetch subdirectory contents and add them as siblings to the current directory
      const subDirContents = await getDirContents(item.url);
      const subDirItems = await convertToCustomFormat(
        subDirContents,
        item.sha,
        dirName,
      );
      result.push(...subDirItems);
    }
  }

  return result;
}

// Function to fetch directory contents from GitHub API
async function getDirContents(url: string) {
  const response = await fetch(url);
  return await response.json();
}

export async function downloadRepo(repoURL: string): Promise<Tree[]> {
  const apiUrl = validateAndTransformPath(repoURL);
  const data = await getDirContents(apiUrl);
  try {
    const jsonData = await convertToCustomFormat(data);
    return jsonData as Tree[];
  } catch (error) {
    if (error instanceof Error) {
      switch (error.message) {
        case 'data is not iterable':
          throw new Error('Repository not found.');
        default:
          throw new Error(error.message);
      }
    } else {
      throw new Error('An unexpected error occurred.');
    }
  }
}
