import { FC } from 'react';

interface Props {
  className?: string;
}
const NewFile: FC<Props> = ({ className = '' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    width="22"
    height="23"
    viewBox="0 0 22 23"
    fill="none"
  >
    <path
      fill="currentColor"
      d="m12.493 4.62 3.414 3.467.106.426v1.974H15V9.473h-4v-4H5.987v11.04h4v.96h-4.48l-.48-.48v-12l.48-.48h6.72l.266.107Zm-.48.853v3.04h2.88l-2.88-3.04Zm4 14.027H15v-2.987h-2.987V15.5H15v-2.987h1.013V15.5H19v1.013h-2.987V19.5Z"
    />
  </svg>
);
export default NewFile;
