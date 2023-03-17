import { FC } from 'react';
import s from './HowToUse.module.scss';

const HowToUse: FC = () => {
  return (
    <div className={s.root}>
      <h2>
        <b>How to use:</b>
      </h2>
      <ol>
        <li>Create a new project with predefined template</li>
        <li>
          You will have 3 important files{' '}
          <b>main.fc, stateInit.cell.js, contract.cell.js and test.spec.js</b>
        </li>
        <li>
          <b>main.fc</b> is the root file which will be compiled. You do not
          have to import stdlib.fc. It is already included at built
          dyanamically.
        </li>
        <li>
          <b>stateInit.cell.js</b> contains a cell which will be used to deploy
          the contract. This will be initial state of the contract. To create a
          cell we are using tonweb.
        </li>
        <li>
          <b>contract.cell.js</b> contains a cell which will be used for further
          internal message.
        </li>
        <li>
          <b>test.spec.js</b> used to write test cases. Test cases will run on
          TON sandbox.
        </li>
        <li>Write your code. And Go to compile from sidebar</li>
        <li>
          Build your contract, deploy it and then you can interact with the
          contract using getter and setter options.
        </li>
        <li>
          Project can be made public from setting option. It will enable any
          user view and clone project.
        </li>
      </ol>
    </div>
  );
};

export default HowToUse;
