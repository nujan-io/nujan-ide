import { FC } from 'react';

interface Props {
  className?: string;
}
const Telegram: FC<Props> = ({ className = '' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    width="28"
    height="28"
    viewBox="0 0 28 28"
    fill="none"
  >
    <path
      fill="currentColor"
      d="M23.082 4.787 4.482 12.39c-1.27.54-1.263 1.29-.233 1.625l4.776 1.58 11.05-7.39c.522-.337 1-.156.607.214l-8.953 8.563h-.002l.002.001-.33 5.218c.484 0 .697-.235.967-.512l2.32-2.39 4.825 3.777c.89.52 1.529.252 1.75-.873l3.168-15.822c.324-1.377-.497-2.001-1.346-1.594Z"
    />
  </svg>
);
export default Telegram;
