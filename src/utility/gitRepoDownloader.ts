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
async function convertToCustomFormat(
  data: any[],
  parent = null,
  parentPath = ''
) {
  const result = [];

  for (const item of data) {
    if (item.type === 'file') {
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
    } else if (item.type === 'dir') {
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
      const subDirItems: any[] = await convertToCustomFormat(
        subDirContents,
        item.sha,
        dirName
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
  } catch (error: any) {
    switch (error.message) {
      case 'data is not iterable':
        throw new Error('Repository not found.');
      default:
        throw new Error(error.message);
    }
  }
}
