import { FC } from 'react';

interface Props {
  className?: string;
}
const Plus: FC<Props> = ({ className = '' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    className={className}
  >
    <path fill="currentColor" d="M14 7v1H8v6H7V8H1V7h6V1h1v6h6Z" />
  </svg>
);
export default Plus;
