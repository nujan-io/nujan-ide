import { useWorkspaceActions } from '@/hooks/workspace.hooks';
import {
  getBackendOptions,
  MultiBackend,
  NodeModel,
  Tree,
} from '@minoru/react-dnd-treeview';
import { FC } from 'react';
import { DndProvider } from 'react-dnd';
import s from './FileTree.module.scss';
import TreeNode from './TreeNode';

interface Props {
  projectId: string;
}

const FileTree: FC<Props> = ({ projectId }) => {
  const workspaceAction = useWorkspaceActions();

  const projectFiles = (): NodeModel[] => {
    return workspaceAction.projectFiles(projectId).map((item) => {
      return {
        id: item.id,
        parent: item.parent || 0,
        droppable: (item.type as any) === 'directory',
        text: item.name,
      };
    });
  };
  const handleDrop = (newTreeData: any, options: any) => {
    // console.log('newTreeData', newTreeData, options);
    // setTreeData(newTreeData)
  };

  return (
    <div className={s.root}>
      <DndProvider backend={MultiBackend} options={getBackendOptions()}>
        <Tree
          tree={projectFiles()}
          rootId={0}
          onDrop={handleDrop}
          render={(node, { depth, isOpen, onToggle }) => (
            <TreeNode
              projectId={projectId as string}
              node={node}
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
