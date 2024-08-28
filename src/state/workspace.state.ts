import { WorkspaceState } from '@/interfaces/workspace.interface';
import { atom } from 'recoil';

import { recoilPersist } from 'recoil-persist';

const { persistAtom } = recoilPersist();

export const workspaceState = atom<WorkspaceState>({
  key: 'workspaceState',
  default: {
    openFiles: {},
    projectFiles: null,
    projects: [],
    activeProject: null,
  },
  effects_UNSTABLE: [persistAtom],
});
