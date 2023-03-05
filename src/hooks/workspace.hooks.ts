import { Project, Tree } from '@/interfaces/workspace.interface';
import { workspaceState } from '@/state/workspace.state';
import { useRecoilState } from 'recoil';

export { useWorkspaceActions };

function useWorkspaceActions() {
  const [workspace, updateWorkspace] = useRecoilState(workspaceState);

  return {
    createNewProject,
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
    updateStateByKey({
      projects: [...workspace.projects, project],
      projectFiles: { ...workspace.projectFiles, [project.id]: template },
    });
  }
}
