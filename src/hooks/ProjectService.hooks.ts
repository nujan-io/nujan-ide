import { Project, Tree } from '@/interfaces/workspace.interface';
import { AxiosResponse } from 'axios';
import { useApiClient } from './ApiClient.hooks';

export { useProjectServiceActions };

function useProjectServiceActions() {
  const ApiClient = useApiClient();

  return {
    createProject,
    updateProject,
    listProjects,
    updateFile,
    deleteFile,
  };

  async function createProject(data: Partial<Project>): Promise<AxiosResponse> {
    return ApiClient.post(`/api/project`, data);
  }

  async function updateProject(data: Partial<Project>): Promise<AxiosResponse> {
    return ApiClient.post(`/api/project`, data);
  }

  async function listProjects(): Promise<AxiosResponse> {
    return ApiClient.post(`/api/project`, { action: 'list-projects' });
  }

  async function updateFile(data: Partial<Tree>): Promise<AxiosResponse> {
    return ApiClient.post(`/api/file`, { ...data, action: 'update-file' });
  }

  async function deleteFile(data: Partial<Tree>): Promise<AxiosResponse> {
    return ApiClient.post(`/api/file`, { ...data, action: 'delete-file' });
  }
}
