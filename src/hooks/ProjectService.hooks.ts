import { Project, Tree } from '@/interfaces/workspace.interface';
import { Wallet } from '@tonconnect/sdk';
import { AxiosResponse } from 'axios';
import { useApiClient } from './ApiClient.hooks';

export { useProjectServiceActions };

function useProjectServiceActions() {
  const ApiClient = useApiClient();

  return {
    createProject,
    cloneProject,
    updateProject,
    listProjects,
    listFiles,
    updateFile,
    deleteFile,
    createFile,
    verifyTonProof,
  };

  async function createProject(data: Partial<Project>): Promise<AxiosResponse> {
    return ApiClient.post(`/api/project`, data);
  }

  async function cloneProject(
    projectId: Project['id']
  ): Promise<AxiosResponse> {
    return ApiClient.post(`/api/project`, {
      projectId,
      action: 'clone-project',
    });
  }

  async function updateProject(data: Partial<Project>): Promise<AxiosResponse> {
    return ApiClient.post(`/api/project`, data);
  }

  async function listProjects(): Promise<AxiosResponse> {
    return ApiClient.post(`/api/project`, { action: 'list-projects' });
  }

  async function listFiles(projectId: Project['id']): Promise<AxiosResponse> {
    return ApiClient.post(`/api/file`, { projectId, action: 'list-files' });
  }

  async function createFile(data: Partial<Tree>): Promise<AxiosResponse> {
    return ApiClient.post(`/api/file`, { ...data, action: 'create-file' });
  }

  async function updateFile(data: Partial<Tree>): Promise<AxiosResponse> {
    return ApiClient.post(`/api/file`, { ...data, action: 'update-file' });
  }

  async function deleteFile(data: Partial<Tree>): Promise<AxiosResponse> {
    return ApiClient.post(`/api/file`, { ...data, action: 'delete-file' });
  }

  async function verifyTonProof(data: Partial<Wallet>): Promise<AxiosResponse> {
    return ApiClient.post(`/api/ton-proof`, {
      data,
      action: 'verify-proof',
    });
  }
}
