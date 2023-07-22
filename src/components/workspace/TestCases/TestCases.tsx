import { useProjectActions } from '@/hooks/project.hooks';
import { useWorkspaceActions } from '@/hooks/workspace.hooks';
import { FC, useEffect, useRef, useState } from 'react';
import ExecuteFile from '../ExecuteFile';
import s from './TestCases.module.scss';

interface Props {
  projectId: string;
}
const TestCases: FC<Props> = ({ projectId }) => {
  const [executionCount, setExecutionCount] = useState(0);
  const [isExecutedOnce, setIsExecutedOnce] = useState(false);
  const cellBuilderRef = useRef<HTMLIFrameElement>(null);
  const { getFileByPath, compileTsFile, activeFile } = useWorkspaceActions();
  const { compileFuncProgram } = useProjectActions();

  const currentActiveFile = activeFile(projectId as string);

  const executeTestCases = async (filePath: string) => {
    if (!isExecutedOnce) {
      return;
    }
    const file = await getFileByPath(filePath, projectId);
    if (!file) return;
    let testCaseCode = (await compileTsFile(file, projectId))[0].code;

    if (!cellBuilderRef.current?.contentWindow) return;

    const compileBlockExp = /compile[^(]*\(([^)]*)\)/;

    const contractCompileBlock = testCaseCode.match(compileBlockExp);
    const contractPath = contractCompileBlock?.[1].replace(/['"]/g, '');

    let contractBOC = undefined;

    if (contractPath && contractPath.includes('.fc')) {
      const contract = await compileFuncProgram(
        { path: contractPath },
        projectId
      );
      contractBOC = contract?.contractBOC;
      testCaseCode = testCaseCode.replace(
        contractCompileBlock[0],
        `bocToCell("${contractBOC}")`
      );
    }

    testCaseCode = testCaseCode
      .replace(/import\s*\'@ton-community\/test-utils\';+$/, '')
      .replace(/import\s*{/g, 'const {')
      .replace(/}\s*from\s*'@ton-community\/sandbox';/, '} = window.Sandbox;')
      .replace(/}\s*from\s*'ton-core';/, '} = window.TonCore;');

    cellBuilderRef.current.contentWindow.postMessage(
      {
        name: 'nujan-ton-ide',
        type: 'test-cases',
        code: testCaseCode,
      },
      '*'
    );
  };

  const reloadTestCases = () => {
    cellBuilderRef?.current?.contentWindow?.location.reload();
  };

  useEffect(() => {
    if (!cellBuilderRef.current) return;

    const handler = () => {
      setExecutionCount((prev) => prev + 1);
    };

    const currentRef = cellBuilderRef.current;
    currentRef.addEventListener('load', handler);
    return () => {
      currentRef.removeEventListener('load', handler);
    };
  }, [cellBuilderRef.current]);

  useEffect(() => {
    if (!executionCount) return;
    executeTestCases(currentActiveFile?.path as string);
  }, [executionCount]);

  return (
    <div className={s.root}>
      <ExecuteFile
        projectId={projectId}
        file={currentActiveFile}
        allowedFile={['spec.ts']}
        label={`Run`}
        description="Write a test case in a file with the extension spec.ts, and open it in a new tab to run it."
        onClick={(e, data) => {
          if (!isExecutedOnce) {
            setIsExecutedOnce(true);
          }
          if (executionCount === 0) {
            executeTestCases(data);
          } else {
            reloadTestCases();
          }
        }}
      />
      <iframe
        className={s.testResult}
        ref={cellBuilderRef}
        src="/html/testcases.html"
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );
};

export default TestCases;
