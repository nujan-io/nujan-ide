/* eslint-disable no-useless-escape */
import { useLogActivity } from '@/hooks/logActivity.hooks';
import { useProjectActions } from '@/hooks/project.hooks';
import { useWorkspaceActions } from '@/hooks/workspace.hooks';
import { Analytics } from '@/utility/analytics';
import EventEmitter from '@/utility/eventEmitter';
import { getFileNameFromPath } from '@/utility/utils';
import { FC } from 'react';
import ExecuteFile from '../ExecuteFile';
import s from './TestCases.module.scss';

interface Props {
  projectId: string;
}

const TestCases: FC<Props> = ({ projectId }) => {
  const { createLog } = useLogActivity();

  const { getFileByPath, compileTsFile } = useWorkspaceActions();
  const { compileFuncProgram } = useProjectActions();

  const executeTestCases = async (filePath: string) => {
    const file = await getFileByPath(filePath, projectId);
    if (!file) return;
    let testCaseCode = '';

    try {
      testCaseCode = (await compileTsFile(file, projectId))[0].code;
    } catch (error) {
      if ((error as Error).message) {
        createLog((error as Error).message, 'error');
        return;
      }
      console.log(error);
      return;
    }

    // if (!cellBuilderRef.current?.contentWindow) return;

    const linesToRemove = [
      /import\s+['"]@ton-community\/test-utils['"];/g,
      /import\s+\{[^}]+\}\s+from\s+['"]@ton-community\/blueprint['"];/g,
    ];

    linesToRemove.forEach((pattern) => {
      testCaseCode = testCaseCode.replace(pattern, '');
    });

    // const compileBlockExp = /compile[^(]*\(([^)]*)\)/;
    const compileBlockExp = /compile\(['"]([^'"]+)['"]\)/g;

    const contractCompileBlock = compileBlockExp.exec(testCaseCode);
    const contractPath = contractCompileBlock?.[1].replace(/['"]/g, '');
    // if (!contractPath) {
    //   createLog('Please specify contract path', 'error');
    //   return;
    // }
    const contractFile = await getFileByPath(contractPath, projectId);
    if (contractPath && !contractFile) {
      createLog(
        `Contract file not found - ${contractPath}. Define correct absolute path. Ex. contracts/main.fc`,
        'error',
      );
      return;
    }

    let contractBOC = undefined;

    if (contractPath && contractCompileBlock && contractPath.includes('.fc')) {
      try {
        const contract = await compileFuncProgram(
          { path: contractPath },
          projectId,
        );
        contractBOC = contract.contractBOC;
        testCaseCode = testCaseCode.replace(
          contractCompileBlock[0],
          `bocToCell("${contractBOC}")`,
        );
        testCaseCode = `
        const {
        Cell,
      } = require("@ton/core");
        ${testCaseCode}
        `;
      } catch (error) {
        let _error = '';
        if (typeof error === 'string') {
          _error = error;
        } else if ((error as Error).message) {
          _error = (error as Error).message;
        }
        if (_error) {
          createLog(_error, 'error');
        }
      }
    }

    testCaseCode = testCaseCode
      .replace(/import\s*\'@ton-community\/test-utils\';+$/, '')
      .replace(/import\s*'@ton\/test-utils';\s*\n?/, '')
      .replace(/import\s*{/g, 'const {')
      .replace(
        /}\s*from\s*'@ton-community\/sandbox';/,
        '} = require("@ton/sandbox");',
      )
      .replace(/}\s*from\s*'@ton\/sandbox';/, '} = require("@ton/sandbox");')
      .replace(/}\s*from\s*'@ton\/core';/, '} = require("@ton/core");')
      .replace(/}\s*from\s*'ton-core';/, '} = require("@ton/core");');

    // eslint-disable-next-line no-useless-escape
    testCaseCode = `
    require("@ton\/test-utils");
    function bocToCell(codeBoc) {
      return Cell.fromBoc(Buffer.from(codeBoc, "base64"))[0];
    }
    
    ${testCaseCode}
    `;

    await runIt(filePath, testCaseCode);
  };

  const runIt = async (filePath: string, codeBase: string) => {
    const _webcontainerInstance = window.webcontainerInstance;
    filePath = getFileNameFromPath(filePath).replace('.spec.ts', '.spec.js');

    if (!_webcontainerInstance?.path) {
      return;
    }
    createLog('Running test cases...', 'info', true);
    await _webcontainerInstance.fs.writeFile(filePath, codeBase);

    const response = await _webcontainerInstance.spawn('npx', [
      'jest',
      filePath,
    ]);
    await response.output.pipeTo(
      new WritableStream({
        write(data) {
          EventEmitter.emit('TEST_CASE_LOG', data);
        },
      }),
    );
    Analytics.track('Execute Test Case', { platform: 'IDE', type: 'TON-func' });
  };

  return (
    <div className={s.root}>
      <ExecuteFile
        projectId={projectId}
        allowedFile={['spec.ts']}
        label={`Run`}
        description="Select .spec.ts file to run test cases"
        onClick={(e, data) => {
          executeTestCases(data).catch(() => {});
        }}
      />
    </div>
  );
};

export default TestCases;
