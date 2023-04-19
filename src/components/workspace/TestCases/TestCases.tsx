import { useWorkspaceActions } from '@/hooks/workspace.hooks';
import { Button, message } from 'antd';
import { FC, useRef } from 'react';
import s from './TestCases.module.scss';

interface Props {
  codeBOC: string;
  projectId: string;
}
const TestCases: FC<Props> = ({ codeBOC, projectId }) => {
  const cellBuilderRef = useRef<HTMLIFrameElement>(null);
  const { getFileByPath } = useWorkspaceActions();

  const executeTestCases = async () => {
    // Include tests folder path
    const file = await getFileByPath('test.spec.js', projectId);

    if (!file) {
      message.error('test.spec.js file not found');
      return;
    }
    let testCaseCode = file.content;

    if (!cellBuilderRef.current?.contentWindow) return;
    if (testCaseCode?.includes('{CONTRACT_BOC}')) {
      testCaseCode = testCaseCode?.replace('{CONTRACT_BOC}', codeBOC);
    }
    cellBuilderRef.current.contentWindow.postMessage(
      {
        name: 'nujan-ton-ide',
        type: 'test-cases',
        code: testCaseCode,
      },
      '*'
    );
  };

  return (
    <div className={s.root}>
      <Button type="primary" onClick={executeTestCases}>
        Run Test Case
      </Button>
      <iframe
        className={s.testResult}
        ref={cellBuilderRef}
        src="/html/testcases.html"
      />
    </div>
  );
};

export default TestCases;
