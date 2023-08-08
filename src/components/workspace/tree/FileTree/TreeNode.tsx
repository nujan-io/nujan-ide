import { useAuthAction } from '@/hooks/auth.hooks';
import { useWorkspaceActions } from '@/hooks/workspace.hooks';
import { Project } from '@/interfaces/workspace.interface';
import { fileTypeFromFileName } from '@/utility/utils';
import { NodeModel } from '@minoru/react-dnd-treeview';
import cn from 'clsx';
import { useRouter } from 'next/router';
import { FC, useState } from 'react';
import s from './FileTree.module.scss';
import ItemAction from './ItemActions';
import TreePlaceholderInput from './TreePlaceholderInput';

interface Props {
  node: NodeModel;
  depth: number;
  isOpen: boolean;
  onToggle: (id: NodeModel['id']) => void;
  projectId: Project['id'];
}

const TreeNode: FC<Props> = ({ node, depth, isOpen, onToggle }) => {
  const { droppable } = node;
  const indent = depth * 15;

  const [isEditing, setIsEditing] = useState(false);
  const [newItemAdd, setNewItemAdd] = useState<string>('');

  const router = useRouter();
  const { id: projectId, tab } = router.query;

  const { openFile, renameItem, deleteItem, createNewItem, isProjectEditable } =
    useWorkspaceActions();
  const { user } = useAuthAction();

  const disallowedFile = [
    'message.cell.ts',
    'stateInit.cell.ts',
    'test.spec.js',
  ];

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle(node.id);
    if (!node.droppable) {
      openFile(node.id as string, projectId as string);
    }
  };

  const handleItemAction = () => {
    if (!isAllowed()) {
      return;
    }
    setIsEditing(true);
  };

  const commitEditing = (name: string) => {
    renameItem(node.id as string, name, projectId as string);
    reset();
  };

  const commitItemCreation = (name: string) => {
    createNewItem(node.id as string, name, newItemAdd, projectId as string);
    reset();
  };

  const reset = () => {
    document.body.classList.remove('editing-file-folder');
    setNewItemAdd('');
    setIsEditing(false);
  };

  const getAllowedActions = () => {
    if (disallowedFile.includes(node.text)) {
      return [];
    }
    if (node.droppable) {
      return ['Edit', 'NewFile', 'NewFolder', 'Close'];
    }
    return ['Edit', 'Close'];
  };

  const deleteItemFromNode = () => {
    deleteItem(node.id as string, projectId as string);
  };

  const isAllowed = () => {
    const isEditingItem = document.body.classList.contains(
      'editing-file-folder'
    );
    if (!isEditingItem) {
      document.body.classList.add('editing-file-folder');
      return true;
    }
    return false;
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
    <>
      <div
        className={rootClassName}
        style={{ paddingInlineStart: indent }}
        onClick={handleClick}
      >
        {!isEditing && (
          <div className={s.item}>
            <span>{node.text}</span>
            {isProjectEditable(projectId as string, user) && (
              <ItemAction
                className={s.actions}
                onRename={() => {
                  handleItemAction();
                }}
                allowedActions={getAllowedActions() as any}
                onNewFile={() => {
                  if (!isAllowed()) {
                    return;
                  }
                  setNewItemAdd('file');
                }}
                onNewDirectory={() => {
                  if (!isAllowed()) {
                    return;
                  }
                  setNewItemAdd('directory');
                }}
                onDelete={() => {
                  deleteItemFromNode();
                }}
              />
            )}
          </div>
        )}

        {isEditing && (
          <TreePlaceholderInput
            type={node.droppable ? 'directory' : 'file'}
            defaultValue={node.text}
            onSubmit={commitEditing}
            onCancel={reset}
          />
        )}
      </div>
      {newItemAdd && (
        <TreePlaceholderInput
          style={{ paddingInlineStart: 15 * (depth + 1) }}
          onSubmit={commitItemCreation}
          onCancel={reset}
          type={newItemAdd}
        />
      )}
    </>
  );
};

export default TreeNode;
