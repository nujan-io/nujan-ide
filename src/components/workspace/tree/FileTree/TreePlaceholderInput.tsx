import cn from 'clsx';
import { FC, useEffect, useRef, useState } from 'react';
import s from './FileTree.module.scss';

interface Props {
  type: 'directory' | 'file';
  onSubmit?: (value: string) => void;
  onCancel?: () => void;
  defaultValue?: string;
  style?: React.CSSProperties;
}

const TreePlaceholderInput: FC<Props> = ({
  type,
  onSubmit,
  onCancel,
  defaultValue,
  style,
}) => {
  const [ext, setExt] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!inputRef.current) return;

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        if (inputRef.current?.value) {
          if (onSubmit) {
            onSubmit(inputRef.current.value);
          }
          return;
        }
        if (onCancel) {
          onCancel();
        }
      }
      if (e.key === 'Escape') {
        if (onCancel) {
          onCancel();
        }
      }
    };

    const currentInputRef = inputRef.current;
    currentInputRef.focus();
    currentInputRef.addEventListener('keyup', handleKeyUp);

    return () => {
      currentInputRef.removeEventListener('keyup', handleKeyUp);
    };
  }, [inputRef, onSubmit, onCancel]);

  const updateExt = (e: React.ChangeEvent<HTMLInputElement>) => {
    const splitted = e.target.value.split('.');
    const ext = splitted[splitted.length - 1];
    setExt(ext);
  };

  const rootClassName = cn(s.treeInputContainer, {
    'folder-name monaco-icon-label': !defaultValue,
    'file-icon': type !== 'directory' && !defaultValue,
    'folder-icon': type === 'directory' && !defaultValue,
  });

  return (
    <div className={rootClassName} style={style}>
      {type === 'directory' ? (
        <FolderEdit inputRef={inputRef} defaultValue={defaultValue} />
      ) : (
        <FileEdit
          ext={ext}
          updateExt={updateExt}
          inputRef={inputRef}
          defaultValue={defaultValue}
        />
      )}
    </div>
  );
};

interface FolderEditProps {
  inputRef: React.RefObject<HTMLInputElement>;
  defaultValue?: string;
  style?: React.CSSProperties;
}

const FolderEdit: FC<FolderEditProps> = ({ inputRef, defaultValue }) => {
  return (
    <input ref={inputRef} className={s.treeInput} defaultValue={defaultValue} />
  );
};

interface FileEditProps {
  ext: string;
  inputRef: React.RefObject<HTMLInputElement>;
  updateExt: (e: React.ChangeEvent<HTMLInputElement>) => void;
  defaultValue?: string;
  style?: React.CSSProperties;
}

const FileEdit: FC<FileEditProps> = ({ inputRef, updateExt, defaultValue }) => {
  return (
    <input ref={inputRef} onChange={updateExt} defaultValue={defaultValue} />
  );
};

export default TreePlaceholderInput;
