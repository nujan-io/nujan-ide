import { FC } from 'react';

interface Props {
  className?: string;
}
const Import: FC<Props> = ({ className = '' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    fill="none"
    viewBox="0 0 16 16"
    className={className}
  >
    <path
      fill="currentColor"
      fillRule="evenodd"
      d="M8.97 1.88c.288 0 .567.102.787.287l.08.073 2.702 2.702c.204.204.329.472.354.758l.005.108v7.094a1.224 1.224 0 0 1-1.133 1.222l-.091.003H8v-1.225h3.674V6.78H8.918a.918.918 0 0 1-.914-.83L8 5.86V3.105H4.326v4.899H3.102V3.105a1.225 1.225 0 0 1 1.132-1.221l.092-.003h4.645ZM5.372 9.513l1.732 1.733a.612.612 0 0 1 0 .865l-1.732 1.732a.612.612 0 1 1-.866-.866l.687-.686H2.489a.612.612 0 1 1 0-1.225h2.703l-.687-.686a.612.612 0 1 1 .866-.867ZM9.224 3.36v2.196h2.196L9.224 3.359Z"
      clipRule="evenodd"
    />
  </svg>
);
export default Import;
