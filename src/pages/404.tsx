import { Result } from 'antd';
import Link from 'next/link';

const pageNotFound = () => {
  return (
    <Result
      status="404"
      title="404"
      subTitle="Sorry, the page you visited does not exist."
      extra={
        <Link type="link" href="/">
          Back Home
        </Link>
      }
    />
  );
};

export default pageNotFound;
