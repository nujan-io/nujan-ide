import { Project } from '@/interfaces/workspace.interface';
import { AxiosResponse } from 'axios';
import { useApiClient } from './ApiClient.hooks';

export { useProjectServiceActions };

function useProjectServiceActions() {
  const ApiClient = useApiClient();

  return {
    createProject,
    updateProject,
  };

  async function createProject(data: Partial<Project>): Promise<AxiosResponse> {
    return ApiClient.post(`/api/project`, data);
  }

  async function updateProject(data: Partial<Project>): Promise<AxiosResponse> {
    return ApiClient.post(`/api/project`, data);
  }
}
