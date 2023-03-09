import { useWorkspaceActions } from '@/hooks/workspace.hooks';
import { fileTypeFromFileName } from '@/utility/utils';
import { NodeModel } from '@minoru/react-dnd-treeview';
import cn from 'clsx';
import { useRouter } from 'next/router';
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

  const router = useRouter();
  const { id: projectId, tab } = router.query;

  const { openFile } = useWorkspaceActions();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle(node.id);
    if (!node.droppable) {
      openFile(node.id as string, projectId as string);
    }
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
      onClick={handleClick}
    >
      <span>{node.text}</span>
    </div>
  );
};

export default TreeNode;
