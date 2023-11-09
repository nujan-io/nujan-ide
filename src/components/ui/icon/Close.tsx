import { FC } from 'react';

interface Props {
  className?: string;
}
const Close: FC<Props> = ({ className = '' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    width="17"
    height="18"
    viewBox="0 0 17 18"
    fill="none"
  >
    <path
      fill="currentColor"
      d="m8.645 8.127 4.667-4.666 1.334 1.334L9.979 9.46l4.667 4.667-1.334 1.333-4.667-4.667-4.666 4.667-1.333-1.334L7.313 9.46 2.646 4.794 3.98 3.463l4.666 4.666v-.002Z"
    />
  </svg>
);
export default Close;
