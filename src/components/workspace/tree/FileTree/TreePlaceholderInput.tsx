import cn from 'clsx';
import { FC, useEffect, useRef, useState } from 'react';
import s from './FileTree.module.scss';

interface Props {
  type: any;
  onSubmit?: any;
  onCancel?: any;
  defaultValue?: any;
  style?: any;
}
const TreePlaceholderInput: FC<Props> = ({
  type,
  onSubmit,
  onCancel,
  defaultValue,
  style,
}) => {
  const [ext, setExt] = useState('');
  const inputRef = useRef<any>();

  useEffect(() => {
    if (!inputRef.current) return;
    inputRef.current.focus();
    inputRef.current.addEventListener('keyup', (e: any) => {
      if (e.key === 'Enter') {
        if (e.target.value) {
          onSubmit(e.target.value);
          return;
        }
        onCancel && onCancel();
      }
      if (e.key === 'Escape') {
        onCancel && onCancel();
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputRef]);

  const updateExt = (e: any) => {
    let splitted = e.target.value.split('.');
    let ext = splitted && splitted[splitted.length - 1];
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
        <FolderEdit
          style={style}
          name={name}
          inputRef={inputRef}
          defaultValue={defaultValue}
        />
      ) : (
        <FileEdit
          ext={ext}
          style={style}
          updateExt={updateExt}
          inputRef={inputRef}
          defaultValue={defaultValue}
        />
      )}
    </div>
  );
};

const FolderEdit = ({ inputRef, defaultValue }: any) => {
  return (
    <input ref={inputRef} className={s.treeInput} defaultValue={defaultValue} />
  );
};

const FileEdit = ({ ext, inputRef, updateExt, defaultValue }: any) => {
  return (
    <input ref={inputRef} onChange={updateExt} defaultValue={defaultValue} />
  );
};

export default TreePlaceholderInput;
