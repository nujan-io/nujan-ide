import { FC } from 'react';

interface Props {
  className?: string;
}
const Code: FC<Props> = ({ className = '' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="30"
    height="30"
    viewBox="0 0 30 30"
    fill="none"
    className={className}
  >
    <path
      fill="currentColor"
      d="m17.356 7-7.5 17 2.288 1.01 7.5-17L17.356 7Z"
    />
    <path
      fill="currentColor"
      d="m3.5 16 5.75 6.133L7.5 24 0 16l7.5-8 1.75 1.867L3.5 16Z"
    />
    <path
      fill="currentColor"
      d="m26.5 16-5.75 6.133L22.5 24l7.5-8-7.5-8-1.75 1.867L26.5 16Z"
    />
  </svg>
);
export default Code;
