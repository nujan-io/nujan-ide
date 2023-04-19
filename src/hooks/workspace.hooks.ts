import { AuthInterface } from '@/interfaces/auth.interface';
import { Project, Tree } from '@/interfaces/workspace.interface';
import { workspaceState } from '@/state/workspace.state';
import { fileSystem } from '@/utility/fileSystem';
import { notification } from 'antd';
import cloneDeep from 'lodash.clonedeep';
import { useRecoilState } from 'recoil';
import { v4 } from 'uuid';
export { useWorkspaceActions };

function useWorkspaceActions() {
  const [workspace, updateWorkspace] = useRecoilState(workspaceState);

  return {
    createNewProject,
    deleteProject,
    setProjects,
    projects,
    project,
    projectFiles,
    updateProjectFiles,
    openFile,
    renameItem,
    deleteItem,
    createNewItem,
    openedFiles,
    activeFile,
    getFileById,
    getFileContent,
    getFileByPath,
    closeFile,
    updateFileContent,
    updateProjectById,
    closeAllFile,
    isProjectEditable,
    clearWorkSpace,
  };

  function updateStateByKey(dataByKey: any) {
    updateWorkspace((oldState) => {
      return {
        ...oldState,
        ...(dataByKey as any),
      };
    });
  }

  function createNewProject(project: Project, template: Tree[]) {
    if (projects().findIndex((p) => p.name == project.name) >= 0) {
      throw 'Project with the same already exists';
    }
    updateStateByKey({
      projects: [...workspace.projects, project],
      projectFiles: { ...workspace.projectFiles, [project.id]: template },
    });
  }

  async function deleteProject(projectId: string) {
    const projectIndex = projects().findIndex((item) => item.id === projectId);
    if (projectIndex < 0) {
      return;
    }
    const _projectFiles = cloneDeep(workspace.projectFiles);

    if (_projectFiles && _projectFiles[projectId]) {
      const fileIds = _projectFiles[projectId].map((item) => item.id);
      await fileSystem.files.bulkDelete(fileIds);
      delete _projectFiles[projectId];
    }
    const projectList = [...workspace.projects];
    projectList.splice(projectIndex, 1);
    updateStateByKey({
      projects: projectList,
      projectFiles: _projectFiles,
    });
  }

  function setProjects(projects: Project[]) {
    updateStateByKey({
      projects,
    });
  }

  function updateProjectList(
    projectId: string,
    projectListItem: Project | any
  ) {
    const projectIndex = projects().findIndex((item) => item.id === projectId);
    if (projectIndex < 0) {
      return;
    }
    const projectList = [...workspace.projects];
    projectList[projectIndex] = {
      ...projectList[projectIndex],
      ...projectListItem,
    };
    updateStateByKey({
      projects: projectList,
    });
  }

  function projects() {
    return workspace.projects || [];
  }

  function project(projectId: string) {
    return projects().find((p) => p.id === projectId);
  }

  function projectFiles(projectId: string) {
    return workspace?.projectFiles?.[projectId] || [];
  }

  function updateProjectFiles(project: Tree[], projectId: string) {
    updateStateByKey({
      projectFiles: { ...workspace.projectFiles, [projectId]: project },
    });
  }

  function getFile(id: Tree['id'], projectId: string) {
    return projectFiles(projectId)?.find((item) => item.id == id);
  }

  function openFile(id: Tree['id'], projectId: string) {
    const openFiles = openedFiles().map((item) => {
      return {
        ...item,
        isOpen: false,
      };
    });

    const currentFile = getFile(id, projectId);
    if (!currentFile) {
      return;
    }

    const isAlreadyOpend = openFiles.find((item) => item.id === id);
    if (isAlreadyOpend) {
      isAlreadyOpend.isOpen = true;
    } else {
      const fileData = {
        id: currentFile?.id,
        name: currentFile?.name,
      };
      openFiles.push({ ...((fileData as any) || {}), isOpen: true });
    }
    updateStateByKey({ openFiles });
  }

  function onFileRename(fileId: Tree['id'], name: string) {
    let files = cloneDeep(openedFiles());
    if (!files) return;
    const fileToChange = files.find((item) => item.id === fileId);
    if (!fileToChange) return;
    fileToChange.name = name;
    updateStateByKey({ openFiles: files });
  }

  function openedFiles() {
    return workspace.openFiles;
  }

  function activeFile(projectId: string) {
    const file = openedFiles().find((item) => item.isOpen);
    if (!file) {
      return undefined;
    }
    return file;
  }

  async function getFileById(
    id: Tree['id'],
    projectId: string
  ): Promise<Tree | undefined> {
    const file = projectFiles(projectId).find((file) => file.id === id);
    const fileContent = await getFileContent(id);
    return { ...file, content: fileContent } as Tree | undefined;
  }

  async function getFileContent(id: Tree['id']) {
    if (!id) return '';
    const fileContent = await fileSystem.files.get(id);
    return fileContent?.content || '';
  }

  async function getFileByPath(
    path: Tree['path'],
    projectId: string
  ): Promise<Tree | undefined> {
    const file = projectFiles(projectId).find((file) => file.path === path);
    if (!file) {
      return undefined;
    }
    const fileContent = await fileSystem.files.get(file.id);
    return { ...file, content: fileContent?.content };
  }

  function updateFileContent(id: Tree['id'], content: string) {
    fileSystem.files.update(id, { content });
  }

  async function updateProjectById(updateObject: any, projectId: string) {
    updateProjectList(projectId, {
      ...project(projectId),
      ...updateObject,
    });
  }

  function closeFile(id: string) {
    let openFiles = workspace.openFiles.filter((item) => item.id !== id);
    openFiles = openFiles.map((item) => {
      return {
        ...item,
        isOpen: false,
      };
    });
    if (openFiles.length > 0) {
      openFiles[openFiles.length - 1].isOpen = true;
    }
    updateStateByKey({ openFiles });
  }

  function closeAllFile() {
    updateStateByKey({ openFiles: [] });
  }

  function renameItem(id: string, name: string, projectId: string) {
    const item = searchNode(id, projectId);
    if (!item.node) {
      return;
    }

    if (isFileExists(name, projectId, item.node.parent || '')) {
      return;
    }
    item.node.name = name;
    let newPath = name;
    let pathArray: any = item.node.path?.split('/');
    if (pathArray && pathArray?.length > 1) {
      pathArray = pathArray?.pop() || [];
      newPath = pathArray.toString() + '/' + name;
    }
    item.node.path = newPath;
    updateProjectFiles(item.project, projectId);
    onFileRename(id, name);
  }

  function deleteItem(id: Tree['id'], projectId: string) {
    const item = searchNode(id, projectId);
    if (!item.node) {
      return;
    }

    item.project = item.project.filter(
      (file: any) => file.id !== id && file.parent !== id
    );

    closeFile(id);
    updateProjectFiles(item.project, projectId);
  }

  async function createNewItem(
    id: Tree['parent'] | '',
    name: string,
    type: string,
    projectId: string
  ) {
    const item = searchNode(id as string, projectId, 'parent');
    if (isFileExists(name, projectId, item.node?.parent || '')) {
      return;
    }

    const newItem = _createItem(
      type,
      name,
      id as string,
      item.node?.path || ''
    );
    if (type === 'file') {
      await fileSystem.files.add({ id: newItem.id, content: '' });
    }
    item.project.push(newItem);
    updateProjectFiles(item.project, projectId);
  }

  function isFileExists(
    name: string,
    projectId: string,
    parentId: string = ''
  ): boolean {
    let exists = false;
    if (!parentId) {
      exists = !!(
        projectFiles(projectId).findIndex(
          (file) => file.parent == null && file.name === name
        ) >= 0
      );
    } else {
      exists =
        projectFiles(projectId).findIndex(
          (file) => file.parent === parentId && file.name === name
        ) >= 0;
    }
    if (exists) {
      notification.warning({
        message: name + ': Already exists',
        key: name + 'exists',
      });
    }

    return exists;
  }

  function searchNode(
    id: string,
    projectId: string,
    key: 'id' | 'parent' = 'id'
  ): { node: Tree | null; project: Tree[] } {
    let projectTemp = cloneDeep(projectFiles(projectId));
    const node = projectTemp.find((file) => file[key] === id);

    return { node: node || null, project: projectTemp };
  }

  function _createItem(
    type: string,
    name: string,
    parent: string,
    parentPath: string
  ) {
    return {
      id: v4(),
      name,
      parent: parent || null,
      type: type as any,
      content: '',
      path: `${parentPath ? parentPath + '/' : ''}${name}`,
    };
  }

  function isProjectEditable(projectId: Project['id'], user: AuthInterface) {
    // const _project = project(projectId);
    // return !!(user.token && user?.id == _project?.userId);
    return true;
  }

  function clearWorkSpace() {
    updateStateByKey({ openFiles: [], projectFiles: null, projects: [] });
  }
}
