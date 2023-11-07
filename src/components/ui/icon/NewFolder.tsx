import { FC } from 'react';

interface Props {
  className?: string;
}
const NewFolder: FC<Props> = ({ className = '' }) => (
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
      d="m17.507 5.473.48.534v4.48h-1.014l.054-1.974H10.68l-.853.854-.32.106H4.973V15.5h5.014v1.013H4.493l-.48-.533V4.993l.48-.48h5.014l.373.16.853.8h6.774ZM16.973 7.5l.054-1.013H10.52l-.373-.107-.854-.853H5.027v2.986h4.266l.854-.853.32-.16h6.506Zm-.96 12v-2.987H19V15.5h-2.987v-2.987H15V15.5h-2.987v1.013H15V19.5h1.013Z"
    />
  </svg>
);
export default NewFolder;
