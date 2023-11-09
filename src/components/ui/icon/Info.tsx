import { FC } from 'react';

interface Props {
  className?: string;
}
const Info: FC<Props> = ({ className = '' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="29"
    height="28"
    viewBox="0 0 29 28"
    fill="none"
    className={className}
  >
    <path
      fill="currentColor"
      d="M14.5 19.158a.692.692 0 0 0 .511-.207.694.694 0 0 0 .207-.51.696.696 0 0 0-.207-.513.691.691 0 0 0-.51-.207.691.691 0 0 0-.512.207.695.695 0 0 0-.206.512c0 .203.068.373.206.511a.692.692 0 0 0 .511.207Zm-.583-3.455h1.166v-7.09h-1.166v7.09Zm-3.298 7.628-5.452-5.442v-7.773l5.441-5.452h7.774l5.451 5.441v7.774l-5.44 5.452h-7.774Zm.498-1.167h6.766l4.784-4.783v-6.767l-4.784-4.783h-6.766l-4.784 4.783v6.767l4.784 4.783Z"
    />
  </svg>
);
export default Info;
