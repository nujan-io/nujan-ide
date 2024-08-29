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
import TreeNode from './TreeNode';

interface Props {
  projectId: string;
}

const FileTree: FC<Props> = ({ projectId }) => {
  const { projectFiles } = useProjects();

  const getProjectFiles = (): NodeModel[] => {
    return [...projectFiles].map((item) => {
      return {
        id: item.path,
        parent: item.parent ?? 0,
        droppable: item.type === 'directory',
        text: item.name,
      };
    });
  };

  const handleDrop = (_: unknown, _options: DropOptions) => {
    // workspaceAction.moveFile(
    //   options.dragSourceId as string,
    //   options.dropTargetId as string,
    //   projectId,
    // );
  };

  return (
    <div className={s.root}>
      <DndProvider backend={MultiBackend} options={getBackendOptions()}>
        <Tree
          tree={getProjectFiles()}
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
