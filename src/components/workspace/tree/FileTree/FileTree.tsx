import { ProjectTemplate } from '@/constant/ProjectTemplate';
import {
  getBackendOptions,
  MultiBackend,
  Tree,
} from '@minoru/react-dnd-treeview';
import { FC, useState } from 'react';
import { DndProvider } from 'react-dnd';
import s from './FileTree.module.scss';
import TreeNode from './TreeNode';

const FileTree: FC = () => {
  const initialData = ProjectTemplate.tonBlank.func.map((item) => {
    return {
      id: item.id,
      parent: item.parent || 0,
      droppable: (item.type as any) === 'directory',
      text: item.title,
    };
  });

  const [treeData, setTreeData] = useState(initialData);
  const handleDrop = (newTreeData: any, options: any) => {
    // console.log('newTreeData', newTreeData, options);
    // setTreeData(newTreeData)
  };

  return (
    <div className={s.root}>
      <DndProvider backend={MultiBackend} options={getBackendOptions()}>
        <Tree
          tree={treeData}
          rootId={0}
          onDrop={handleDrop}
          render={(node, { depth, isOpen, onToggle }) => (
            <TreeNode
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
