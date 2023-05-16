import { ProjectTemplate as ProjectTemplateData } from '@/constant/ProjectTemplate';
import { ProjectTemplate, Tree } from '@/interfaces/workspace.interface';
import { FileInterface } from '@/utility/fileSystem';
import { BlobReader, TextWriter, ZipReader } from '@zip.js/zip.js';
import { RcFile } from 'antd/es/upload';
import cloneDeep from 'lodash.clonedeep';
import { v4 as uuidv4 } from 'uuid';
import { useWorkspaceActions } from './workspace.hooks';

export function useProjectActions() {
  const { createNewProject, projects, addFilesToDatabase } =
    useWorkspaceActions();

  return {
    createProject,
  };

  async function createProject(
    name: string,
    template: ProjectTemplate,
    file: RcFile | null
  ) {
    const { files, filesWithId } =
      template === 'import'
        ? await importUserFile(file as RcFile)
        : createTemplateBasedProject(template);

    addFilesToDatabase(filesWithId);
    const projectId = uuidv4();
    const project = {
      id: projectId,
      name: name,
      template: template,
    };

    createNewProject({ ...project }, files);
  }
}

const createTemplateBasedProject = (template: 'tonBlank' | 'tonCounter') => {
  let files: Tree[] = cloneDeep(ProjectTemplateData[template])['func'];
  const filesWithId: FileInterface[] = [];

  files = files.map((file) => {
    if (file.type !== 'file') {
      return file;
    }
    const fileId = uuidv4();
    filesWithId.push({ id: fileId, content: file.content || '' });
    return {
      ...file,
      id: fileId,
      content: '',
    };
  });
  return { files, filesWithId };
};

const importUserFile = async (file: RcFile) => {
  const sysrootArchiveReader = new ZipReader(new BlobReader(file));
  const sysrootArchiveEntries = await sysrootArchiveReader.getEntries();
  const filesToSkip = [
    '._.DS_Store',
    '.DS_Store',
    'node_modules',
    'build',
    '.git',
    '.zip',
  ];
  const files: Tree[] = [];

  const fileDirectoryMap: { [key: string]: string } = {};
  // for storing file in indexed DB
  const filesWithId: FileInterface[] = [];
  for (const entry of sysrootArchiveEntries) {
    if (filesToSkip.some((file) => entry.filename.includes(file))) {
      continue;
    }
    const filePath = entry.filename;
    const pathParts = filePath.split('/');
    const fileName = pathParts[pathParts.length - 1];
    let fileDirectory = pathParts.slice(0, pathParts.length - 1).join('/');
    const currentDirectory = fileDirectory.split('/').slice(-1)[0];
    let parentDirectory = '';
    let fileContent = '';

    if (entry.directory) {
      parentDirectory = fileDirectory.split('/').slice(0, -1).join('/');
    }

    const fileId = uuidv4();

    const currentFile: Tree = {
      id: fileId,
      name: entry.directory ? currentDirectory : fileName,
      type: entry.directory ? 'directory' : 'file',
      parent: null,
      path: filePath.replace(/^\/|\/$/g, ''), // remove last slash
    };

    currentFile.parent =
      fileDirectoryMap[fileDirectory] || fileDirectoryMap[parentDirectory];

    if (entry.directory && fileDirectory) {
      fileDirectoryMap[fileDirectory] = fileId;
    }

    if (!entry.directory) {
      fileContent = await entry.getData!(new TextWriter());
    }

    filesWithId.push({ id: fileId, content: fileContent });
    files.push(currentFile);
  }
  return { files, filesWithId };
};
