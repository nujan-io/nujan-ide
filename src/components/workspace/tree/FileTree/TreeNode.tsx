import { fileTypeFromFileName } from '@/utility/utils';
import { NodeModel } from '@minoru/react-dnd-treeview';
import cn from 'clsx';
import { FC } from 'react';
import s from './FileTree.module.scss';

interface Props {
  node: NodeModel;
  depth: number;
  isOpen: boolean;
  onToggle: (id: NodeModel['id']) => void;
}

const TreeNode: FC<Props> = ({ node, depth, isOpen, onToggle }) => {
  const { droppable } = node;
  const indent = depth * 15;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle(node.id);
  };

  const rootClassName = cn(s.treeNode, {
    [s.isOpen]: isOpen,
    'folder-name monaco-icon-label': true,
    'file-icon': !droppable,
    'folder-icon': droppable,
    'folder-icon-open': droppable && isOpen,
    [`${node.text.split('.').pop()}-lang-file-icon`]: !droppable,
    [`${fileTypeFromFileName(node.text)}-lang-file-icon`]: !droppable,
  });

  return (
    <div
      className={rootClassName}
      style={{ paddingInlineStart: indent }}
      onClick={handleToggle}
    >
      <span>{node.text}</span>
    </div>
  );
};

export default TreeNode;
