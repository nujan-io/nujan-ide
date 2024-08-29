import { useProjects } from '@/hooks/projectV2.hooks';
import {
  DropOptions,
  getBackendOptions,
  MultiBackend,
  NodeModel,
  Tree,
} from '@minoru/react-dnd-treeview';
import { FC } from 'react';
import { DndProvider } from 'react-dnd';
import s from './FileTree.module.scss';
import TreeNode, { TreeNodeData } from './TreeNode';

interface Props {
  projectId: string;
}

const FileTree: FC<Props> = ({ projectId }) => {
  const { activeProject, projectFiles, moveItem } = useProjects();

  const getProjectFiles = (): NodeModel[] => {
    if (!activeProject) return [];
    return projectFiles.map((item) => {
      return {
        id: `${activeProject}/${item.path}`,
        parent: item.parent ? `${activeProject}/${item.parent}` : activeProject,
        droppable: item.type === 'directory',
        text: item.name,
        data: {
          path: item.path,
        },
      };
    });
  };

  const handleDrop = async (_: unknown, options: DropOptions) => {
    await moveItem(
      options.dragSourceId as string,
      options.dropTargetId as string,
    );
  };

  if (!activeProject) return null;

  return (
    <div className={s.root}>
      <DndProvider backend={MultiBackend} options={getBackendOptions()}>
        <Tree
          tree={getProjectFiles()}
          rootId={activeProject}
          onDrop={handleDrop}
          render={(node, { depth, isOpen, onToggle }) => (
            <TreeNode
              projectId={projectId as string}
              node={node as NodeModel<TreeNodeData>}
              depth={depth}
              isOpen={isOpen}
              onToggle={onToggle}
            />
          )}
        />
      </DndProvider>
    </div>
  );
};

export default FileTree;
