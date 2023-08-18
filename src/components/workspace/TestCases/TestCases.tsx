import { useLogActivity } from '@/hooks/logActivity.hooks';
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
  const { createLog } = useLogActivity();

  const cellBuilderRef = useRef<HTMLIFrameElement>(null);
  const { getFileByPath, compileTsFile, activeFile } = useWorkspaceActions();
  const { compileFuncProgram } = useProjectActions();

  const [selectedFilePath, setSelectedFilePath] = useState('');

  const executeTestCases = async (filePath: string) => {
    if (!isExecutedOnce) {
      return;
    }
    const file = await getFileByPath(filePath, projectId);
    if (!file) return;
    let testCaseCode = (await compileTsFile(file, projectId))[0].code;

    if (!cellBuilderRef.current?.contentWindow) return;

    // TODO: Handle toHaveTransaction
    const linesToRemove = [
      /import\s+['"]@ton-community\/test-utils['"];/g,
      /import\s+\{[^}]+\}\s+from\s+['"]@ton-community\/blueprint['"];/g,
      /expect\(.*\)\.toHaveTransaction\(\s*{[^}]+}\s*\);/g,
    ];

    linesToRemove.forEach((pattern) => {
      testCaseCode = testCaseCode.replace(pattern, '');
    });

    const compileBlockExp = /compile[^(]*\(([^)]*)\)/;

    const contractCompileBlock = testCaseCode.match(compileBlockExp);
    const contractPath = contractCompileBlock?.[1].replace(/['"]/g, '');
    if (!contractPath) {
      createLog('Please specify contract path', 'error');
      return;
    }
    const contractFile = await getFileByPath(contractPath, projectId);
    if (!contractFile) {
      createLog(
        `Contract file not found - ${contractPath}. Define correct absolute path. Ex. contracts/main.fc`,
        'error'
      );
      return;
    }

    let contractBOC = undefined;

    if (contractPath && contractPath.includes('.fc')) {
      try {
        const contract = await compileFuncProgram(
          { path: contractPath },
          projectId
        );
        contractBOC = contract?.contractBOC;
        testCaseCode = testCaseCode.replace(
          contractCompileBlock[0],
          `bocToCell("${contractBOC}")`
        );
      } catch (error: any) {
        let _error = '';
        if (typeof error === 'string') {
          _error = error;
        } else if (error?.message) {
          _error = error.message;
        }
        if (error) {
          createLog(error, 'error');
        }
      }
    }

    testCaseCode = testCaseCode
      .replace(/import\s*\'@ton-community\/test-utils\';+$/, '')
      .replace(/import\s*{/g, 'const {')
      .replace(/}\s*from\s*'@ton-community\/sandbox';/, '} = window.Sandbox;')
      .replace(/}\s*from\s*'ton-core';/, '} = window.TonCore;');

    try {
      cellBuilderRef.current.contentWindow.postMessage(
        {
          name: 'nujan-ton-ide',
          type: 'test-cases',
          code: testCaseCode,
        },
        '*'
      );
    } catch (error) {}
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
    executeTestCases(selectedFilePath);
  }, [executionCount]);

  return (
    <div className={s.root}>
      <ExecuteFile
        projectId={projectId}
        allowedFile={['spec.ts']}
        label={`Run`}
        description="Select .spec.ts file to run test cases"
        onClick={(e, data) => {
          if (data) {
            setSelectedFilePath(data);
          }
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
